import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient, ensureReceiptsBucket, RECEIPTS_BUCKET } from '@/utils/supabase/admin';

const VALID_STATUS = ['pending', 'partial', 'paid'];
const VALID_METHODS = ['efectivo', 'transferencia', 'tarjeta'];

// POST /api/bookings/[id]/payment - Registrar pago y (opcional) adjuntar comprobante.
// Solo el dueño del negocio o un admin. Recibe multipart/form-data.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { business: { select: { ownerId: true } } },
    });

    const isOwner = booking?.business.ownerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!booking || (!isOwner && !isAdmin)) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const form = await req.formData();
    const paymentStatus = String(form.get('paymentStatus') || '');
    const amountRaw = form.get('paymentAmount');
    const method = form.get('paymentMethod') ? String(form.get('paymentMethod')) : null;
    const file = form.get('receipt');

    if (!VALID_STATUS.includes(paymentStatus)) {
      return NextResponse.json({ error: 'Estado de pago inválido' }, { status: 400 });
    }
    if (method && !VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 });
    }

    const paymentAmount =
      amountRaw !== null && amountRaw !== '' ? Number(amountRaw) : null;
    if (paymentAmount !== null && (!Number.isFinite(paymentAmount) || paymentAmount < 0)) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    let receiptPath = booking.receiptPath;

    // Subida del comprobante (si vino archivo).
    if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
      const admin = createAdminClient();
      await ensureReceiptsBucket(admin);

      const ext = file.name?.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${booking.id}/${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await admin.storage
        .from(RECEIPTS_BUCKET)
        .upload(path, buffer, { contentType: file.type || undefined, upsert: true });

      if (uploadError) {
        return NextResponse.json(
          { error: `No se pudo subir el comprobante: ${uploadError.message}` },
          { status: 500 }
        );
      }
      receiptPath = path;
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus, paymentAmount, paymentMethod: method, receiptPath },
    });

    return NextResponse.json(
      { id: updated.id, paymentStatus: updated.paymentStatus },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
