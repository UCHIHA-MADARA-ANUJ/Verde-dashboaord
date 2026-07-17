import { apiError, assertHardwareKey, getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

type TelemetryPayload = {
  node_id?: string;
  node_slug?: string;
  moisture: number;
  temperature: number;
  humidity: number;
  tank_level: number;
  light_lux: number;
  soil_raw?: number;
  rssi?: number;
  firmware_version?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function POST(req: Request) {
  try {
    assertHardwareKey(req);
    const body = (await req.json()) as TelemetryPayload;
    const supabase = getSupabaseAdmin();

    let nodeId = body.node_id || process.env.NEXT_PUBLIC_VERDE_NODE_ID;
    if (body.node_slug) {
      const { data, error } = await supabase.from('verde_nodes').select('id').eq('slug', body.node_slug).maybeSingle();
      if (error) throw error;
      if (data?.id) nodeId = data.id;
    }
    if (!nodeId) throw new Error('Missing node_id or node_slug.');

    const clean = {
      node_id: nodeId,
      moisture: clamp(Number(body.moisture), 0, 100),
      temperature: Number(body.temperature),
      humidity: clamp(Number(body.humidity), 0, 100),
      tank_level: clamp(Number(body.tank_level), 0, 100),
      light_lux: Math.max(0, Math.round(Number(body.light_lux || 0))),
      soil_raw: body.soil_raw == null ? null : Math.round(Number(body.soil_raw)),
      rssi: body.rssi == null ? null : Math.round(Number(body.rssi)),
      firmware_version: body.firmware_version || null,
      updated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase.from('node_current_state').upsert(clean);
    if (upsertError) throw upsertError;

    const { error: insertError } = await supabase.from('sensor_readings').insert({
      node_id: nodeId,
      moisture: clean.moisture,
      temperature: clean.temperature,
      humidity: clean.humidity,
      tank_level: clean.tank_level,
      light_lux: clean.light_lux,
      soil_raw: clean.soil_raw,
      rssi: clean.rssi
    });
    if (insertError) throw insertError;

    return Response.json({ ok: true, node_id: nodeId, accepted_at: clean.updated_at });
  } catch (error) {
    return apiError(error);
  }
}
