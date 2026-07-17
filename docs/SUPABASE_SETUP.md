# Verde V3.0 Supabase Setup — Zero-to-Live

## 1. Create Project
1. Go to Supabase.
2. New project: `verde-v3-command-center`.
3. Region: closest available to India/Singapore.
4. Save the project password privately.

## 2. Run Schema
1. Open Supabase Dashboard -> SQL Editor.
2. Paste `supabase/schema.sql`.
3. Run it.

This creates:
- node registry
- current sensor state
- historical readings
- app control state
- command event audit trail
- camera capture metadata
- AI diagnosis table
- private `plant-captures` Storage bucket

## 3. Turn on Realtime
In Supabase Dashboard -> Database -> Replication / Realtime, enable realtime for:
- `node_current_state`
- `control_state`
- `sensor_readings`
- `camera_captures`
- `ai_diagnoses`

## 4. Configure App Env
Copy `.env.example` to `.env.local`.
Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VERDE_NODE_API_KEY=long-random-secret
```

## 5. App/HW Contract
Dashboard writes commands to:

```txt
control_state
```

ESP32 reads:

```txt
manual_mode
pump_state
relay2_state
capture_photo
moisture_threshold
weather_override
emergency_stop
```

ESP32 posts telemetry to server API, which writes:

```txt
node_current_state
sensor_readings
```

## 6. Security Direction
For exhibition speed, the current schema allows public demo dashboard reads and control updates. Before public deployment, lock controls behind Supabase Auth or server-only API routes.
