import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

async function getOwnedResource(id: string, user: { id: string; role: string }) {
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return null;
  const business = await prisma.business.findUnique({ where: { id: resource.businessId } });
  if (!business || (business.ownerId !== user.id && user.role !== 'admin')) return null;
  return resource;
}

// PATCH /api/resources/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resource = await getOwnedResource(params.id, user);
    if (!resource) {
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
    if ('type' in body) {
      if (!body.type?.trim()) {
        return NextResponse.json({ error: 'type no puede estar vacío' }, { status: 400 });
      }
      data.type = body.type;
    }

    const updated = await prisma.resource.update({ where: { id: params.id }, data });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/resources/[id] - bloqueado si tiene alguna reserva asociada (cualquier estado)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resource = await getOwnedResource(params.id, user);
    if (!resource) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const bookingCount = await prisma.booking.count({ where: { resourceId: params.id } });
    if (bookingCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: tiene ${bookingCount} reserva(s) asociada(s) (incluye canceladas). Para conservar el historial, no se permite borrar recursos que alguna vez tuvieron reservas.`,
        },
        { status: 400 }
      );
    }

    await prisma.resource.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
