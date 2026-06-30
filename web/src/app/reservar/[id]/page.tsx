import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { emojiFor } from '@/lib/rubros';
import BusinessStorefront from '@/components/BusinessStorefront';

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Página pública del negocio (vitrina): cualquiera puede ver y empezar a reservar.
export default async function ReservarPage({ params }: { params: { id: string } }) {
  const now = new Date();
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      services: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, duration: true, price: true },
      },
      resources: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true } },
      schedules: {
        where: { dayOfWeek: now.getDay(), isActive: true },
        select: { startTime: true, endTime: true },
      },
    },
  });

  // Solo negocios aprobados son visibles públicamente.
  if (!business || !business.approved) {
    notFound();
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openNow = business.schedules.some(
    (s) => nowMinutes >= toMin(s.startTime) && nowMinutes < toMin(s.endTime)
  );

  return (
    <div>
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 sm:h-56">
        {business.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.imageUrl} alt={business.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">
            {emojiFor(business.category)}
          </div>
        )}
        <Link
          href="/"
          className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-white"
        >
          ← Volver
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6">
        {/* Encabezado */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{business.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {emojiFor(business.category)} {business.category}
                {business.address ? ` · ${business.address}` : ''}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                openNow ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {openNow ? 'Abierto ahora' : 'Cerrado'}
            </span>
          </div>
        </div>

        {/* Vitrina */}
        <div className="py-8">
          <BusinessStorefront
            business={{ id: business.id, name: business.name }}
            services={business.services}
            resources={business.resources}
          />
        </div>
      </div>
    </div>
  );
}
