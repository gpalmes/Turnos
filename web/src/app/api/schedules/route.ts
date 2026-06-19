import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// GET /api/schedules?businessId=xxx
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId parameter required' },
        { status: 400 }
      );
    }

    const schedules = await prisma.schedule.findMany({
      where: { businessId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json(schedules, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/schedules
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, dayOfWeek, startTime, endTime } = body;

    const dayNum = Number(dayOfWeek);

    if (
      !businessId ||
      !Number.isInteger(dayNum) || dayNum < 0 || dayNum > 6 ||
      !TIME_RE.test(startTime) || !TIME_RE.test(endTime) ||
      startTime >= endTime
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: businessId, dayOfWeek (0-6), startTime/endTime (HH:MM, startTime < endTime)' },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || (business.ownerId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const schedule = await prisma.schedule.upsert({
      where: {
        business_day_range: { businessId, dayOfWeek: dayNum, startTime, endTime },
      },
      create: { businessId, dayOfWeek: dayNum, startTime, endTime, isActive: true },
      update: { isActive: true },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
