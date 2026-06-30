import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { notify } from '@/lib/notify';

// GET /api/bookings
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const businessId = req.nextUrl.searchParams.get('businessId');

    const where: any = {};

    if (businessId) {
      // Vista del dueño: si pide las reservas de un negocio, tiene que ser el dueño
      // (o admin). En ese caso ve TODAS las reservas del negocio, no sólo las propias.
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true },
      });

      const isOwner = business?.ownerId === user.id;
      const isAdmin = user.role === 'admin';

      if (!business || (!isOwner && !isAdmin)) {
        // No es dueño: sólo puede ver sus propias reservas dentro de ese negocio.
        where.userId = user.id;
      }
      where.businessId = businessId;
    } else {
      // Sin businessId: vista del cliente, sólo sus reservas.
      where.userId = user.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        business: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, duration: true } },
        resource: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, serviceId, resourceId, startTime, notes } = body;

    if (!businessId || !serviceId || !resourceId || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch service to get duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { resources: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Si el servicio tiene recursos asociados, el resourceId elegido tiene que estar
    // entre ellos (mismo criterio que GET /api/resources: 0 asociados = sin restricción).
    if (service.resources.length > 0 && !service.resources.some((r) => r.id === resourceId)) {
      return NextResponse.json(
        { error: 'El recurso elegido no está disponible para este servicio' },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({ where: { id: service.businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);

    // Se permite reservar en cualquier horario futuro, sin anticipación mínima.
    if (startDateTime.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'No se puede reservar en el pasado' },
        { status: 400 }
      );
    }

    // Solapamiento: el mismo recurso no puede tener dos reservas que se cruzan en el tiempo.
    const overlapping = await prisma.booking.findFirst({
      where: {
        resourceId,
        status: { not: 'cancelled' },
        startTime: { lt: endDateTime },
        endTime: { gt: startDateTime },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'El recurso ya tiene una reserva en ese horario' },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        businessId,
        serviceId,
        resourceId,
        startTime: startDateTime,
        endTime: endDateTime,
        notes,
        status: 'pending',
      },
    });

    // Avisar al dueño del negocio que recibió una reserva nueva.
    await notify(
      business.ownerId,
      `Nueva reserva en "${business.name}" para el ${startDateTime.toLocaleString('es-AR')}.`,
      `/businesses/${business.id}`
    );

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
