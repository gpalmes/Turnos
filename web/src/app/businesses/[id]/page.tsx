import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import EditBusinessForm from '@/components/business/EditBusinessForm';
import CreateServiceForm from '@/components/business/CreateServiceForm';
import CreateResourceForm from '@/components/business/CreateResourceForm';
import CreateScheduleForm from '@/components/business/CreateScheduleForm';
import CreateAvailabilityExceptionForm from '@/components/business/CreateAvailabilityExceptionForm';
import ServiceRow from '@/components/business/ServiceRow';
import ResourceRow from '@/components/business/ResourceRow';
import ScheduleRow from '@/components/business/ScheduleRow';
import AvailabilityExceptionRow from '@/components/business/AvailabilityExceptionRow';
import DeleteBusinessForm from '@/components/business/DeleteBusinessForm';
import OwnerBookingRow from '@/components/business/OwnerBookingRow';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { email: true } },
      services: { orderBy: { createdAt: 'desc' }, include: { resources: true } },
      resources: { orderBy: { createdAt: 'desc' } },
      schedules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      availability: { orderBy: { date: 'asc' } },
    },
  });

  if (!business || (business.ownerId !== user.id && user.role !== 'admin')) {
    notFound();
  }

  // Reservas recibidas en este negocio (las que hicieron los clientes).
  const bookings = await prisma.booking.findMany({
    where: { businessId: business.id },
    orderBy: { startTime: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      service: { select: { name: true } },
      resource: { select: { name: true } },
    },
  });

  return (
    <Container>
      <Link href="/businesses" className="mb-4 inline-block text-sm text-gray-500 hover:text-brand-600">
        ← Mis negocios
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">{business.name}</h1>
      <p className="mt-1 text-sm text-gray-500">{business.category} · {business.timezone}</p>
      {business.ownerId !== user.id && (
        <p className="mt-2 inline-block rounded-lg bg-amber-50 px-3 py-1 text-sm text-amber-700">
          Viendo como administrador — dueño: {business.owner.email}
        </p>
      )}

      <div className="mt-6">
        <Tabs
          tabs={[
            {
              label: `Reservas${bookings.length ? ` (${bookings.length})` : ''}`,
              content: (
                <Card>
                  <h2 className="text-base font-semibold text-gray-900">Reservas recibidas</h2>
                  {bookings.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">Todavía no recibiste reservas.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-gray-100">
                      {bookings.map((b) => (
                        <OwnerBookingRow
                          key={b.id}
                          booking={{
                            id: b.id,
                            startTime: b.startTime.toISOString(),
                            status: b.status,
                            clientName: b.user.name,
                            clientEmail: b.user.email,
                            serviceName: b.service.name,
                            resourceName: b.resource.name,
                          }}
                        />
                      ))}
                    </ul>
                  )}
                </Card>
              ),
            },
            {
              label: 'Servicios y recursos',
              content: (
                <div className="flex flex-col gap-6">
                  <Card>
                    <h2 className="text-base font-semibold text-gray-900">Servicios</h2>
                    {business.services.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">Todavía no hay servicios.</p>
                    ) : (
                      <ul className="mt-3 divide-y divide-gray-100">
                        {business.services.map((s) => (
                          <ServiceRow
                            key={s.id}
                            service={s}
                            allResources={business.resources.map((r) => ({ id: r.id, name: r.name }))}
                          />
                        ))}
                      </ul>
                    )}
                    <CreateServiceForm businessId={business.id} />
                  </Card>

                  <Card>
                    <h2 className="text-base font-semibold text-gray-900">Recursos</h2>
                    {business.resources.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">Todavía no hay recursos.</p>
                    ) : (
                      <ul className="mt-3 divide-y divide-gray-100">
                        {business.resources.map((r) => (
                          <ResourceRow key={r.id} resource={r} />
                        ))}
                      </ul>
                    )}
                    <CreateResourceForm businessId={business.id} />
                  </Card>
                </div>
              ),
            },
            {
              label: 'Horarios',
              content: (
                <div className="flex flex-col gap-6">
                  <Card>
                    <h2 className="text-base font-semibold text-gray-900">Horario semanal</h2>
                    {business.schedules.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">Todavía no configuraste el horario.</p>
                    ) : (
                      <ul className="mt-3 divide-y divide-gray-100">
                        {business.schedules.map((s) => (
                          <ScheduleRow key={s.id} schedule={s} />
                        ))}
                      </ul>
                    )}
                    <CreateScheduleForm businessId={business.id} />
                  </Card>

                  <Card>
                    <h2 className="text-base font-semibold text-gray-900">Excepciones de disponibilidad</h2>
                    {business.availability.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">No hay excepciones configuradas.</p>
                    ) : (
                      <ul className="mt-3 divide-y divide-gray-100">
                        {business.availability.map((a) => (
                          <AvailabilityExceptionRow key={a.id} exception={a} />
                        ))}
                      </ul>
                    )}
                    <CreateAvailabilityExceptionForm businessId={business.id} />
                  </Card>
                </div>
              ),
            },
            {
              label: 'General',
              content: (
                <div className="flex flex-col gap-6">
                  <Card>
                    <EditBusinessForm business={business} />
                  </Card>

                  <Card className="border-red-200">
                    <h2 className="text-base font-semibold text-red-700">Zona de peligro</h2>
                    <div className="mt-3">
                      <DeleteBusinessForm businessId={business.id} businessName={business.name} />
                    </div>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </div>
    </Container>
  );
}
