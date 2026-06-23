import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

async function getOwnedService(id: string, user: { id: string; role: string }) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return null;
  const business = await prisma.business.findUnique({ where: { id: service.businessId } });
  if (!business || (business.ownerId !== user.id && user.role !== 'admin')) return null;
  return service;
}

// PATCH /api/services/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const service = await getOwnedService(params.id, user);
    if (!service) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, any> = {};

    if ('name' in body) {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: 'name no puede estar vacío' }, { status: 400 });
      }
      data.name = body.name;
    }
    if ('description' in body) {
      data.description = body.description?.trim() ? body.description : null;
    }
    if ('duration' in body) {
      const durationNum = Number(body.duration);
      if (!Number.isFinite(durationNum) || durationNum <= 0) {
        return NextResponse.json({ error: 'duration debe ser > 0' }, { status: 400 });
      }
      data.duration = durationNum;
    }
    if ('price' in body) {
      const priceNum = Number(body.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return NextResponse.json({ error: 'price debe ser >= 0' }, { status: 400 });
      }
      data.price = priceNum;
    }

    const updated = await prisma.service.update({ where: { id: params.id }, data });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/services/[id] - bloqueado si tiene alguna reserva asociada (cualquier estado)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const service = await getOwnedService(params.id, user);
    if (!service) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const bookingCount = await prisma.booking.count({ where: { serviceId: params.id } });
    if (bookingCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: tiene ${bookingCount} reserva(s) asociada(s) (incluye canceladas). Para conservar el historial, no se permite borrar servicios que alguna vez tuvieron reservas.`,
        },
        { status: 400 }
      );
    }

    await prisma.service.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
