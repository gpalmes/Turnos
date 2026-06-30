import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function NotificacionesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Al abrir la página se marcan como leídas.
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return (
    <Container title="Notificaciones">
      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500">No tenés notificaciones.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => {
            const body = (
              <Card className={n.read ? '' : 'border-brand-200 bg-brand-50/40'}>
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {n.createdAt.toLocaleString('es-AR')}
                </p>
              </Card>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block">
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
