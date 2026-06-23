import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Container from '@/components/ui/Container';
import BusinessBooking from '@/components/BusinessBooking';

// Página pública del negocio: cualquiera puede ver disponibilidad y empezar a reservar.
export default async function ReservarPage({ params }: { params: { id: string } }) {
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      resources: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true } },
    },
  });

  if (!business) {
    notFound();
  }

  return (
    <Container wide>
      <Link href="/" className="mb-4 inline-block text-sm text-gray-500 hover:text-brand-600">
        ← Volver
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">{business.name}</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        {business.category}
        {business.address ? ` · ${business.address}` : ''}
      </p>

      <BusinessBooking
        business={{ id: business.id, name: business.name }}
        resources={business.resources}
      />
    </Container>
  );
}
