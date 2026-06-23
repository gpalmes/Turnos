'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function DeleteBusinessForm({ businessId, businessName }: { businessId: string; businessName: string }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const matches = confirmText === businessName;

  const handleDelete = async () => {
    if (!matches) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/businesses/${businessId}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo eliminar el negocio');
        return;
      }

      router.push('/businesses');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        Esto borra el negocio y todo lo asociado: servicios, recursos, horarios, excepciones y reservas. No se puede deshacer.
      </p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Input
        label={`Escribí "${businessName}" para confirmar`}
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />
      <Button variant="danger" disabled={!matches} loading={submitting} onClick={handleDelete}>
        Eliminar negocio
      </Button>
    </div>
  );
}
