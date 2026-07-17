import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url.includes('YOUR_PROJECT_REF')) {
    throw new Error('Supabase admin env is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function assertHardwareKey(req: Request) {
  const expected = process.env.VERDE_NODE_API_KEY;
  if (!expected || expected.includes('CHANGE_THIS')) {
    throw new Error('VERDE_NODE_API_KEY is not configured.');
  }

  const received = req.headers.get('x-verde-node-key');
  if (received !== expected) {
    const err = new Error('Unauthorized hardware request.');
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
}

export function apiError(error: unknown) {
  const e = error as Error & { status?: number };
  return Response.json(
    { ok: false, error: e.message || 'Unknown server error' },
    { status: e.status || 500 }
  );
}
