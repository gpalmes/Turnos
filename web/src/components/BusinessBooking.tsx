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
  const [booking, setBooking] = useState(false);

  if (booking) {
    return (
      <div>
        <button
          onClick={() => setBooking(false)}
          className="mb-4 text-sm text-gray-500 hover:text-brand-600"
        >
          ← Volver a disponibilidad
        </button>
        <BookingFlow business={business} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button onClick={() => setBooking(true)}>Nueva reserva</Button>
      </div>
      <DayCalendar businessId={business.id} resources={resources} />
    </div>
  );
}
