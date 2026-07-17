import { apiError, getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

type PlantIdSuggestion = {
  name?: string;
  probability?: number;
};

type PlantIdDisease = {
  name?: string;
  probability?: number;
};

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 700 }
    })
  });

  if (!res.ok) throw new Error(`Gemini failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
}

export async function POST(req: Request) {
  try {
    const plantKey = process.env.PLANT_ID_API_KEY;
    if (!plantKey) {
      return Response.json({ ok: false, error: 'PLANT_ID_API_KEY missing. Add it to Vercel/env to enable diagnosis.' }, { status: 501 });
    }

    const { node_slug = process.env.NEXT_PUBLIC_VERDE_NODE_SLUG || 'aarav-node-1' } = await req.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();

    const { data: node, error: nodeError } = await supabase.from('verde_nodes').select('id, slug').eq('slug', node_slug).maybeSingle();
    if (nodeError) throw nodeError;
    if (!node) throw new Error(`Unknown node_slug: ${node_slug}`);

    const { data: capture, error: captureError } = await supabase
      .from('camera_captures')
      .select('id, storage_path')
      .eq('node_id', node.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (captureError) throw captureError;
    if (!capture) throw new Error('No camera capture found for this node.');

    const { data: fileData, error: downloadError } = await supabase.storage.from('plant-captures').download(capture.storage_path);
    if (downloadError) throw downloadError;

    const imageBuffer = Buffer.from(await fileData.arrayBuffer());
    const base64 = imageBuffer.toString('base64');

    const plantRes = await fetch('https://plant.id/api/v3/health_assessment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': plantKey
      },
      body: JSON.stringify({
        images: [base64],
        similar_images: false,
        health: 'all'
      })
    });

    if (!plantRes.ok) throw new Error(`Plant.id failed: ${plantRes.status} ${await plantRes.text()}`);
    const plantJson = await plantRes.json();

    const plantSuggestion = plantJson?.result?.classification?.suggestions?.[0] as PlantIdSuggestion | undefined;
    const diseaseSuggestion = plantJson?.result?.disease?.suggestions?.[0] as PlantIdDisease | undefined;
    const isHealthyProbability = plantJson?.result?.is_healthy?.probability;

    const plantName = plantSuggestion?.name || 'Unknown plant';
    const diseaseName = diseaseSuggestion?.name || (isHealthyProbability > 0.65 ? 'No major disease detected' : 'Possible stress detected');
    const confidence = diseaseSuggestion?.probability ?? plantSuggestion?.probability ?? isHealthyProbability ?? null;

    const geminiPrompt = `You are Verde AI for a school IoT plant-care exhibition in Delhi. Convert this plant diagnostic data into a concise, friendly treatment guide for dashboard display. Plant: ${plantName}. Disease/stress: ${diseaseName}. Confidence: ${confidence}. Return a short summary and 5 practical treatment steps. Avoid dangerous chemical instructions. Raw Plant.id JSON: ${JSON.stringify(plantJson).slice(0, 6000)}`;
    const geminiText = await callGemini(geminiPrompt);

    const summary = geminiText || `Plant: ${plantName}. Assessment: ${diseaseName}. Confidence: ${confidence == null ? 'not available' : Math.round(Number(confidence) * 100) + '%'}. Add Gemini API key for detailed treatment guidance.`;

    const { data: diagnosis, error: diagnosisError } = await supabase
      .from('ai_diagnoses')
      .insert({
        node_id: node.id,
        capture_id: capture.id,
        plant_name: plantName,
        disease_name: diseaseName,
        confidence,
        severity: confidence && confidence > 0.75 ? 'medium' : 'low',
        summary,
        treatment_steps: geminiText ? geminiText.split('\n').filter(Boolean).slice(0, 8) : [],
        raw_response: plantJson
      })
      .select('*')
      .single();
    if (diagnosisError) throw diagnosisError;

    await supabase.from('camera_captures').update({ ai_status: 'complete' }).eq('id', capture.id);

    return Response.json({ ok: true, diagnosis });
  } catch (error) {
    return apiError(error);
  }
}
