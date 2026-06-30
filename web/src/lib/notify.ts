import prisma from '@/lib/prisma';

// Crea una notificación in-app. Nunca rompe el flujo principal si falla.
export async function notify(userId: string, message: string, link?: string) {
  try {
    await prisma.notification.create({ data: { userId, message, link } });
  } catch (err) {
    console.error('No se pudo crear la notificación:', err);
  }
}
