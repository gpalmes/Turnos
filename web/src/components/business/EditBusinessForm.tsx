'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Business {
  id: string;
  name: string;
  category: string;
  timezone: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  minAdvanceHours: number;
  cancellationHours: number;
}

export default function EditBusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get('name'),
      category: formData.get('category'),
      timezone: formData.get('timezone'),
      address: formData.get('address'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      minAdvanceHours: Number(formData.get('minAdvanceHours')),
      cancellationHours: Number(formData.get('cancellationHours')),
    };

    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo guardar');
        return;
      }

      setSuccess(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <h3 className="text-base font-semibold text-gray-900">Editar negocio</h3>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Guardado</p>}
      <Input label="Nombre" type="text" name="name" defaultValue={business.name} required />
      <Input label="Rubro" type="text" name="category" defaultValue={business.category} required />
      <Input label="Zona horaria" type="text" name="timezone" defaultValue={business.timezone} />
      <Input label="Dirección" type="text" name="address" defaultValue={business.address ?? ''} />
      <Input label="Teléfono" type="text" name="phone" defaultValue={business.phone ?? ''} />
      <Input label="Email de contacto" type="email" name="email" defaultValue={business.email ?? ''} />
      <Input
        label="Anticipación mínima para reservar (horas)"
        type="number"
        name="minAdvanceHours"
        min={0}
        defaultValue={business.minAdvanceHours}
      />
      <Input
        label="Anticipación mínima para cancelar (horas)"
        type="number"
        name="cancellationHours"
        min={0}
        defaultValue={business.cancellationHours}
      />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
