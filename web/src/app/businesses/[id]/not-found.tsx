import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>No encontrado</h1>
      <p>Este negocio no existe o no tenés acceso.</p>
      <Link href="/businesses">← Mis negocios</Link>
    </main>
  );
}
