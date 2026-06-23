'use client';

import { useState } from 'react';
import { RUBROS } from '@/lib/rubros';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

// Campo de Rubro: desplegable con la lista fija + opción "Otro" para escribir uno libre.
// Emite el valor final en un input oculto llamado "category" (lo que leen los forms).
export default function RubroField({ defaultValue = '' }: { defaultValue?: string }) {
  const presets = RUBROS.filter((r) => r !== 'Otro');
  const isPreset = (presets as readonly string[]).includes(defaultValue);

  const [selected, setSelected] = useState(
    isPreset ? defaultValue : defaultValue ? 'Otro' : ''
  );
  const [custom, setCustom] = useState(isPreset ? '' : defaultValue);

  const finalValue = selected === 'Otro' ? custom : selected;

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-gray-700">
        Rubro
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={inputClass}
          required
        >
          <option value="" disabled>
            Elegí un rubro...
          </option>
          {RUBROS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {selected === 'Otro' && (
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Escribí el rubro"
          className={inputClass}
          required
        />
      )}

      <input type="hidden" name="category" value={finalValue} />
    </div>
  );
}
