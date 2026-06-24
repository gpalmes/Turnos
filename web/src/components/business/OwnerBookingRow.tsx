'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

interface Booking {
  id: string;
  startTime: string;
  status: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  resourceName: string;
}

export default function OwnerBookingRow({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cliente = booking.clientName || booking.clientEmail;

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo confirmar');
        return;
      }

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`¿Cancelar la reserva de ${cliente}?`)) return;

    setError('');
    setSubmitting(true);

    try {
      // force=true: el dueño puede cancelar sin la ventana de anticipación del cliente.
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', force: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo cancelar');
        return;
      }

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar definitivamente la reserva de ${cliente}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo eliminar');
        return;
      }

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {new Date(booking.startTime).toLocaleString('es-AR')}
        </p>
        <p className="mt-1 truncate text-sm text-gray-600">
          {booking.serviceName} en {booking.resourceName}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">
          {booking.clientName || 'Sin nombre'} · {booking.clientEmail}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={booking.status} />
        {booking.status === 'pending' && (
          <Button variant="primary" loading={submitting} onClick={handleConfirm} className="px-3 py-1 text-xs">
            Confirmar
          </Button>
        )}
        {booking.status !== 'cancelled' && (
          <Button variant="warning" loading={submitting} onClick={handleCancel} className="px-3 py-1 text-xs">
            Cancelar
          </Button>
        )}
        <Button variant="danger" loading={submitting} onClick={handleDelete} className="px-3 py-1 text-xs">
          Eliminar
        </Button>
      </div>
    </li>
  );
}
