import { apiError, assertHardwareKey, getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    assertHardwareKey(req);
    const { searchParams } = new URL(req.url);
    const nodeSlug = searchParams.get('node_slug') || process.env.NEXT_PUBLIC_VERDE_NODE_SLUG;
    const supabase = getSupabaseAdmin();

    const { data: node, error: nodeError } = await supabase
      .from('verde_nodes')
      .select('id, slug')
      .eq('slug', nodeSlug)
      .maybeSingle();
    if (nodeError) throw nodeError;
    if (!node) throw new Error(`Unknown node_slug: ${nodeSlug}`);

    const { data, error } = await supabase
      .from('control_state')
      .select('manual_mode,pump_state,relay2_state,capture_photo,moisture_threshold,weather_override,emergency_stop,updated_at')
      .eq('node_id', node.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No control_state row found for node. Run schema seed.');

    return Response.json({ ok: true, node, controls: data });
  } catch (error) {
    return apiError(error);
  }
}
