import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET /api/resources?businessId=xxx
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');
    const serviceId = req.nextUrl.searchParams.get('serviceId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId parameter required' },
        { status: 400 }
      );
    }

    // Si el servicio tiene recursos asociados, filtrar a solo esos. Si tiene 0 (nunca se
    // configuró la asociación), mostrar todos los recursos del negocio igual que antes de
    // que existiera esta relación - evita romper negocios que no la usan. Esto vuelve
    // "sin configurar" indistinguible de "configurado para ninguno", aceptable por ahora.
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { resources: true },
      });

      if (service && service.resources.length > 0) {
        const resources = await prisma.resource.findMany({
          where: { businessId, services: { some: { id: serviceId } } },
          include: { services: true },
        });
        return NextResponse.json(resources, { status: 200 });
      }
    }

    const resources = await prisma.resource.findMany({
      where: { businessId },
      include: { services: true },
    });

    return NextResponse.json(resources, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/resources
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, businessId } = body;

    if (!name?.trim() || !type?.trim() || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, businessId' },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || (business.ownerId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const resource = await prisma.resource.create({
      data: { name, type, businessId },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
