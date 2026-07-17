import { ControlState, ReadingPoint, SensorSnapshot } from './types';

export const mockSensor: SensorSnapshot = {
  moisture: 37,
  temperature: 28.4,
  humidity: 62,
  tank_level: 74,
  light_lux: 486,
  soil_raw: 2870,
  rssi: -53,
  updated_at: new Date().toISOString()
};

export const mockControls: ControlState = {
  manual_mode: false,
  pump_state: false,
  relay2_state: false,
  capture_photo: false,
  moisture_threshold: 42,
  weather_override: false,
  emergency_stop: false,
  updated_at: new Date().toISOString()
};

export function buildMockHistory(): ReadingPoint[] {
  const now = Date.now();
  return Array.from({ length: 24 }).map((_, i) => {
    const t = new Date(now - (23 - i) * 5 * 60_000);
    return {
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moisture: Math.max(18, Math.min(82, 44 + Math.sin(i / 2) * 9 - i * 0.25)),
      temperature: Math.round((27 + Math.sin(i / 3) * 2.5) * 10) / 10,
      humidity: Math.round(59 + Math.cos(i / 4) * 7),
      tank_level: Math.max(0, 82 - i * 0.7),
      light_lux: Math.round(420 + Math.sin(i / 2.3) * 260)
    };
  });
}
