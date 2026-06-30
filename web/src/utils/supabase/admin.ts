import { createClient } from '@supabase/supabase-js';

// Cliente con service role para operaciones de servidor (Storage): omite RLS.
// Requiere SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (.env.local).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (.env.local)'
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const RECEIPTS_BUCKET = 'receipts';
export const BUSINESS_IMAGES_BUCKET = 'business-images';

// Garantiza que exista un bucket (privado o público).
export async function ensureBucket(
  admin: ReturnType<typeof createAdminClient>,
  name: string,
  isPublic: boolean
) {
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b) => b.name === name)) {
    await admin.storage.createBucket(name, { public: isPublic });
  }
}

// Comprobantes: bucket privado.
export async function ensureReceiptsBucket(admin: ReturnType<typeof createAdminClient>) {
  await ensureBucket(admin, RECEIPTS_BUCKET, false);
}
