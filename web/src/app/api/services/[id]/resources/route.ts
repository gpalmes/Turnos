import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// PUT /api/services/[id]/resources
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const service = await prisma.service.findUnique({ where: { id: params.id } });
    if (!service) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const business = await prisma.business.findUnique({ where: { id: service.businessId } });
    if (!business || (business.ownerId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const resourceIds = [...new Set<string>(body.resourceIds ?? [])];

    if (resourceIds.length > 0) {
      const validResources = await prisma.resource.findMany({
        where: { id: { in: resourceIds }, businessId: service.businessId },
      });
      if (validResources.length !== resourceIds.length) {
        return NextResponse.json(
          { error: 'Uno o más resourceIds no existen o no pertenecen a este negocio' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.service.update({
      where: { id: params.id },
      data: { resources: { set: resourceIds.map((id) => ({ id })) } },
      include: { resources: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
