'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function BusinessImageForm({
  businessId,
  currentImageUrl,
}: {
  businessId: string;
  currentImageUrl: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Elegí una imagen');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`/api/businesses/${businessId}/image`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo subir la imagen');
        return;
      }
      setFile(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3">
      <h3 className="text-base font-semibold text-gray-900">Foto del negocio</h3>
      {currentImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentImageUrl}
          alt="Foto del negocio"
          className="h-32 w-full rounded-lg object-cover"
        />
      ) : (
        <p className="text-sm text-gray-500">Todavía no cargaste una foto.</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-sm"
      />
      <Button type="submit" loading={submitting}>
        {currentImageUrl ? 'Cambiar foto' : 'Subir foto'}
      </Button>
    </form>
  );
}
