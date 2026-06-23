import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import CancelBookingButton from '@/components/CancelBookingButton';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function MyBookingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { business: true, service: true, resource: true },
    orderBy: { startTime: 'desc' },
  });

  return (
    <Container title="Mis reservas">
      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hiciste ninguna reserva.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((b) => {
            const isPast = b.startTime.getTime() < Date.now();

            return (
              <Card key={b.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {b.business.name} — {b.service.name} en {b.resource.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{b.startTime.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <CancelBookingButton bookingId={b.id} status={b.status} isPast={isPast} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
