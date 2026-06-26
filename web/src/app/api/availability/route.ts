import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/availability?businessId=xxx&resourceId=yyy&date=2024-06-18&durationMinutes=60
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');
    const resourceId = req.nextUrl.searchParams.get('resourceId');
    const dateStr = req.nextUrl.searchParams.get('date');
    const durationParam = req.nextUrl.searchParams.get('durationMinutes');

    if (!businessId || !resourceId || !dateStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: businessId, resourceId, date' },
        { status: 400 }
      );
    }

    // Duración del turno: cuánto tiene que estar libre desde el inicio del slot.
    // Si no se pasa, cae a 15 min (comportamiento histórico de slot suelto).
    const durationMinutes = durationParam ? parseInt(durationParam, 10) : 15;
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return NextResponse.json({ error: 'durationMinutes inválido' }, { status: 400 });
    }

    // Cada cuánto se ofrece un horario de inicio. Por defecto 15 min.
    const stepParam = req.nextUrl.searchParams.get('stepMinutes');
    const stepMinutes = stepParam ? parseInt(stepParam, 10) : 15;
    if (!Number.isFinite(stepMinutes) || stepMinutes <= 0) {
      return NextResponse.json({ error: 'stepMinutes inválido' }, { status: 400 });
    }

    // El negocio define la anticipación mínima (mismo criterio que POST /api/bookings).
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { minAdvanceHours: true },
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    // Sin anticipación mínima: solo se considera "no disponible" lo que ya pasó.
    const earliestBookable = Date.now();

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    // Get business schedule blocks for this day (puede haber mas de uno: turnos partidos)
    const schedules = await prisma.schedule.findMany({
      where: {
        businessId,
        dayOfWeek,
        isActive: true,
      },
    });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Excepciones puntuales para esta fecha exacta (feriados, horario especial, etc.)
    const exceptions = await prisma.availability.findMany({
      where: { businessId, date: { gte: startOfDay, lte: endOfDay } },
    });

    const openBlocks = [
      ...schedules,
      ...exceptions.filter((e) => e.isAvailable),
    ];

    if (openBlocks.length === 0) {
      return NextResponse.json(
        { slots: [], message: 'No schedule available for this day' },
        { status: 200 }
      );
    }

    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const blockedRanges = exceptions
      .filter((e) => !e.isAvailable)
      .map((e) => ({ start: toMinutes(e.startTime), end: toMinutes(e.endTime) }));

    // Get existing bookings for this resource on this date
    const bookings = await prisma.booking.findMany({
      where: {
        resourceId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { not: 'cancelled' },
      },
    });

    // Generamos posibles horas de inicio cada 15 min. Un slot sólo se ofrece si el
    // turno completo (inicio + duración) entra en el bloque y no pisa nada.
    const STEP_MS = stepMinutes * 60000;
    const durationMs = durationMinutes * 60000;
    const slots: any[] = [];

    for (const block of openBlocks) {
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);

      const blockStart = new Date(date);
      blockStart.setHours(startHour, startMin, 0, 0);

      const blockEnd = new Date(date);
      blockEnd.setHours(endHour, endMin, 0, 0);

      let current = new Date(blockStart);

      while (current.getTime() + durationMs <= blockEnd.getTime()) {
        const slotEnd = new Date(current.getTime() + durationMs);
        const startMinutes = current.getHours() * 60 + current.getMinutes();
        const endMinutes = startMinutes + durationMinutes;

        // ¿El turno completo cae sobre algún rango bloqueado (excepción no disponible)?
        const hitsBlocked = blockedRanges.some(
          (r) => startMinutes < r.end && endMinutes > r.start
        );
        // ¿Se solapa con una reserva existente del mismo recurso?
        const isBooked = bookings.some(
          (b) => b.startTime < slotEnd && current < b.endTime
        );
        // ¿Respeta la anticipación mínima del negocio (y no es en el pasado)?
        const tooSoon = current.getTime() < earliestBookable;

        // Estado del slot:
        //  - 'unavailable' (No disponible): pasado / bloqueado (excepción no disponible).
        //  - 'booked' (Ocupado): ya hay una reserva.
        //  - 'free' (Libre): se puede reservar.
        let status: 'free' | 'booked' | 'unavailable';
        if (hitsBlocked || tooSoon) {
          status = 'unavailable';
        } else if (isBooked) {
          status = 'booked';
        } else {
          status = 'free';
        }

        // Hora de pared del inicio (HH:MM), para que el calendario alinee sin
        // depender de la zona horaria del cliente.
        const startLabel = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
        slots.push({
          startTime: current.toISOString(),
          endTime: slotEnd.toISOString(),
          start: startLabel,
          status,
          available: status === 'free',
        });

        current = new Date(current.getTime() + STEP_MS);
      }
    }

    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Devolvemos también los bloques de horario abiertos del día para que el
    // calendario arme su eje de horas alineado al horario cargado del negocio.
    const blocks = openBlocks.map((b) => ({ startTime: b.startTime, endTime: b.endTime }));

    return NextResponse.json({ slots, openBlocks: blocks }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
