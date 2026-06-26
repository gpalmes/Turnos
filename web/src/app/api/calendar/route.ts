import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// GET /api/calendar?businessId=xxx&date=2026-06-29
// Datos para dibujar la agenda del día: horario abierto, bloqueos y reservas
// (con minutos desde medianoche, sin datos del cliente — vista pública).
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');
    const dateStr = req.nextUrl.searchParams.get('date');

    if (!businessId || !dateStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: businessId, date' },
        { status: 400 }
      );
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    const schedules = await prisma.schedule.findMany({
      where: { businessId, dayOfWeek, isActive: true },
    });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const exceptions = await prisma.availability.findMany({
      where: { businessId, date: { gte: startOfDay, lte: endOfDay } },
    });

    const openBlocks = [...schedules, ...exceptions.filter((e) => e.isAvailable)]
      .map((b) => ({ startMinutes: toMin(b.startTime), endMinutes: toMin(b.endTime) }))
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const blocked = exceptions
      .filter((e) => !e.isAvailable)
      .map((b) => ({ startMinutes: toMin(b.startTime), endMinutes: toMin(b.endTime) }));

    const bookingRows = await prisma.booking.findMany({
      where: { businessId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'cancelled' } },
      select: { id: true, resourceId: true, startTime: true, endTime: true, status: true },
    });

    const bookings = bookingRows.map((b) => {
      const startMinutes = b.startTime.getHours() * 60 + b.startTime.getMinutes();
      const durationMin = Math.round((b.endTime.getTime() - b.startTime.getTime()) / 60000);
      return {
        id: b.id,
        resourceId: b.resourceId,
        startMinutes,
        endMinutes: startMinutes + durationMin,
        status: b.status,
      };
    });

    const open = openBlocks.length
      ? {
          startMinutes: Math.min(...openBlocks.map((b) => b.startMinutes)),
          endMinutes: Math.max(...openBlocks.map((b) => b.endMinutes)),
        }
      : null;

    return NextResponse.json({ open, openBlocks, blocked, bookings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
