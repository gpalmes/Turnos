import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logout } from './logout/actions';

export const metadata: Metadata = {
  title: 'Turnos',
  description: 'App de gestión de turnos adaptable a múltiples negocios',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  operator: 'Negocio',
  client: 'Cliente',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const unread = user
    ? await prisma.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  const navLinkClass = 'text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors';

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold text-gray-900">
              Turnos
            </Link>
            <nav className="flex items-center gap-5">
              {user ? (
                <>
                  <Link href="/" className={navLinkClass}>Reservar</Link>
                  <Link href="/bookings" className={navLinkClass}>Mis reservas</Link>
                  <span className="h-4 w-px bg-gray-200" aria-hidden />
                  <Link href="/businesses" className={navLinkClass}>Mis negocios</Link>
                  <span className="h-4 w-px bg-gray-200" aria-hidden />
                  <Link href="/profile" className={navLinkClass}>Mi perfil</Link>
                  <Link href="/notificaciones" className="relative text-lg" title="Notificaciones">
                    🔔
                    {unread > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </Link>
                  <form action={logout}>
                    <button type="submit" className={navLinkClass}>
                      Cerrar sesión — {user.email} ({ROLE_LABELS[user.role] ?? user.role})
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className={navLinkClass}>Iniciar sesión</Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Registrarme
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
