import { apiError, assertHardwareKey, getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    assertHardwareKey(req);
    const contentType = req.headers.get('content-type') || 'image/jpeg';
    if (!contentType.includes('image/')) throw new Error('camera-upload expects raw image bytes.');

    const nodeSlug = req.headers.get('x-verde-node-slug') || process.env.NEXT_PUBLIC_VERDE_NODE_SLUG || 'aarav-node-1';
    const supabase = getSupabaseAdmin();

    const { data: node, error: nodeError } = await supabase
      .from('verde_nodes')
      .select('id, slug')
      .eq('slug', nodeSlug)
      .maybeSingle();
    if (nodeError) throw nodeError;
    if (!node) throw new Error(`Unknown node_slug: ${nodeSlug}`);

    const bytes = await req.arrayBuffer();
    if (bytes.byteLength < 1000) throw new Error('Image too small or empty.');
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('Image too large. Max 5 MB.');

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const storagePath = `${node.slug}/${stamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('plant-captures')
      .upload(storagePath, bytes, { contentType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: signed } = await supabase.storage
      .from('plant-captures')
      .createSignedUrl(storagePath, 60 * 60 * 24);

    const { data: capture, error: captureError } = await supabase
      .from('camera_captures')
      .insert({
        node_id: node.id,
        storage_path: storagePath,
        public_url: signed?.signedUrl || null,
        byte_size: bytes.byteLength,
        ai_status: 'pending'
      })
      .select('id, storage_path, public_url, created_at')
      .single();
    if (captureError) throw captureError;

    await supabase
      .from('control_state')
      .update({ capture_photo: false })
      .eq('node_id', node.id);

    return Response.json({ ok: true, capture });
  } catch (error) {
    return apiError(error);
  }
}
