import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import EditBusinessForm from '@/components/business/EditBusinessForm';
import CreateServiceForm from '@/components/business/CreateServiceForm';
import CreateResourceForm from '@/components/business/CreateResourceForm';
import CreateScheduleForm from '@/components/business/CreateScheduleForm';
import AssociateResourcesForm from '@/components/business/AssociateResourcesForm';
import CreateAvailabilityExceptionForm from '@/components/business/CreateAvailabilityExceptionForm';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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

      <div className="mt-6 flex flex-col gap-6">
        <Card>
          <EditBusinessForm business={business} />
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900">Servicios</h2>
          {business.services.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Todavía no hay servicios.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {business.services.map((s) => (
                <li key={s.id} className="py-3">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{s.name}</span> — {s.duration} min — ${s.price}
                  </p>
                  <AssociateResourcesForm
                    serviceId={s.id}
                    allResources={business.resources.map((r) => ({ id: r.id, name: r.name }))}
                    selectedResourceIds={s.resources.map((r) => r.id)}
                  />
                </li>
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
                <li key={r.id} className="py-2 text-sm text-gray-900">
                  {r.name} <span className="text-gray-500">({r.type})</span>
                </li>
              ))}
            </ul>
          )}
          <CreateResourceForm businessId={business.id} />
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900">Horario semanal</h2>
          {business.schedules.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Todavía no configuraste el horario.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {business.schedules.map((s) => (
                <li key={s.id} className="py-2 text-sm text-gray-900">
                  {DIAS[s.dayOfWeek]}: {s.startTime} - {s.endTime}
                </li>
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
                <li key={a.id} className="py-2 text-sm text-gray-900">
                  {a.date.toLocaleDateString('es-AR')} {a.startTime}-{a.endTime}: {a.isAvailable ? 'Abierto extra' : 'Cerrado'}
                  {a.reason ? <span className="text-gray-500"> ({a.reason})</span> : ''}
                </li>
              ))}
            </ul>
          )}
          <CreateAvailabilityExceptionForm businessId={business.id} />
        </Card>
      </div>
    </Container>
  );
}
