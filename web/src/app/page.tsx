import BookingFlow from '@/components/BookingFlow';
import Container from '@/components/ui/Container';

export default function Home() {
  return (
    <Container title="Turnos">
      <p className="mb-8 text-gray-600">Reservá un turno en pocos pasos.</p>
      <BookingFlow />
    </Container>
  );
}
