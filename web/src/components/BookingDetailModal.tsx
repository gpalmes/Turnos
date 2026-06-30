'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

interface BookingDetail {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
  resourceName: string;
  businessName: string;
  canManage: boolean;
  canCancel: boolean;
  price?: number;
  client?: { name: string; email: string };
  payment?: {
    status: string;
    amount: number | null;
    method: string | null;
    receiptUrl: string | null;
  };
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Seña',
  paid: 'Pagado',
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export default function BookingDetailModal({
  bookingId,
  onClose,
  onChanged,
}: {
  bookingId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form de pago
  const [payStatus, setPayStatus] = useState('pending');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Reprogramar
  const [rescheduleAt, setRescheduleAt] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar');
        return;
      }
      setDetail(data);
      if (data.startTime) setRescheduleAt(toLocalInput(data.startTime));
      if (data.payment) {
        setPayStatus(data.payment.status || 'pending');
        setPayAmount(data.payment.amount != null ? String(data.payment.amount) : '');
        setPayMethod(data.payment.method || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const action = async (body: object) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo actualizar');
        return;
      }
      onChanged();
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar definitivamente esta reserva? No se puede deshacer.')) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo eliminar');
        return;
      }
      onChanged();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('paymentStatus', payStatus);
      if (payAmount) fd.append('paymentAmount', payAmount);
      if (payMethod) fd.append('paymentMethod', payMethod);
      if (receiptFile) fd.append('receipt', receiptFile);

      const res = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo guardar el pago');
        return;
      }
      setReceiptFile(null);
      onChanged();
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Reserva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : !detail ? (
          <p className="text-sm text-red-600">{error || 'No se pudo cargar la reserva.'}</p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{detail.serviceName}</span>
                <StatusBadge status={detail.status} />
              </div>
              <p>{detail.resourceName}</p>
              <p className="text-gray-500">
                {new Date(detail.startTime).toLocaleString('es-AR')} —{' '}
                {new Date(detail.endTime).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {detail.client && (
                <p className="text-gray-500">
                  Cliente: {detail.client.name || 'Sin nombre'} · {detail.client.email}
                </p>
              )}
              {detail.price != null && (
                <p className="text-gray-500">Precio: ${detail.price}</p>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              {detail.canManage && detail.status === 'pending' && (
                <Button
                  loading={submitting}
                  onClick={() => action({ action: 'confirm' })}
                  className="px-3 py-1 text-xs"
                >
                  Confirmar
                </Button>
              )}
              {detail.canCancel && detail.status !== 'cancelled' && (
                <Button
                  variant="warning"
                  loading={submitting}
                  onClick={() => action({ action: 'cancel', force: detail.canManage })}
                  className="px-3 py-1 text-xs"
                >
                  Cancelar
                </Button>
              )}
              {detail.canCancel && (
                <Button
                  variant="danger"
                  loading={submitting}
                  onClick={handleDelete}
                  className="px-3 py-1 text-xs"
                >
                  Eliminar
                </Button>
              )}
            </div>

            {/* Reprogramar (quien pueda gestionar la reserva) */}
            {detail.canCancel && detail.status !== 'cancelled' && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">Reprogramar</h3>
                <div className="flex flex-wrap items-end gap-2">
                  <input
                    type="datetime-local"
                    value={rescheduleAt}
                    onChange={(e) => setRescheduleAt(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Button
                    variant="secondary"
                    loading={submitting}
                    onClick={() => action({ action: 'reschedule', startTime: rescheduleAt })}
                    className="text-xs"
                  >
                    Guardar nuevo horario
                  </Button>
                </div>
              </div>
            )}

            {/* Pago (solo dueño/admin) */}
            {detail.canManage && detail.payment && (
              <form onSubmit={handlePayment} className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Pago</h3>
                  <span className="text-xs text-gray-500">
                    Actual: {PAYMENT_LABELS[detail.payment.status] ?? detail.payment.status}
                    {detail.payment.amount != null ? ` · $${detail.payment.amount}` : ''}
                  </span>
                </div>

                <label className="block text-sm font-medium text-gray-700">
                  Estado
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="partial">Seña</option>
                    <option value="paid">Pagado</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Monto
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Método
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">—</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Comprobante (imagen o PDF)
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                    className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-sm"
                  />
                </label>

                {detail.payment.receiptUrl && (
                  <a
                    href={detail.payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium text-brand-600 hover:underline"
                  >
                    Ver comprobante actual
                  </a>
                )}

                <Button type="submit" loading={submitting} className="w-full">
                  Guardar pago
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
