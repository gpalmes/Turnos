'use client';

import { useEffect, useMemo, useState } from 'react';

interface Resource {
  id: string;
  name: string;
}

interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
}

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function shiftDate(dateStr: string, deltaDays: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 10);
}

export default function DayCalendar({
  businessId,
  resources,
}: {
  businessId: string;
  resources: Resource[];
}) {
  const [date, setDate] = useState(todayStr());
  const [slotsByResource, setSlotsByResource] = useState<Slot[][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resources.length === 0) return;

    let cancelled = false;
    setLoading(true);

    const fetchDay = async () => {
      try {
        const results = await Promise.all(
          resources.map(async (r) => {
            const params = new URLSearchParams({
              businessId,
              resourceId: r.id,
              date,
              durationMinutes: '60',
            });
            const res = await fetch(`/api/availability?${params}`);
            const data = await res.json();
            return (data.slots ?? []) as Slot[];
          })
        );
        if (!cancelled) setSlotsByResource(results);
      } catch (err) {
        console.error('Error fetching day:', err);
        if (!cancelled) setSlotsByResource([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDay();
    return () => {
      cancelled = true;
    };
  }, [businessId, date, resources]);

  // Todas las horas de inicio del día (de cualquier recurso) → filas de la grilla.
  const rowTimes = useMemo(() => {
    const set = new Set<string>();
    slotsByResource.forEach((slots) => slots.forEach((s) => set.add(hhmm(s.startTime))));
    return Array.from(set).sort();
  }, [slotsByResource]);

  // Acceso rápido: recurso (índice) + hora → slot.
  const lookup = useMemo(() => {
    const map: Record<string, Slot> = {};
    slotsByResource.forEach((slots, ri) => {
      slots.forEach((s) => {
        map[`${ri}|${hhmm(s.startTime)}`] = s;
      });
    });
    return map;
  }, [slotsByResource]);

  if (resources.length === 0) {
    return <p className="text-sm text-gray-500">Este negocio todavía no cargó recursos.</p>;
  }

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
          <span className="h-3 w-3 rounded bg-green-100 ring-1 ring-green-300" /> Libre
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-300" /> Ocupado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gray-50 ring-1 ring-gray-200" /> Cerrado
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando disponibilidad...</p>
      ) : rowTimes.length === 0 ? (
        <p className="text-sm text-gray-500">No hay horarios configurados para este día.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] table-fixed border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="w-12 p-1 text-gray-400" />
                {resources.map((r) => (
                  <th key={r.id} className="truncate p-1 font-medium text-gray-700">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowTimes.map((time) => (
                <tr key={time}>
                  <td className="py-0.5 pr-2 text-right align-middle text-[11px] text-gray-500">{time}</td>
                  {resources.map((r, ri) => {
                    const slot = lookup[`${ri}|${time}`];
                    let cls = 'bg-gray-50 text-gray-300'; // cerrado
                    let label = '·';
                    if (slot) {
                      if (slot.available) {
                        cls = 'bg-green-100 text-green-700';
                        label = 'Libre';
                      } else {
                        cls = 'bg-red-100 text-red-700';
                        label = 'Ocupado';
                      }
                    }
                    return (
                      <td key={r.id} className="px-0.5 py-0.5">
                        <div className={`rounded py-0.5 ${cls}`}>{label}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
