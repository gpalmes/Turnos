import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient, RECEIPTS_BUCKET } from '@/utils/supabase/admin';

// GET /api/bookings/[id] - Detalle de la reserva según el rol del que mira.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        business: { select: { ownerId: true, name: true } },
        service: { select: { name: true, duration: true, price: true } },
        resource: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const isOwner = !!user && booking.business.ownerId === user.id;
    const isAdmin = user?.role === 'admin';
    const isOwnBooking = !!user && booking.userId === user.id;
    const canManage = isOwner || isAdmin;

    // Base visible para todos (ocupación, sin datos sensibles).
    const base = {
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      serviceName: booking.service.name,
      resourceName: booking.resource.name,
      businessName: booking.business.name,
      canManage,
      canCancel: canManage || isOwnBooking,
    };

    if (!canManage && !isOwnBooking) {
      return NextResponse.json(base, { status: 200 });
    }

    // Comprobante: link firmado temporal (solo si lo puede ver).
    let receiptUrl: string | null = null;
    if (booking.receiptPath) {
      try {
        const admin = createAdminClient();
        const { data } = await admin.storage
          .from(RECEIPTS_BUCKET)
          .createSignedUrl(booking.receiptPath, 60 * 60);
        receiptUrl = data?.signedUrl ?? null;
      } catch {
        receiptUrl = null;
      }
    }

    return NextResponse.json(
      {
        ...base,
        price: booking.service.price,
        client: canManage ? { name: booking.user.name, email: booking.user.email } : undefined,
        payment: {
          status: booking.paymentStatus,
          amount: booking.paymentAmount,
          method: booking.paymentMethod,
          receiptUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] - Confirmar o cancelar reserva
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { business: true },
    });

    const isOwnBooking = booking?.userId === user.id;
    const isBusinessOwner = booking?.business.ownerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!booking || (!isOwnBooking && !isBusinessOwner && !isAdmin)) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { action, force } = body;

    // Confirmar: solo el dueño del negocio (o admin), sobre reservas pendientes.
    if (action === 'confirm') {
      if (!isBusinessOwner && !isAdmin) {
        return NextResponse.json({ error: 'No tenés permisos para confirmar' }, { status: 403 });
      }
      if (booking.status !== 'pending') {
        return NextResponse.json(
          { error: 'Solo se pueden confirmar reservas pendientes' },
          { status: 400 }
        );
      }

      const confirmed = await prisma.booking.update({
        where: { id: params.id },
        data: { status: 'confirmed' },
      });
      return NextResponse.json(confirmed, { status: 200 });
    }

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'La reserva ya estaba cancelada' }, { status: 400 });
    }

    // Solo dueño del negocio o admin pueden cancelar con force=true
    if (force && !isBusinessOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permisos para esta acción' }, { status: 403 });
    }

    // El cliente que reservó respeta la ventana de cancelación del negocio;
    // el dueño del negocio (o un admin) puede cancelar en cualquier momento.
    if (isOwnBooking && !isBusinessOwner && !isAdmin && !force) {
      const cancellationMs = booking.business.cancellationHours * 60 * 60 * 1000;
      if (booking.startTime.getTime() - Date.now() < cancellationMs) {
        return NextResponse.json(
          {
            error:
              booking.business.cancellationHours > 0
                ? `No se puede cancelar con menos de ${booking.business.cancellationHours} hora(s) de anticipación`
                : 'No se puede cancelar una reserva que ya pasó',
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings/[id] - Eliminar reserva completamente
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { business: true },
    });

    const isOwnBooking = booking?.userId === user.id;
    const isBusinessOwner = booking?.business.ownerId === user.id;
    const isAdmin = user.role === 'admin';

    // Solo el dueño de la reserva, dueño del negocio o admin pueden borrar
    if (!booking || (!isOwnBooking && !isBusinessOwner && !isAdmin)) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    // El cliente puede borrar:
    // - Reservas futuras (no importa el estado)
    // - Reservas canceladas (incluso si pasaron)
    if (isOwnBooking && !isBusinessOwner && !isAdmin) {
      const isPastAndNotCancelled = booking.startTime.getTime() < Date.now() && booking.status !== 'cancelled';
      if (isPastAndNotCancelled) {
        return NextResponse.json(
          { error: 'No se pueden borrar reservas que ya pasaron, a menos que estén canceladas' },
          { status: 400 }
        );
      }
    }

    await prisma.booking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Reserva eliminada' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
