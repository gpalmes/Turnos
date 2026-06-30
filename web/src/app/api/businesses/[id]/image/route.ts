import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient, ensureBucket, BUSINESS_IMAGES_BUCKET } from '@/utils/supabase/admin';

// POST /api/businesses/[id]/image - Subir foto del negocio (dueño/admin).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    const isOwner = business?.ownerId === user.id;
    const isAdmin = user.role === 'admin';
    if (!business || (!isOwner && !isAdmin)) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get('image');
    if (!file || typeof file !== 'object' || !('arrayBuffer' in file) || file.size === 0) {
      return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
    }

    const admin = createAdminClient();
    await ensureBucket(admin, BUSINESS_IMAGES_BUCKET, true);

    const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${params.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUSINESS_IMAGES_BUCKET)
      .upload(path, buffer, { contentType: file.type || undefined, upsert: true });

    if (uploadError) {
      return NextResponse.json(
        { error: `No se pudo subir la imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data } = admin.storage.from(BUSINESS_IMAGES_BUCKET).getPublicUrl(path);
    const imageUrl = data.publicUrl;

    await prisma.business.update({ where: { id: params.id }, data: { imageUrl } });

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
