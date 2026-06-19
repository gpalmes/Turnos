'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function CreateServiceForm({ businessId }: { businessId: string }) {
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
      description: formData.get('description') || undefined,
      duration: Number(formData.get('duration')),
      price: Number(formData.get('price')),
    };

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo crear el servicio');
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
      <h4 className="text-sm font-semibold text-gray-900">Agregar servicio</h4>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Input label="Nombre" type="text" name="name" required />
      <Input label="Descripción" type="text" name="description" />
      <Input label="Duración (minutos)" type="number" name="duration" min={1} required />
      <Input label="Precio" type="number" name="price" min={0} step="0.01" required />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Agregando...' : 'Agregar servicio'}
      </Button>
    </form>
  );
}
