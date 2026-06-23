'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Business {
  id: string;
  name: string;
  category: string;
  email?: string;
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
  type: string;
}

interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
}

const STEP_LABELS = ['Negocio', 'Servicio', 'Recurso', 'Fecha y hora'];

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-4 text-sm text-gray-500 hover:text-brand-600">
      ← Atrás
    </button>
  );
}

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const [bookingDate, setBookingDate] = useState(todayStr());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await fetch('/api/businesses');
        const data = await res.json();
        setBusinesses(data);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  // Cada vez que estamos en el paso 4 con recurso + fecha, traemos los horarios disponibles.
  useEffect(() => {
    if (step !== 4 || !selectedBusiness || !selectedResource || !selectedService || !bookingDate) {
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSelectedSlot(null);
    setError('');

    const fetchSlots = async () => {
      try {
        const params = new URLSearchParams({
          businessId: selectedBusiness.id,
          resourceId: selectedResource.id,
          date: bookingDate,
          durationMinutes: String(selectedService.duration),
        });
        const res = await fetch(`/api/availability?${params}`);
        const data = await res.json();
        if (!cancelled) setSlots(data.slots ?? []);
      } catch (err) {
        console.error('Error fetching slots:', err);
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    fetchSlots();
    return () => {
      cancelled = true;
    };
  }, [step, selectedBusiness, selectedResource, selectedService, bookingDate]);

  const handleBusinessSelect = async (business: Business) => {
    setSelectedBusiness(business);
    setStep(2);

    try {
      const servicesRes = await fetch(`/api/services?businessId=${business.id}`);
      const servicesData = await servicesRes.json();
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching business details:', error);
    }
  };

  const handleServiceSelect = async (service: Service) => {
    setSelectedService(service);

    if (!selectedBusiness) return;

    try {
      const resourcesRes = await fetch(
        `/api/resources?businessId=${selectedBusiness.id}&serviceId=${service.id}`
      );
      const resourcesData: Resource[] = await resourcesRes.json();
      setResources(resourcesData);

      // Si hay un solo recurso, no tiene sentido pedir que lo elija: lo saltamos.
      if (resourcesData.length === 1) {
        setSelectedResource(resourcesData[0]);
        setStep(4);
      } else {
        setStep(3);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setStep(3);
    }
  };

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource);
    setStep(4);
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedBusiness(null);
    setSelectedService(null);
    setSelectedResource(null);
    setBookingDate(todayStr());
    setSlots([]);
    setSelectedSlot(null);
    setError('');
    setConfirmed(null);
    setNeedsLogin(false);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBusiness || !selectedService || !selectedResource || !selectedSlot) {
      setError('Elegí un horario para continuar');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          serviceId: selectedService.id,
          resourceId: selectedResource.id,
          startTime: selectedSlot.startTime,
        }),
      });

      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }

      if (res.ok) {
        const booking = await res.json();
        setConfirmed({ id: booking.id });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al reservar turno');
      }
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError('Error al reservar turno');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando negocios...</p>;
  }

  // Pantalla de confirmación final.
  if (confirmed) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">✓</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">¡Turno reservado!</h2>
            <p className="text-sm text-gray-500">Te esperamos en {selectedBusiness?.name}.</p>
          </div>
        </div>
        <div className="space-y-1 text-sm text-gray-700">
          <p><span className="font-medium text-gray-900">Servicio:</span> {selectedService?.name}</p>
          <p><span className="font-medium text-gray-900">Recurso:</span> {selectedResource?.name}</p>
          <p><span className="font-medium text-gray-900">Cuándo:</span> {selectedSlot && new Date(selectedSlot.startTime).toLocaleString('es-AR')}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/bookings">
            <Button>Ver mis reservas</Button>
          </Link>
          <Button variant="secondary" onClick={resetFlow}>Reservar otro turno</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm font-medium text-brand-600">
        Paso {step} de 4 · {STEP_LABELS[step - 1]}
      </p>

      {step === 1 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Selecciona un negocio</h2>
          {businesses.length === 0 ? (
            <p className="text-sm text-gray-500">No hay negocios disponibles aún.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {businesses.map((business) => (
                <Card
                  key={business.id}
                  interactive
                  onClick={() => handleBusinessSelect(business)}
                >
                  <h3 className="font-medium text-gray-900">{business.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{business.category}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedBusiness && (
        <div>
          <BackLink onClick={() => setStep(1)} />
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Servicios en {selectedBusiness.name}
          </h2>
          {services.length === 0 ? (
            <p className="text-sm text-gray-500">No hay servicios disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <Card key={service.id} interactive onClick={() => handleServiceSelect(service)}>
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">Duración: {service.duration} min</p>
                  <p className="mt-1 text-sm font-medium text-brand-600">${service.price}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && selectedService && (
        <div>
          <BackLink onClick={() => setStep(2)} />
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Selecciona un recurso</h2>
          {resources.length === 0 ? (
            <p className="text-sm text-gray-500">No hay recursos disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {resources.map((resource) => (
                <Card key={resource.id} interactive onClick={() => handleResourceSelect(resource)}>
                  <h3 className="font-medium text-gray-900">{resource.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{resource.type}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 4 && selectedService && (
        <div>
          {/* Si el recurso fue auto-seleccionado (uno solo), "Atrás" vuelve a Servicios. */}
          <BackLink onClick={() => setStep(resources.length === 1 ? 2 : 3)} />
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Selecciona fecha y hora</h2>

          <label className="mb-2 block text-sm font-medium text-gray-700">Fecha</label>
          <input
            type="date"
            value={bookingDate}
            min={todayStr()}
            onChange={(e) => setBookingDate(e.target.value)}
            className="mb-6 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
          />

          <p className="mb-2 text-sm font-medium text-gray-700">Horarios disponibles</p>
          {slotsLoading ? (
            <p className="text-sm text-gray-500">Buscando horarios...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay horarios para esta fecha. Probá con otro día.
            </p>
          ) : (
            <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : slot.available
                        ? 'border-gray-300 bg-white text-gray-700 hover:border-brand-400 hover:bg-brand-50'
                        : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through'
                    }`}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                );
              })}
            </div>
          )}

          {selectedSlot && (
            <Card className="mb-4 space-y-1 text-sm text-gray-700">
              <p><span className="font-medium text-gray-900">Negocio:</span> {selectedBusiness?.name}</p>
              <p><span className="font-medium text-gray-900">Servicio:</span> {selectedService.name} ({selectedService.duration} min)</p>
              <p><span className="font-medium text-gray-900">Recurso:</span> {selectedResource?.name}</p>
              <p><span className="font-medium text-gray-900">Cuándo:</span> {new Date(selectedSlot.startTime).toLocaleString('es-AR')}</p>
              <p><span className="font-medium text-gray-900">Precio:</span> ${selectedService.price}</p>
            </Card>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {needsLogin ? (
            <p className="text-sm text-gray-600">
              Necesitás iniciar sesión para reservar.{' '}
              <Link href="/login" className="font-medium text-brand-600 hover:underline">
                Iniciar sesión
              </Link>
            </p>
          ) : (
            <Button onClick={handleConfirmBooking} loading={submitting} disabled={!selectedSlot}>
              Confirmar reserva
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
