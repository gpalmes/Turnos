import BusinessDirectory from '@/components/BusinessDirectory';
import Container from '@/components/ui/Container';

export default function Home() {
  return (
    <Container title="Turnos">
      <p className="mb-8 text-gray-600">Elegí un negocio para sacar un turno.</p>
      <BusinessDirectory />
    </Container>
  );
}
