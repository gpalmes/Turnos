'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta reserva?')) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
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

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="danger" loading={submitting} onClick={handleCancel} className="px-3 py-1 text-xs">
        Cancelar
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
