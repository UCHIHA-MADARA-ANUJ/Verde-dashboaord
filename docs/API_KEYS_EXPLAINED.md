# Verde API Keys Explained Like a Human

## Supabase URL + Anon Key
Used by the browser dashboard to read realtime data and write allowed demo controls.
This key is public by design, but database policies must control what it can do.

## Supabase Service Role Key
Server-only master key. It bypasses Row Level Security.
Never commit it. Never put it in frontend code. Put it only in Vercel environment variables.
Because it was shared in chat, rotate it before the final public demo if possible.

## VERDE_NODE_API_KEY
This is our own hardware password.

Why it exists:
- ESP32 cannot safely hold your Supabase service role key.
- Random people should not be able to POST fake sensor data.
- So ESP32 sends a simple secret header to our Next.js API.

Example hardware request header:

```http
x-verde-node-key: a-long-random-secret
```

Server checks it against:

```txt
VERDE_NODE_API_KEY
```

If it matches, server writes to Supabase using the service role key.
If it does not match, request is rejected.

## Plant.id API Key
Used later by `/api/ai/analyze-latest` to inspect the latest ESP32-CAM plant image.

## Gemini API Key
Used later to convert Plant.id disease data into friendly treatment instructions.

## OpenWeather API Key
Used later by `/api/weather/refresh` to set `weather_override` when rain is likely in Delhi.
