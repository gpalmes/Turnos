'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import RubroField from '@/components/business/RubroField';

export default function CreateBusinessForm() {
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
      name: formData.get('name'),
      category: formData.get('category'),
      timezone: formData.get('timezone') || 'UTC',
      address: formData.get('address') || undefined,
      phone: formData.get('phone') || undefined,
      email: formData.get('email') || undefined,
    };

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo crear el negocio');
        return;
      }

      formRef.current?.reset();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <h3 className="text-base font-semibold text-gray-900">Crear negocio</h3>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Input label="Nombre" type="text" name="name" required />
      <RubroField />
      <Input label="Zona horaria" type="text" name="timezone" defaultValue="UTC" />
      <Input label="Dirección" type="text" name="address" />
      <Input label="Teléfono" type="text" name="phone" />
      <Input label="Email de contacto" type="email" name="email" />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Creando...' : 'Crear negocio'}
      </Button>
    </form>
  );
}
