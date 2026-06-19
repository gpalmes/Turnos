import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/availability?businessId=xxx&resourceId=yyy&date=2024-06-18
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');
    const resourceId = req.nextUrl.searchParams.get('resourceId');
    const dateStr = req.nextUrl.searchParams.get('date');

    if (!businessId || !resourceId || !dateStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: businessId, resourceId, date' },
        { status: 400 }
      );
    }

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

    // Generate available slots (15-minute intervals) for each open block
    const slots: any[] = [];

    for (const block of openBlocks) {
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);

      let current = new Date(date);
      current.setHours(startHour, startMin, 0, 0);

      const blockEnd = new Date(date);
      blockEnd.setHours(endHour, endMin, 0, 0);

      while (current < blockEnd) {
        const slotEnd = new Date(current.getTime() + 15 * 60000);
        const slotMinutes = current.getHours() * 60 + current.getMinutes();
        const isBlocked = blockedRanges.some((r) => slotMinutes >= r.start && slotMinutes < r.end);

        if (!isBlocked) {
          const isBooked = bookings.some(
            (b) => b.startTime <= current && current < b.endTime
          );

          slots.push({
            startTime: current.toISOString(),
            endTime: slotEnd.toISOString(),
            available: !isBooked,
          });
        }

        current = slotEnd;
      }
    }

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
