'use client';

import { useEffect, useMemo, useState } from 'react';

interface Resource {
  id: string;
  name: string;
}

interface Slot {
  startTime: string;
  endTime: string;
  start: string; // hora de pared "HH:MM"
  status: 'free' | 'booked' | 'unavailable';
  available: boolean;
}

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

const STEP_MINUTES = 30;

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
  const [openBlocks, setOpenBlocks] = useState<{ startTime: string; endTime: string }[]>([]);
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
              durationMinutes: '30',
              stepMinutes: '30',
            });
            const res = await fetch(`/api/availability?${params}`);
            const data = await res.json();
            return {
              slots: (data.slots ?? []) as Slot[],
              openBlocks: (data.openBlocks ?? []) as { startTime: string; endTime: string }[],
            };
          })
        );
        if (!cancelled) {
          setSlotsByResource(results.map((r) => r.slots));
          // Los bloques son a nivel negocio (iguales para todos los recursos).
          setOpenBlocks(results.find((r) => r.openBlocks.length)?.openBlocks ?? []);
        }
      } catch (err) {
        console.error('Error fetching day:', err);
        if (!cancelled) {
          setSlotsByResource([]);
          setOpenBlocks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDay();
    return () => {
      cancelled = true;
    };
  }, [businessId, date, resources]);

  // Eje de horas continuo, derivado del horario cargado del negocio (no de los
  // slots existentes): así la grilla queda alineada con los bloques abiertos.
  const rowTimes = useMemo(() => {
    const set = new Set<string>();
    openBlocks.forEach((b) => {
      const end = toMinutes(b.endTime);
      for (let t = toMinutes(b.startTime); t + STEP_MINUTES <= end; t += STEP_MINUTES) {
        set.add(toHHMM(t));
      }
    });
    return Array.from(set).sort();
  }, [openBlocks]);

  // Acceso rápido: recurso (índice) + hora → slot.
  const lookup = useMemo(() => {
    const map: Record<string, Slot> = {};
    slotsByResource.forEach((slots, ri) => {
      slots.forEach((s) => {
        map[`${ri}|${s.start}`] = s;
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
          <span className="h-3 w-3 rounded bg-gray-200 ring-1 ring-gray-300" /> No disponible
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
                <th className="w-14 p-2 text-gray-400" />
                {resources.map((r) => (
                  <th key={r.id} className="truncate border-l border-white bg-gray-100 p-2 font-medium text-gray-700">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowTimes.map((time) => (
                <tr key={time} className="h-10">
                  <td className="pr-2 text-right align-middle text-[11px] font-medium text-gray-500">{time}</td>
                  {resources.map((r, ri) => {
                    const slot = lookup[`${ri}|${time}`];
                    let cls = 'bg-gray-50 text-gray-300'; // cerrado (fuera de horario)
                    let label = '·';
                    if (slot) {
                      if (slot.status === 'free') {
                        cls = 'bg-green-100 text-green-700 hover:bg-green-200';
                        label = 'Libre';
                      } else if (slot.status === 'booked') {
                        cls = 'bg-red-100 text-red-700';
                        label = 'Ocupado';
                      } else {
                        cls = 'bg-gray-200 text-gray-500';
                        label = 'No disp.';
                      }
                    }
                    return (
                      <td
                        key={r.id}
                        className={`border border-white align-middle font-medium transition-colors ${cls}`}
                      >
                        {label}
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
