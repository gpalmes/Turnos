'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function CreateScheduleForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      businessId,
      dayOfWeek: Number(formData.get('dayOfWeek')),
      startTime,
      endTime,
    };

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo guardar el horario');
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
      <h4 className="text-sm font-semibold text-gray-900">Agregar bloque de horario</h4>
      <p className="text-sm text-gray-500">
        Podés agregar más de un bloque por día (ej. 9:00-12:00 y 14:00-18:00 para turno partido).
      </p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-medium text-gray-700">
        Día
        <select
          name="dayOfWeek"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {DIAS.map((dia, i) => (
            <option key={i} value={i}>{dia}</option>
          ))}
        </select>
      </label>
      <Input label="Desde" type="time" name="startTime" required />
      <Input label="Hasta" type="time" name="endTime" required />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Guardando...' : 'Agregar horario'}
      </Button>
    </form>
  );
}
