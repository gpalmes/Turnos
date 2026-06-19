'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function CreateAvailabilityExceptionForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allDay, setAllDay] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      businessId,
      date: formData.get('date'),
      startTime,
      endTime,
      isAvailable: formData.get('isAvailable') === 'true',
      reason: formData.get('reason'),
    };

    try {
      const res = await fetch('/api/availability-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo guardar la excepción');
        return;
      }

      formRef.current?.reset();
      setAllDay(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex max-w-md flex-col gap-4">
      <h4 className="text-sm font-semibold text-gray-900">Agregar excepción (feriado, horario especial)</h4>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Input label="Fecha" type="date" name="date" required />
      <label className="block text-sm font-medium text-gray-700">
        Tipo
        <select
          name="isAvailable"
          defaultValue="false"
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
          <Input label="Desde" type="time" name="startTime" required />
          <Input label="Hasta" type="time" name="endTime" required />
        </>
      )}
      <Input label="Motivo (opcional)" type="text" name="reason" placeholder="Feriado, mantenimiento..." />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Guardando...' : 'Agregar excepción'}
      </Button>
    </form>
  );
}
