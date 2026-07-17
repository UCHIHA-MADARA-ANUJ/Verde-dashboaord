'use client';

import { ControlState } from '@/lib/types';

type Props = {
  controls: ControlState;
  busy: boolean;
  onPatch: (patch: Partial<ControlState>) => Promise<void>;
};

export function ControlPanel({ controls, busy, onPatch }: Props) {
  return (
    <section className="panel control-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Hardware authority</p>
          <h3>Control Matrix</h3>
        </div>
        <span className={busy ? 'status-chip warn' : 'status-chip'}>{busy ? 'SYNCING' : 'ARMED'}</span>
      </div>

      <div className="switch-grid">
        <button
          className={`toggle ${controls.manual_mode ? 'on' : ''}`}
          onClick={() => onPatch({ manual_mode: !controls.manual_mode })}
        >
          <span>Manual Mode</span>
          <b>{controls.manual_mode ? 'ON' : 'AUTO'}</b>
        </button>

        <button
          className={`toggle ${controls.pump_state ? 'on' : ''}`}
          disabled={!controls.manual_mode || controls.emergency_stop}
          onClick={() => onPatch({ pump_state: !controls.pump_state })}
        >
          <span>Pump Relay CH1</span>
          <b>{controls.pump_state ? 'ON' : 'OFF'}</b>
        </button>

        <button
          className={`toggle ${controls.relay2_state ? 'on' : ''}`}
          disabled={!controls.manual_mode || controls.emergency_stop}
          onClick={() => onPatch({ relay2_state: !controls.relay2_state })}
        >
          <span>Relay CH2 / Aux</span>
          <b>{controls.relay2_state ? 'ON' : 'OFF'}</b>
        </button>

        <button
          className={`toggle ${controls.capture_photo ? 'on pulse' : ''}`}
          onClick={() => onPatch({ capture_photo: true })}
        >
          <span>ESP32-CAM Capture</span>
          <b>{controls.capture_photo ? 'QUEUED' : 'FIRE'}</b>
        </button>
      </div>

      <label className="slider-label">
        Moisture Threshold <b>{controls.moisture_threshold}%</b>
        <input
          type="range"
          min="15"
          max="80"
          value={controls.moisture_threshold}
          onChange={(e) => onPatch({ moisture_threshold: Number(e.target.value) })}
        />
      </label>

      <div className="danger-row">
        <button
          className={`kill ${controls.emergency_stop ? 'active' : ''}`}
          onClick={() => onPatch({ emergency_stop: !controls.emergency_stop, pump_state: false, relay2_state: false })}
        >
          {controls.emergency_stop ? 'EMERGENCY STOP ACTIVE' : 'ARM EMERGENCY STOP'}
        </button>
      </div>
    </section>
  );
}
