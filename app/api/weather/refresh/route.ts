import { apiError, getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) {
      return Response.json({ ok: false, error: 'OPENWEATHER_API_KEY missing. Add it to enable rain override.' }, { status: 501 });
    }

    const nodeSlug = process.env.NEXT_PUBLIC_VERDE_NODE_SLUG || 'aarav-node-1';
    const city = process.env.VERDE_WEATHER_CITY || 'Delhi,IN';
    const supabase = getSupabaseAdmin();

    const { data: node, error: nodeError } = await supabase.from('verde_nodes').select('id, slug').eq('slug', nodeSlug).maybeSingle();
    if (nodeError) throw nodeError;
    if (!node) throw new Error(`Unknown node_slug: ${nodeSlug}`);

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`OpenWeather failed: ${res.status} ${await res.text()}`);
    const json = await res.json();

    const next12Hours = (json.list || []).slice(0, 4);
    const rainPredicted = next12Hours.some((item: any) => {
      const weather = item.weather?.[0]?.main?.toLowerCase() || '';
      const pop = Number(item.pop || 0);
      const rainVolume = Number(item.rain?.['3h'] || 0);
      return weather.includes('rain') || pop >= 0.45 || rainVolume > 0;
    });

    const { error: updateError } = await supabase
      .from('control_state')
      .update({ weather_override: rainPredicted })
      .eq('node_id', node.id);
    if (updateError) throw updateError;

    await supabase.from('command_events').insert({
      node_id: node.id,
      command: 'weather_override_refresh',
      payload: { city, rainPredicted, checkedWindows: next12Hours.map((x: any) => ({ dt_txt: x.dt_txt, pop: x.pop, weather: x.weather, rain: x.rain })) },
      source: 'weather-api'
    });

    return Response.json({ ok: true, city, rainPredicted, checked_windows: next12Hours.length });
  } catch (error) {
    return apiError(error);
  }
}
