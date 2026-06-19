import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// PATCH /api/bookings/[id] - por ahora solo soporta cancelar
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
    if (body.status !== 'cancelled') {
      return NextResponse.json({ error: 'Solo se soporta status: "cancelled"' }, { status: 400 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'La reserva ya estaba cancelada' }, { status: 400 });
    }

    // El cliente que reservó respeta la ventana de cancelación del negocio;
    // el dueño del negocio (o un admin) puede cancelar en cualquier momento.
    if (isOwnBooking && !isBusinessOwner && !isAdmin) {
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
