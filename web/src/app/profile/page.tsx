import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { updateName, changePassword } from './actions';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const ROLE_LABELS: Record<string, string> = {
  client: 'Cliente',
  operator: 'Operador',
  admin: 'Administrador',
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <Container title="Mi perfil">
      <div className="flex flex-col gap-6 max-w-sm">
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
        )}
        {searchParams.success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{searchParams.success}</p>
        )}

        <Card>
          <p className="text-sm text-gray-500">
            Email: <span className="text-gray-900">{user.email}</span>
          </p>
          <p className="text-sm text-gray-500">
            Rol: <span className="text-gray-900">{ROLE_LABELS[user.role] ?? user.role}</span>
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-gray-900">Editar nombre</h2>
          <form action={updateName} className="flex flex-col gap-4">
            <Input label="Nombre" type="text" name="name" defaultValue={user.name} required />
            <Button type="submit">Guardar nombre</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-gray-900">Cambiar contraseña</h2>
          <form action={changePassword} className="flex flex-col gap-4">
            <Input label="Contraseña nueva" type="password" name="password" required minLength={6} />
            <Input label="Confirmar contraseña" type="password" name="confirmPassword" required minLength={6} />
            <Button type="submit">Cambiar contraseña</Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
