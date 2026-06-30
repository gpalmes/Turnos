import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET /api/businesses?category=Padel&withAvailability=true
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');
    const withAvailability = req.nextUrl.searchParams.get('withAvailability') === 'true';

    // Para calcular "abierto ahora" traemos los horarios activos de hoy.
    const now = new Date();
    const dayOfWeek = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // El directorio público solo muestra negocios aprobados por un admin.
    const where: any = { approved: true };
    if (category) where.category = category;

    const businesses = await prisma.business.findMany({
      where,
      include: {
        owner: { select: { id: true, email: true, name: true } },
        schedules: {
          where: { dayOfWeek, isActive: true },
          select: { startTime: true, endTime: true },
        },
        _count: {
          select: {
            services: true,
            resources: true,
            schedules: { where: { isActive: true } },
          },
        },
      },
    });

    const result = businesses.map(({ schedules, ...b }) => ({
      ...b,
      // "Reservable" = tiene al menos un servicio, un recurso y un horario activo.
      bookable: b._count.services > 0 && b._count.resources > 0 && b._count.schedules > 0,
      // "Abierto ahora" = hay un horario de hoy que cubre la hora actual.
      openNow: schedules.some(
        (s) => nowMinutes >= toMin(s.startTime) && nowMinutes < toMin(s.endTime)
      ),
    }));

    const filtered = withAvailability ? result.filter((b) => b.bookable) : result;

    return NextResponse.json(filtered, { status: 200 });
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

    // Se crea PENDIENTE de aprobación: no se publica hasta que un admin lo apruebe.
    // El rol del usuario cambia a "operator" recién al aprobarse.
    const business = await prisma.business.create({
      data: {
        name,
        category,
        timezone: timezone || 'UTC',
        address,
        phone,
        email,
        ownerId: user.id,
        approved: false,
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
