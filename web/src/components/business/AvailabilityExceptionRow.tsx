'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Exception {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason: string | null;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function AvailabilityExceptionRow({ exception }: { exception: Exception }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [allDay, setAllDay] = useState(exception.startTime === '00:00' && exception.endTime === '23:59');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const startTime = allDay ? '00:00' : String(formData.get('startTime'));
    const endTime = allDay ? '23:59' : String(formData.get('endTime'));

    if (startTime >= endTime) {
      setError('La hora de inicio tiene que ser anterior a la de fin');
      return;
    }

    setSubmitting(true);

    const body = {
      date: formData.get('date'),
      startTime,
      endTime,
      isAvailable: formData.get('isAvailable') === 'true',
      reason: formData.get('reason'),
    };

    try {
      const res = await fetch(`/api/availability-exceptions/${exception.id}`, {
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
    if (!confirm('¿Eliminar esta excepción?')) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/availability-exceptions/${exception.id}`, { method: 'DELETE' });

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
          <Input label="Fecha" type="date" name="date" defaultValue={toDateInputValue(exception.date)} required />
          <label className="block text-sm font-medium text-gray-700">
            Tipo
            <select
              name="isAvailable"
              defaultValue={exception.isAvailable ? 'true' : 'false'}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="false">Cerrado / no disponible</option>
              <option value="true">Abierto extra (fuera del horario habitual)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Todo el día
          </label>
          {!allDay && (
            <>
              <Input label="Desde" type="time" name="startTime" defaultValue={exception.startTime} required />
              <Input label="Hasta" type="time" name="endTime" defaultValue={exception.endTime} required />
            </>
          )}
          <Input label="Motivo (opcional)" type="text" name="reason" defaultValue={exception.reason ?? ''} />
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
          {exception.date.toLocaleDateString('es-AR')} {exception.startTime}-{exception.endTime}:{' '}
          {exception.isAvailable ? 'Abierto extra' : 'Cerrado'}
          {exception.reason ? <span className="text-gray-500"> ({exception.reason})</span> : ''}
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
