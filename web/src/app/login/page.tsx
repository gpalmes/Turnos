import Link from 'next/link';
import { login } from './actions';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Container title="Iniciar sesión">
      <Card className="max-w-sm">
        {searchParams.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
        )}
        <form action={login} className="flex flex-col gap-4">
          <Input label="Email" type="email" name="email" required />
          <Input label="Contraseña" type="password" name="password" required />
          <Button type="submit">Entrar</Button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          o
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleLoginButton />

        <p className="mt-4 text-sm text-gray-600">
          ¿No tenés cuenta?{' '}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </Container>
  );
}
