import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

// GET /auth/callback?code=... — Supabase redirige aca despues del login con Google.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email!.split('@')[0];

      // Los usuarios de Google nunca pasan por la Server Action de signup,
      // asi que el perfil en public.User se crea (o se confirma) aca.
      await prisma.user.upsert({
        where: { id: user.id },
        create: { id: user.id, email: user.email!, name, role: 'client' },
        update: {},
      });

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=No se pudo iniciar sesión con Google', request.url)
  );
}
