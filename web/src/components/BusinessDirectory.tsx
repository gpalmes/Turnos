'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { emojiFor } from '@/lib/rubros';

interface Business {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  bookable: boolean;
  openNow: boolean;
}

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<'recomendados' | 'az' | 'za'>('recomendados');

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await fetch('/api/businesses');
        const data = await res.json();
        setBusinesses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.category).filter(Boolean))).sort(),
    [businesses]
  );

  const filtered = businesses.filter((b) => {
    if (category && b.category !== category) return false;
    if (openNow && !b.openNow) return false;
    if (onlyAvailable && !b.bookable) return false;
    if (query) {
      const q = query.toLowerCase();
      const match = b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name);
    if (sort === 'za') return b.name.localeCompare(a.name);
    // "recomendados": abiertos primero, luego con disponibilidad, luego alfabético.
    if (a.openNow !== b.openNow) return a.openNow ? -1 : 1;
    if (a.bookable !== b.bookable) return a.bookable ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const hasFilters = !!query || !!category || openNow || onlyAvailable;
  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setOpenNow(false);
    setOnlyAvailable(false);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando negocios...</p>;
  }

  return (
    <div>
      {/* Buscador */}
      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar un negocio..."
          className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Chips de rubro */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            category === ''
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(category === c ? '' : c)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              category === c
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {emojiFor(c)} {c}
          </button>
        ))}
      </div>

      {/* Toggles rápidos */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setOpenNow((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            openNow
              ? 'border-green-600 bg-green-50 text-green-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Abierto ahora
        </button>
        <button
          onClick={() => setOnlyAvailable((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            onlyAvailable
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Con disponibilidad
        </button>
      </div>

      {/* Resultados + orden */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {sorted.length} {sorted.length === 1 ? 'negocio' : 'negocios'}
          {hasFilters && (
            <button onClick={clearFilters} className="ml-3 font-medium text-brand-600 hover:underline">
              Limpiar filtros
            </button>
          )}
        </p>
        <label className="text-sm text-gray-600">
          Ordenar:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="recomendados">Recomendados</option>
            <option value="az">Nombre (A-Z)</option>
            <option value="za">Nombre (Z-A)</option>
          </select>
        </label>
      </div>

      {/* Grilla de negocios */}
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">No hay negocios que coincidan con tu búsqueda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((business) => (
            <Link
              key={business.id}
              href={`/reservar/${business.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Imagen / placeholder */}
              <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50">
                {business.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.imageUrl}
                    alt={business.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">
                    {emojiFor(business.category)}
                  </div>
                )}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    business.openNow
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700/80 text-white'
                  }`}
                >
                  {business.openNow ? 'Abierto' : 'Cerrado'}
                </span>
              </div>

              {/* Cuerpo */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{business.name}</h3>
                  {business.bookable && (
                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      Disponible
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {emojiFor(business.category)} {business.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
