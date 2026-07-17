# Vercel Environment Variables Template

Add these in Vercel Project Settings -> Environment Variables.
Do not commit real values to GitHub.

```txt
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_JWT
NEXT_PUBLIC_VERDE_USER_ID=00000000-0000-0000-0000-000000000001
NEXT_PUBLIC_VERDE_NODE_ID=11111111-1111-1111-1111-111111111111
NEXT_PUBLIC_VERDE_NODE_SLUG=aarav-node-1

SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
VERDE_NODE_API_KEY=YOUR_LONG_RANDOM_HARDWARE_SECRET

PLANT_ID_API_KEY=optional_for_disease_detection
GEMINI_API_KEY=optional_for_ai_treatment_terminal
OPENWEATHER_API_KEY=optional_for_rain_override
VERDE_WEATHER_CITY=Delhi,IN
```

## Critical Rules

- `NEXT_PUBLIC_*` variables are visible to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` must be server-only.
- `VERDE_NODE_API_KEY` must match the key later pasted into ESP32 firmware.
- Rotate any key that was pasted in chat before final public exhibition.
