import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

async function getOwnedSchedule(id: string, user: { id: string; role: string }) {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) return null;
  const business = await prisma.business.findUnique({ where: { id: schedule.businessId } });
  if (!business || (business.ownerId !== user.id && user.role !== 'admin')) return null;
  return schedule;
}

// PATCH /api/schedules/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const schedule = await getOwnedSchedule(params.id, user);
    if (!schedule) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const dayOfWeek = 'dayOfWeek' in body ? Number(body.dayOfWeek) : schedule.dayOfWeek;
    const startTime = 'startTime' in body ? body.startTime : schedule.startTime;
    const endTime = 'endTime' in body ? body.endTime : schedule.endTime;
    const isActive = 'isActive' in body ? Boolean(body.isActive) : schedule.isActive;

    if (
      !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 ||
      !TIME_RE.test(startTime) || !TIME_RE.test(endTime) ||
      startTime >= endTime
    ) {
      return NextResponse.json(
        { error: 'Invalid fields: dayOfWeek (0-6), startTime/endTime (HH:MM, startTime < endTime)' },
        { status: 400 }
      );
    }

    const updated = await prisma.schedule.update({
      where: { id: params.id },
      data: { dayOfWeek, startTime, endTime, isActive },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un bloque con ese día y horario' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/schedules/[id] - no hay relacion con Booking, se puede borrar siempre
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const schedule = await getOwnedSchedule(params.id, user);
    if (!schedule) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await prisma.schedule.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
