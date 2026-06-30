'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function ApproveBusinessButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const approve = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo aprobar');
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    if (!confirm('¿Rechazar y eliminar esta solicitud de negocio?')) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo rechazar');
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button loading={submitting} onClick={approve} className="px-3 py-1 text-xs">
          Aprobar
        </Button>
        <Button variant="danger" loading={submitting} onClick={reject} className="px-3 py-1 text-xs">
          Rechazar
        </Button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
