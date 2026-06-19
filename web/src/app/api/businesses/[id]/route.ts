import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// PATCH /api/businesses/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const business = await prisma.business.findUnique({ where: { id: params.id } });
    if (!business || (business.ownerId !== user.id && user.role !== 'admin')) {
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
    if ('category' in body) {
      if (!body.category?.trim()) {
        return NextResponse.json({ error: 'category no puede estar vacío' }, { status: 400 });
      }
      data.category = body.category;
    }
    // address/phone/email: enviado como '' significa "borrar" (null), no enviado significa "no tocar".
    for (const field of ['timezone', 'address', 'phone', 'email']) {
      if (field in body) {
        data[field] = body[field]?.trim() ? body[field] : null;
      }
    }
    if ('timezone' in body && !data.timezone) {
      data.timezone = 'UTC';
    }

    for (const field of ['minAdvanceHours', 'cancellationHours']) {
      if (field in body) {
        const num = Number(body[field]);
        if (!Number.isInteger(num) || num < 0) {
          return NextResponse.json({ error: `${field} debe ser un entero >= 0` }, { status: 400 });
        }
        data[field] = num;
      }
    }

    const updated = await prisma.business.update({ where: { id: params.id }, data });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
