'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';

interface Business {
  id: string;
  name: string;
  category: string;
  bookable: boolean;
}

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

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

  // Rubros realmente presentes, para no ofrecer filtros vacíos.
  const categories = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.category).filter(Boolean))).sort(),
    [businesses]
  );

  const filtered = businesses.filter((b) => {
    if (category && b.category !== category) return false;
    if (onlyAvailable && !b.bookable) return false;
    return true;
  });

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando negocios...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          Rubro
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="ml-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Todos</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Con disponibilidad
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No hay negocios que coincidan con el filtro.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((business) => (
            <Link key={business.id} href={`/reservar/${business.id}`}>
              <Card interactive>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900">{business.name}</h3>
                  {business.bookable && (
                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Disponible
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{business.category}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
