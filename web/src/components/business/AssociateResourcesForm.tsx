'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface Resource {
  id: string;
  name: string;
}

export default function AssociateResourcesForm({
  serviceId,
  allResources,
  selectedResourceIds,
}: {
  serviceId: string;
  allResources: Resource[];
  selectedResourceIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedResourceIds);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (allResources.length === 0) {
    return null;
  }

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/services/${serviceId}/resources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceIds: selected }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo guardar la asociación');
        return;
      }

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-3 text-sm">
      <span className="text-gray-500">Recursos:</span>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {allResources.map((r) => (
        <label key={r.id} className="flex items-center gap-1.5 text-gray-700">
          <input
            type="checkbox"
            checked={selected.includes(r.id)}
            onChange={() => toggle(r.id)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          {r.name}
        </label>
      ))}
      <Button type="submit" variant="secondary" loading={submitting} className="ml-auto px-3 py-1 text-xs">
        Guardar
      </Button>
    </form>
  );
}
