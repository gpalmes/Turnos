'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function updateName(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const name = String(formData.get('name') || '').trim();

  if (!name) {
    redirect('/profile?error=El nombre no puede estar vacío');
  }

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  redirect('/profile?success=Nombre actualizado');
}

export async function changePassword(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (password.length < 6) {
    redirect('/profile?error=La contraseña debe tener al menos 6 caracteres');
  }

  if (password !== confirmPassword) {
    redirect('/profile?error=Las contraseñas no coinciden');
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/profile?success=Contraseña actualizada');
}
