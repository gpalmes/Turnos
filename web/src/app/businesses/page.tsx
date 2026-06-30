import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import CreateBusinessForm from '@/components/business/CreateBusinessForm';
import ApproveBusinessButton from '@/components/business/ApproveBusinessButton';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';

export default async function BusinessesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.role === 'admin';

  const businesses = await prisma.business.findMany({
    where: isAdmin ? {} : { ownerId: user.id },
    include: { owner: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const pending = businesses.filter((b) => !b.approved);
  const approved = businesses.filter((b) => b.approved);

  return (
    <Container title={isAdmin ? 'Negocios' : 'Mis negocios'}>
      {/* Panel de aprobación (solo admin) */}
      {isAdmin && (
        <Card className="mb-8 border-amber-200">
          <h2 className="text-base font-semibold text-amber-700">
            Solicitudes pendientes de aprobación{pending.length ? ` (${pending.length})` : ''}
          </h2>
          {pending.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No hay solicitudes pendientes.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {pending.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="mt-1 text-sm text-gray-500">{b.category}</p>
                    <p className="mt-0.5 text-xs text-gray-400">de {b.owner.email}</p>
                  </div>
                  <ApproveBusinessButton businessId={b.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Mis solicitudes pendientes (dueño no admin) */}
      {!isAdmin && pending.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pending.map((b) => (
            <Card key={b.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-gray-900">{b.name}</h3>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Pendiente
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{b.category}</p>
              <p className="mt-2 text-xs text-gray-400">Esperando aprobación de un administrador.</p>
            </Card>
          ))}
        </div>
      )}

      {/* Negocios aprobados */}
      {approved.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">
          {isAdmin ? 'Todavía no hay negocios aprobados.' : 'Todavía no tenés negocios aprobados.'}
        </p>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {approved.map((b) => (
            <Link key={b.id} href={`/businesses/${b.id}`}>
              <Card interactive>
                <h3 className="font-medium text-gray-900">{b.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{b.category}</p>
                {isAdmin && b.ownerId !== user.id && (
                  <p className="mt-1 text-xs text-amber-600">de {b.owner.email}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Alta de negocio */}
      <Card>
        <CreateBusinessForm />
      </Card>
    </Container>
  );
}
