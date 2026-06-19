import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET /api/businesses
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
    });
    return NextResponse.json(businesses, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/businesses
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, timezone, address, phone, email } = body;

    if (!name?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category' },
        { status: 400 }
      );
    }

    const business = await prisma.business.create({
      data: {
        name,
        category,
        timezone: timezone || 'UTC',
        address,
        phone,
        email,
        ownerId: user.id,
      },
    });

    if (user.role === 'client') {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'operator' } });
    }

    return NextResponse.json(business, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
