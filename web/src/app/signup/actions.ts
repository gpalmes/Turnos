'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function signup(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim().slice(0, 200);

  if (!name) {
    redirect(`/signup?error=${encodeURIComponent('El nombre es obligatorio')}`);
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect(`/signup?error=${encodeURIComponent('No se pudo crear el usuario')}`);
  }

  await prisma.user.upsert({
    where: { id: data.user!.id },
    create: { id: data.user!.id, email, name, role: 'client' },
    update: {},
  });

  redirect('/login');
}
