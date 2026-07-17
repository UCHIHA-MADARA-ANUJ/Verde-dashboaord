# Verde V3.0 Hardware API Contract

This is the contract Aarav's ESP32 firmware will use after physical wiring is finalized.

## Common Header
Every hardware request must include:

```http
x-verde-node-key: YOUR_VERDE_NODE_API_KEY
```

The camera upload also includes:

```http
x-verde-node-slug: aarav-node-1
content-type: image/jpeg
```

## 1. ESP32 Main Brain -> Telemetry Upload

```http
POST /api/hardware/telemetry
content-type: application/json
x-verde-node-key: ...
```

Body:

```json
{
  "node_slug": "aarav-node-1",
  "moisture": 37,
  "temperature": 28.4,
  "humidity": 62,
  "tank_level": 74,
  "light_lux": 486,
  "soil_raw": 2870,
  "rssi": -53,
  "firmware_version": "verde-main-0.1"
}
```

Server writes:
- `node_current_state`
- `sensor_readings`

## 2. ESP32 Main Brain -> Poll Controls

```http
GET /api/hardware/controls?node_slug=aarav-node-1
x-verde-node-key: ...
```

Response:

```json
{
  "ok": true,
  "node": { "id": "...", "slug": "aarav-node-1" },
  "controls": {
    "manual_mode": false,
    "pump_state": false,
    "relay2_state": false,
    "capture_photo": false,
    "moisture_threshold": 42,
    "weather_override": false,
    "emergency_stop": false,
    "updated_at": "..."
  }
}
```

## 3. ESP32-CAM -> Upload Raw JPEG

```http
POST /api/hardware/camera-upload
content-type: image/jpeg
x-verde-node-key: ...
x-verde-node-slug: aarav-node-1
```

Body: raw JPEG bytes from `esp_camera_fb_get()`.

Server writes:
- Supabase Storage bucket `plant-captures`
- `camera_captures`
- resets `control_state.capture_photo = false`

## Firmware-Hardware Reality

Current confirmed hardware:
- Resistive prong soil sensor.
- Soil probe VCC must be power-gated from GPIO23.
- Soil analog on GPIO34.
- Dual-channel relay.
- Pump relay CH1 on GPIO25.
- Relay CH2 / Aux on GPIO26 only after final wiring confirmation.
