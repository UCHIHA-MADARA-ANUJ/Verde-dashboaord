# Verde V3 API Implementation Status

This project contains the API code for every planned Verde V3 integration. Real secret values must be added only in local/Vercel environment variables, not committed to GitHub.

## Implemented Routes

| Route | Status | Purpose | Required Env |
|---|---:|---|---|
| `/api/health` | Done | Safe production health/env presence check | none |
| `/api/hardware/telemetry` | Done | ESP32 posts sensor telemetry | `SUPABASE_SERVICE_ROLE_KEY`, `VERDE_NODE_API_KEY` |
| `/api/hardware/controls` | Done | ESP32 polls dashboard commands | `SUPABASE_SERVICE_ROLE_KEY`, `VERDE_NODE_API_KEY` |
| `/api/hardware/camera-upload` | Done | ESP32-CAM uploads JPEG bytes | `SUPABASE_SERVICE_ROLE_KEY`, `VERDE_NODE_API_KEY` |
| `/api/ai/analyze-latest` | Done | Plant.id diagnosis + Gemini/OpenRouter treatment guide | `PLANT_ID_API_KEY`, plus `GEMINI_API_KEY` or optional `OPENROUTER_API_KEY` |
| `/api/weather/refresh` | Done | Delhi rain forecast -> `weather_override` | `OPENWEATHER_API_KEY` |

## AI Provider Strategy

Primary treatment AI:

```txt
GEMINI_API_KEY
```

Optional backup/fallback:

```txt
OPENROUTER_API_KEY
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

OpenRouter is not mandatory because the direct Gemini route already exists. It is only useful as a backup or if you want to swap models later.

## Why Secrets Are Not Committed

Even if the GitHub repository is private, secrets should not be committed because:

1. private repos can become public by accident,
2. tokens remain forever in git history unless purged,
3. deployment platforms expect secrets as environment variables,
4. GitHub may automatically revoke exposed tokens,
5. judges/teammates should never need master keys in source code.

Use `.env.local` locally and Vercel Environment Variables in production.
