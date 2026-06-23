'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import DayCalendar from '@/components/DayCalendar';
import BookingFlow from '@/components/BookingFlow';

interface Business {
  id: string;
  name: string;
}

interface Resource {
  id: string;
  name: string;
}

export default function BusinessBooking({
  business,
  resources,
}: {
  business: Business;
  resources: Resource[];
}) {
  const [mode, setMode] = useState<'explore' | 'book'>('explore');

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant={mode === 'explore' ? 'primary' : 'secondary'}
          onClick={() => setMode('explore')}
        >
          Buscar disponibilidad
        </Button>
        <Button
          variant={mode === 'book' ? 'primary' : 'secondary'}
          onClick={() => setMode('book')}
        >
          Nueva reserva
        </Button>
      </div>

      {mode === 'explore' ? (
        <DayCalendar businessId={business.id} resources={resources} />
      ) : (
        <BookingFlow business={business} />
      )}
    </div>
  );
}
