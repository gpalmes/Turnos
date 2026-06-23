'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function ScheduleRow({ schedule }: { schedule: Schedule }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const startTime = String(formData.get('startTime'));
    const endTime = String(formData.get('endTime'));

    if (startTime >= endTime) {
      setError('La hora de inicio tiene que ser anterior a la de fin');
      return;
    }

    setSubmitting(true);

    const body = {
      dayOfWeek: Number(formData.get('dayOfWeek')),
      startTime,
      endTime,
    };

    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
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
    if (!confirm('¿Eliminar este bloque de horario?')) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, { method: 'DELETE' });

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
          <label className="block text-sm font-medium text-gray-700">
            Día
            <select
              name="dayOfWeek"
              defaultValue={schedule.dayOfWeek}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {DIAS.map((dia, i) => (
                <option key={i} value={i}>{dia}</option>
              ))}
            </select>
          </label>
          <Input label="Desde" type="time" name="startTime" defaultValue={schedule.startTime} required />
          <Input label="Hasta" type="time" name="endTime" defaultValue={schedule.endTime} required />
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
          {DIAS[schedule.dayOfWeek]}: {schedule.startTime} - {schedule.endTime}
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
