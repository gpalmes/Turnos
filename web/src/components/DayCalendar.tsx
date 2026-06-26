'use client';

import { useEffect, useMemo, useState } from 'react';
import BookingDetailModal from '@/components/BookingDetailModal';

interface Resource {
  id: string;
  name: string;
}

interface Interval {
  startMinutes: number;
  endMinutes: number;
}

interface Booking extends Interval {
  id: string;
  resourceId: string;
  status: string;
}

interface CalendarData {
  open: { startMinutes: number; endMinutes: number } | null;
  openBlocks: Interval[];
  blocked: Interval[];
  bookings: Booking[];
}

const ROW_PX = 56; // alto de cada franja de 60 min

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, deltaDays: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 10);
}

function hhmm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function DayCalendar({
  businessId,
  resources,
}: {
  businessId: string;
  resources: Resource[];
}) {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchDay = async () => {
      try {
        const res = await fetch(`/api/calendar?businessId=${businessId}&date=${date}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error('Error fetching calendar:', err);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDay();
    return () => {
      cancelled = true;
    };
  }, [businessId, date, refreshKey]);

  // Rango visible: horas enteras que cubren el horario abierto del día.
  const range = useMemo(() => {
    if (!data?.open) return null;
    const start = Math.floor(data.open.startMinutes / 60) * 60;
    const end = Math.ceil(data.open.endMinutes / 60) * 60;
    return { start, end };
  }, [data]);

  // Tramos cerrados = huecos dentro del rango que no están en openBlocks.
  const closed = useMemo(() => {
    if (!range || !data) return [];
    const gaps: Interval[] = [];
    let cursor = range.start;
    for (const b of data.openBlocks) {
      if (b.startMinutes > cursor) gaps.push({ startMinutes: cursor, endMinutes: b.startMinutes });
      cursor = Math.max(cursor, b.endMinutes);
    }
    if (cursor < range.end) gaps.push({ startMinutes: cursor, endMinutes: range.end });
    return gaps;
  }, [range, data]);

  if (resources.length === 0) {
    return <p className="text-sm text-gray-500">Este negocio todavía no cargó recursos.</p>;
  }

  // Posición vertical (top/height en px) de un intervalo dentro del rango.
  const pos = (iv: Interval) => {
    const s = Math.max(iv.startMinutes, range!.start);
    const e = Math.min(iv.endMinutes, range!.end);
    return {
      top: ((s - range!.start) / 60) * ROW_PX,
      height: Math.max(0, ((e - s) / 60) * ROW_PX),
    };
  };

  const hours = range
    ? Array.from({ length: (range.end - range.start) / 60 }, (_, i) => range.start / 60 + i)
    : [];
  const totalPx = hours.length * ROW_PX;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setDate(shiftDate(date, -1))} className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50">
            ← Día
          </button>
          <button onClick={() => setDate(todayStr())} className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50">
            Hoy
          </button>
          <button onClick={() => setDate(shiftDate(date, 1))} className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50">
            Día →
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-300" /> Ocupado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gray-200 ring-1 ring-gray-300" /> No disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gray-100 ring-1 ring-gray-200" /> Cerrado
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando disponibilidad...</p>
      ) : !range ? (
        <p className="text-sm text-gray-500">No hay horarios configurados para este día.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Encabezado: nombres de recursos */}
            <div className="flex">
              <div className="w-14 shrink-0" />
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="flex-1 truncate border-l border-white bg-gray-100 p-2 text-center text-xs font-medium text-gray-700"
                >
                  {r.name}
                </div>
              ))}
            </div>

            {/* Cuerpo: eje de horas + una columna por recurso */}
            <div className="flex">
              {/* Eje de horas */}
              <div className="w-14 shrink-0">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="pr-2 text-right text-[11px] text-gray-500"
                    style={{ height: ROW_PX }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Columnas de recursos */}
              {resources.map((r) => (
                <div key={r.id} className="relative flex-1 border-l border-gray-200" style={{ height: totalPx }}>
                  {/* Grilla de fondo: franjas fijas de 60 min */}
                  {hours.map((h) => (
                    <div key={h} className="border-b border-gray-100" style={{ height: ROW_PX }} />
                  ))}

                  {/* Tramos cerrados */}
                  {closed.map((c, i) => {
                    const p = pos(c);
                    return (
                      <div
                        key={`c${i}`}
                        className="absolute inset-x-0 bg-gray-100"
                        style={{ top: p.top, height: p.height }}
                      />
                    );
                  })}

                  {/* Bloqueos (No disponible) */}
                  {data!.blocked.map((b, i) => {
                    const p = pos(b);
                    return (
                      <div
                        key={`b${i}`}
                        className="absolute inset-x-0 flex items-center justify-center bg-gray-200 text-[10px] text-gray-500"
                        style={{ top: p.top, height: p.height }}
                      >
                        No disp.
                      </div>
                    );
                  })}

                  {/* Reservas: bloque superpuesto con su duración real */}
                  {data!.bookings
                    .filter((bk) => bk.resourceId === r.id)
                    .map((bk, i) => {
                      const p = pos(bk);
                      return (
                        <button
                          key={`r${i}`}
                          type="button"
                          onClick={() => setSelectedBookingId(bk.id)}
                          className="absolute inset-x-0.5 overflow-hidden rounded border border-red-300 bg-red-100 px-1 py-0.5 text-left text-[10px] leading-tight text-red-700 transition-colors hover:bg-red-200"
                          style={{ top: p.top, height: p.height }}
                        >
                          <div className="font-medium">
                            {hhmm(bk.startMinutes)}–{hhmm(bk.endMinutes)}
                          </div>
                          <div>Ocupado</div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
