# Verde Tech V3.0 — Supabase Command Center

Aggressive competition-grade dashboard scaffold for Project Verde.

## What Works Now
- Cyberpunk responsive dashboard UI
- Mock live sensor animation when Supabase env is missing
- Supabase client auto-switch when env is added
- Realtime subscriptions prepared for `node_current_state` and `control_state`
- Manual mode, pump channel 1, relay channel 2, camera capture, threshold, emergency stop
- Full Supabase schema included

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase
Run:

```txt
supabase/schema.sql
```

Then follow:

```txt
docs/SUPABASE_SETUP.md
```

## Hardware Reality Locked In
- Soil sensor: new prong-style resistive sensor
- Firmware must power-gate soil probe using GPIO23
- Soil analog read: GPIO34
- Relay: new dual-channel relay
- Pump relay CH1: GPIO25
- Relay CH2 / aux: GPIO26 until Aarav confirms final wiring


## Production Health Check

After deployment, open:

```txt
/api/health
```

It shows which environment variables are present without exposing secret values.
