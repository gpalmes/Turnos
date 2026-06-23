'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AssociateResourcesForm from './AssociateResourcesForm';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  resources: { id: string }[];
}

export default function ServiceRow({
  service,
  allResources,
}: {
  service: Service;
  allResources: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      duration: Number(formData.get('duration')),
      price: Number(formData.get('price')),
    };

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo guardar');
        return;
      }

      setIsEditing(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el servicio "${service.name}"?`)) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/services/${service.id}`, { method: 'DELETE' });

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

  if (isEditing) {
    return (
      <li className="py-3">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Input label="Nombre" type="text" name="name" defaultValue={service.name} required />
          <Input label="Descripción" type="text" name="description" defaultValue={service.description ?? ''} />
          <Input label="Duración (minutos)" type="number" name="duration" min={1} defaultValue={service.duration} required />
          <Input label="Precio" type="number" name="price" min={0} step="0.01" defaultValue={service.price} required />
          <div className="flex gap-2">
            <Button type="submit" loading={submitting}>Guardar</Button>
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="py-3">
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{service.name}</span> — {service.duration} min — ${service.price}
        </p>
        <div className="flex shrink-0 gap-3 text-xs">
          <button onClick={() => setIsEditing(true)} className="text-brand-600 hover:underline">
            Editar
          </button>
          <button onClick={handleDelete} disabled={submitting} className="text-red-600 hover:underline disabled:opacity-50">
            Eliminar
          </button>
        </div>
      </div>
      <AssociateResourcesForm
        serviceId={service.id}
        allResources={allResources}
        selectedResourceIds={service.resources.map((r) => r.id)}
      />
    </li>
  );
}
