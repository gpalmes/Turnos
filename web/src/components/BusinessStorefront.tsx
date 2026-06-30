'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import DayCalendar from '@/components/DayCalendar';
import BookingFlow from '@/components/BookingFlow';

interface Business {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Resource {
  id: string;
  name: string;
}

export default function BusinessStorefront({
  business,
  services,
  resources,
}: {
  business: Business;
  services: Service[];
  resources: Resource[];
}) {
  const [bookingService, setBookingService] = useState<Service | null>(null);

  // Modo reserva: entró desde una tarjeta de servicio.
  if (bookingService) {
    return (
      <div>
        <button
          onClick={() => setBookingService(null)}
          className="mb-4 text-sm text-gray-500 hover:text-brand-600"
        >
          ← Volver al negocio
        </button>
        <BookingFlow business={business} initialService={bookingService} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Servicios (la "carta") */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Servicios</h2>
        {services.length === 0 ? (
          <p className="text-sm text-gray-500">Este negocio todavía no cargó servicios.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900">{s.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{s.duration} min</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-600">${s.price}</p>
                </div>
                <Button onClick={() => setBookingService(s)} className="shrink-0">
                  Reservar
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Disponibilidad */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Disponibilidad</h2>
        <DayCalendar businessId={business.id} resources={resources} />
      </section>
    </div>
  );
}
