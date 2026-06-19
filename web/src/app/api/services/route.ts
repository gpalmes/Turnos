import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET /api/services
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId parameter required' },
        { status: 400 }
      );
    }

    const services = await prisma.service.findMany({
      where: { businessId },
      include: { business: true },
    });

    return NextResponse.json(services, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/services
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, duration, price, businessId } = body;

    const durationNum = Number(duration);
    const priceNum = Number(price);

    if (!name?.trim() || !businessId || !Number.isFinite(durationNum) || durationNum <= 0 || !Number.isFinite(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: name, duration (>0), price (>=0), businessId' },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || (business.ownerId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        duration: durationNum,
        price: priceNum,
        businessId,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
