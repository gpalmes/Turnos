'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface BookingActionsProps {
  bookingId: string;
  status: string;
  isPast: boolean;
}

export default function CancelBookingButton({ bookingId, status, isPast }: BookingActionsProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canCancel = status !== 'cancelled';
  const canDelete = !isPast || status === 'cancelled';

  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta reserva? Se marcará como cancelada pero seguirá visible en tu historial.')) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
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
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (!confirm('¿Borrar esta reserva? Esta acción no se puede deshacer.')) {
      setShowDeleteConfirm(false);
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo borrar');
        setShowDeleteConfirm(false);
        return;
      }

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {canCancel && (
          <Button
            variant="warning"
            loading={submitting}
            onClick={handleCancel}
            className="px-3 py-1 text-xs"
          >
            Cancelar
          </Button>
        )}
        {canDelete && (
          <Button
            variant={showDeleteConfirm ? 'danger' : 'secondary'}
            loading={submitting}
            onClick={handleDelete}
            className="px-3 py-1 text-xs"
          >
            {showDeleteConfirm ? 'Confirmar borrado' : 'Borrar'}
          </Button>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
