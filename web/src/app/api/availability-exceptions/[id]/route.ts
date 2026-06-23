import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

async function getOwnedException(id: string, user: { id: string; role: string }) {
  const exception = await prisma.availability.findUnique({ where: { id } });
  if (!exception) return null;
  const business = await prisma.business.findUnique({ where: { id: exception.businessId } });
  if (!business || (business.ownerId !== user.id && user.role !== 'admin')) return null;
  return exception;
}

// PATCH /api/availability-exceptions/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const exception = await getOwnedException(params.id, user);
    if (!exception) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const startTime = 'startTime' in body ? body.startTime : exception.startTime;
    const endTime = 'endTime' in body ? body.endTime : exception.endTime;

    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime) || startTime >= endTime) {
      return NextResponse.json(
        { error: 'Invalid fields: startTime/endTime (HH:MM, startTime < endTime)' },
        { status: 400 }
      );
    }

    const data: Record<string, any> = { startTime, endTime };

    if ('date' in body) {
      const [year, month, day] = String(body.date).split('-').map(Number);
      data.date = new Date(year, month - 1, day);
    }
    if ('isAvailable' in body) {
      data.isAvailable = Boolean(body.isAvailable);
    }
    if ('reason' in body) {
      data.reason = body.reason?.trim() ? body.reason : null;
    }

    const updated = await prisma.availability.update({ where: { id: params.id }, data });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/availability-exceptions/[id] - no hay relacion con Booking, se puede borrar siempre
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const exception = await getOwnedException(params.id, user);
    if (!exception) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await prisma.availability.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
