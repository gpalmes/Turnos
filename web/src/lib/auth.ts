import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function getSessionUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const profile = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true, name: true },
  });

  return {
    id: data.user.id,
    email: data.user.email!,
    role: profile?.role ?? 'client',
    name: profile?.name ?? '',
  };
}
