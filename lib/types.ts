export type SensorSnapshot = {
  moisture: number;
  temperature: number;
  humidity: number;
  tank_level: number;
  light_lux: number;
  soil_raw?: number;
  rssi?: number;
  updated_at: string;
};

export type ControlState = {
  manual_mode: boolean;
  pump_state: boolean;
  relay2_state: boolean;
  capture_photo: boolean;
  moisture_threshold: number;
  weather_override: boolean;
  emergency_stop: boolean;
  updated_at: string;
};

export type ReadingPoint = {
  time: string;
  moisture: number;
  temperature: number;
  humidity: number;
  tank_level: number;
  light_lux: number;
};


export type CameraCapture = {
  id: number;
  storage_path: string;
  public_url: string | null;
  byte_size: number | null;
  ai_status: string;
  created_at: string;
};
