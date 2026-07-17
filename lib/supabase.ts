import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const nodeId = process.env.NEXT_PUBLIC_VERDE_NODE_ID || '11111111-1111-1111-1111-111111111111';
export const nodeSlug = process.env.NEXT_PUBLIC_VERDE_NODE_SLUG || 'aarav-node-1';

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('YOUR_PROJECT_REF');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null;
