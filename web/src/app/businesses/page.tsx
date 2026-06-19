import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import CreateBusinessForm from '@/components/business/CreateBusinessForm';
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
    include: isAdmin ? { owner: { select: { email: true } } } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <Container title={isAdmin ? 'Todos los negocios' : 'Mis negocios'}>
      {businesses.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">Todavía no creaste ningún negocio.</p>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {businesses.map((b: any) => (
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

      <Card>
        <CreateBusinessForm />
      </Card>
    </Container>
  );
}
