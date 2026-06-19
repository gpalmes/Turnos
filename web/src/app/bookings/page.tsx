import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import CancelBookingButton from '@/components/CancelBookingButton';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

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
            const canCancel = b.status !== 'cancelled' && !isPast;

            return (
              <Card key={b.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {b.business.name} — {b.service.name} en {b.resource.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{b.startTime.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {b.status}
                  </span>
                  {canCancel && <CancelBookingButton bookingId={b.id} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
