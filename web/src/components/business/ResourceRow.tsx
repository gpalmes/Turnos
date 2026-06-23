'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Resource {
  id: string;
  name: string;
  type: string;
}

export default function ResourceRow({ resource }: { resource: Resource }) {
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
      type: formData.get('type'),
    };

    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
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
    if (!confirm(`¿Eliminar el recurso "${resource.name}"?`)) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/resources/${resource.id}`, { method: 'DELETE' });

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
          <Input label="Nombre" type="text" name="name" defaultValue={resource.name} required />
          <Input label="Tipo" type="text" name="type" defaultValue={resource.type} required />
          <div className="flex gap-2">
            <Button type="submit" loading={submitting}>Guardar</Button>
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm text-gray-900">
          {resource.name} <span className="text-gray-500">({resource.type})</span>
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex shrink-0 gap-3 text-xs">
        <button onClick={() => setIsEditing(true)} className="text-brand-600 hover:underline">
          Editar
        </button>
        <button onClick={handleDelete} disabled={submitting} className="text-red-600 hover:underline disabled:opacity-50">
          Eliminar
        </button>
      </div>
    </li>
  );
}
