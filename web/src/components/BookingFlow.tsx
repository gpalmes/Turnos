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

const STEP_LABELS = ['Negocio', 'Servicio', 'Recurso', 'Fecha y hora'];

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
  const [bookingDate, setBookingDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

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
    setStep(3);

    if (!selectedBusiness) return;

    try {
      const resourcesRes = await fetch(
        `/api/resources?businessId=${selectedBusiness.id}&serviceId=${service.id}`
      );
      const resourcesData = await resourcesRes.json();
      setResources(resourcesData);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource);
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBusiness || !selectedService || !selectedResource || !bookingDate) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          serviceId: selectedService.id,
          resourceId: selectedResource.id,
          startTime: bookingDate,
        }),
      });

      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }

      if (res.ok) {
        const booking = await res.json();
        alert(`¡Turno reservado! ID: ${booking.id}`);
        setStep(1);
        setSelectedBusiness(null);
        setSelectedService(null);
        setSelectedResource(null);
        setBookingDate('');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al reservar turno');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Error al reservar turno');
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando negocios...</p>;
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
          <BackLink onClick={() => setStep(3)} />
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Selecciona fecha y hora</h2>
          <input
            type="datetime-local"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="mb-4 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Card className="mb-4 space-y-1 text-sm text-gray-700">
            <p><span className="font-medium text-gray-900">Negocio:</span> {selectedBusiness?.name}</p>
            <p><span className="font-medium text-gray-900">Servicio:</span> {selectedService.name} ({selectedService.duration} min)</p>
            <p><span className="font-medium text-gray-900">Recurso:</span> {selectedResource?.name}</p>
            <p><span className="font-medium text-gray-900">Precio:</span> ${selectedService.price}</p>
          </Card>
          {needsLogin ? (
            <p className="text-sm text-gray-600">
              Necesitás iniciar sesión para reservar.{' '}
              <Link href="/login" className="font-medium text-brand-600 hover:underline">
                Iniciar sesión
              </Link>
            </p>
          ) : (
            <Button onClick={handleConfirmBooking} disabled={!bookingDate}>
              Confirmar reserva
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
