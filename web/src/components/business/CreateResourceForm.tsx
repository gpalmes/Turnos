'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function CreateResourceForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      businessId,
      name: formData.get('name'),
      type: formData.get('type'),
    };

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo crear el recurso');
        return;
      }

      formRef.current?.reset();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex max-w-md flex-col gap-4">
      <h4 className="text-sm font-semibold text-gray-900">Agregar recurso</h4>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Input label="Nombre" type="text" name="name" required placeholder="Cancha 1, Dr. Pérez..." />
      <Input label="Tipo" type="text" name="type" required placeholder="court, doctor, chair..." />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Agregando...' : 'Agregar recurso'}
      </Button>
    </form>
  );
}
