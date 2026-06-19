import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// GET /api/availability-exceptions?businessId=xxx
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId parameter required' },
        { status: 400 }
      );
    }

    const exceptions = await prisma.availability.findMany({
      where: { businessId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(exceptions, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/availability-exceptions
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, date, startTime, endTime, isAvailable, reason } = body;

    if (
      !businessId ||
      !date ||
      !TIME_RE.test(startTime) ||
      !TIME_RE.test(endTime) ||
      startTime >= endTime
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: businessId, date (YYYY-MM-DD), startTime/endTime (HH:MM, startTime < endTime)' },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || (business.ownerId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const [year, month, day] = date.split('-').map(Number);

    const exception = await prisma.availability.create({
      data: {
        businessId,
        date: new Date(year, month - 1, day),
        startTime,
        endTime,
        isAvailable: isAvailable ?? false,
        reason: reason?.trim() || null,
      },
    });

    return NextResponse.json(exception, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
