export const runtime = 'nodejs';

function present(name: string) {
  return Boolean(process.env[name] && !String(process.env[name]).includes('YOUR_'));
}

export async function GET() {
  return Response.json({
    ok: true,
    app: 'Verde Tech V3 Command Center',
    checked_at: new Date().toISOString(),
    env: {
      supabase_url: present('NEXT_PUBLIC_SUPABASE_URL'),
      supabase_anon_key: present('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      supabase_service_role: present('SUPABASE_SERVICE_ROLE_KEY'),
      hardware_secret: present('VERDE_NODE_API_KEY'),
      plant_id: present('PLANT_ID_API_KEY'),
      gemini: present('GEMINI_API_KEY'),
      openweather: present('OPENWEATHER_API_KEY')
    },
    routes: [
      '/',
      '/api/health',
      '/api/hardware/telemetry',
      '/api/hardware/controls',
      '/api/hardware/camera-upload',
      '/api/ai/analyze-latest',
      '/api/weather/refresh'
    ]
  });
}
