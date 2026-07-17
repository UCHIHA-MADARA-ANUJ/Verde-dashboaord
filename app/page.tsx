'use client';

import { useEffect, useMemo, useState } from 'react';
import { Droplets, Gauge, Radio, Sprout, SunMedium, Thermometer, Wifi } from 'lucide-react';
import { CameraPanel } from '@/components/CameraPanel';
import { ControlPanel } from '@/components/ControlPanel';
import { MetricCard } from '@/components/MetricCard';
import { SensorChart } from '@/components/SensorChart';
import { buildMockHistory, mockControls, mockSensor } from '@/lib/mock';
import { isSupabaseConfigured, nodeId, nodeSlug, supabase } from '@/lib/supabase';
import { CameraCapture, ControlState, ReadingPoint, SensorSnapshot } from '@/lib/types';

export default function Home() {
  const [sensor, setSensor] = useState<SensorSnapshot>(mockSensor);
  const [controls, setControls] = useState<ControlState>(mockControls);
  const [history, setHistory] = useState<ReadingPoint[]>(() => buildMockHistory());
  const [busy, setBusy] = useState(false);
  const [captures, setCaptures] = useState<CameraCapture[]>([]);
  const [lastEvent, setLastEvent] = useState('Booted in mock mode. Supabase credentials not installed yet.');

  const systemMode = isSupabaseConfigured ? 'SUPABASE LIVE' : 'MOCK WAR ROOM';

  useEffect(() => {
    if (!supabase) {
      const timer = setInterval(() => {
        setSensor((prev) => {
          const next = {
            ...prev,
            moisture: Math.max(15, Math.min(90, prev.moisture + (Math.random() - 0.56) * 3)),
            temperature: Math.round((prev.temperature + (Math.random() - 0.5) * 0.35) * 10) / 10,
            humidity: Math.round(Math.max(30, Math.min(95, prev.humidity + (Math.random() - 0.5) * 2))),
            tank_level: Math.max(0, Math.min(100, prev.tank_level - Math.random() * 0.15)),
            light_lux: Math.round(Math.max(40, Math.min(1300, prev.light_lux + (Math.random() - 0.5) * 45))),
            updated_at: new Date().toISOString()
          };
          setHistory((h) => [...h.slice(-23), {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            moisture: Math.round(next.moisture),
            temperature: next.temperature,
            humidity: next.humidity,
            tank_level: Math.round(next.tank_level),
            light_lux: next.light_lux
          }]);
          return next;
        });
      }, 2500);
      return () => clearInterval(timer);
    }

    async function bootLive() {
      setLastEvent('Connecting to Supabase realtime...');
      const [stateResult, controlResult, historyResult, cameraResult] = await Promise.all([
        supabase!.from('node_current_state').select('*').eq('node_id', nodeId).maybeSingle(),
        supabase!.from('control_state').select('*').eq('node_id', nodeId).maybeSingle(),
        supabase!.from('sensor_readings').select('*').eq('node_id', nodeId).order('created_at', { ascending: false }).limit(24),
        supabase!.from('camera_captures').select('id,storage_path,public_url,byte_size,ai_status,created_at').eq('node_id', nodeId).order('created_at', { ascending: false }).limit(8)
      ]);

      if (stateResult.data) setSensor({ ...stateResult.data, updated_at: stateResult.data.updated_at });
      if (controlResult.data) setControls({ ...controlResult.data, updated_at: controlResult.data.updated_at });
      if (historyResult.data) {
        setHistory(historyResult.data.reverse().map((r: any) => ({
          time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moisture: r.moisture,
          temperature: r.temperature,
          humidity: r.humidity,
          tank_level: r.tank_level,
          light_lux: r.light_lux
        })));
      }
      if (cameraResult.data) setCaptures(cameraResult.data as CameraCapture[]);
      setLastEvent('Supabase realtime link established.');
    }

    bootLive();

    const currentChannel = supabase
      .channel(`verde-current-${nodeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'node_current_state', filter: `node_id=eq.${nodeId}` }, (payload) => {
        setSensor(payload.new as SensorSnapshot);
        setLastEvent('Sensor snapshot updated from hardware.');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'control_state', filter: `node_id=eq.${nodeId}` }, (payload) => {
        setControls(payload.new as ControlState);
        setLastEvent('Control state synchronized.');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'camera_captures', filter: `node_id=eq.${nodeId}` }, (payload) => {
        setCaptures((prev) => [payload.new as CameraCapture, ...prev].slice(0, 8));
        setLastEvent('New ESP32-CAM capture received.');
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(currentChannel);
    };
  }, []);

  const health = useMemo(() => {
    if (controls.emergency_stop) return { label: 'LOCKDOWN', detail: 'Emergency stop is active.', danger: true };
    if (sensor.tank_level < 15) return { label: 'LOW WATER', detail: 'Refill bucket before auto irrigation.', danger: true };
    if (controls.weather_override) return { label: 'RAIN BLOCK', detail: 'Weather override blocking pump.', danger: false };
    if (sensor.moisture < controls.moisture_threshold) return { label: 'THIRST ALERT', detail: 'Soil below threshold. Auto pump eligible.', danger: false };
    return { label: 'OPTIMAL', detail: 'Plant environment is stable.', danger: false };
  }, [sensor, controls]);

  async function patchControls(patch: Partial<ControlState>) {
    const next = { ...controls, ...patch, updated_at: new Date().toISOString() };
    setControls(next);
    setBusy(true);
    setLastEvent(`Command queued: ${Object.keys(patch).join(', ')}`);

    if (supabase) {
      const { error } = await supabase.from('control_state').upsert({ node_id: nodeId, ...next });
      if (!error) {
        await supabase.from('command_events').insert({
          node_id: nodeId,
          command: Object.keys(patch).join(','),
          payload: patch,
          source: 'dashboard'
        });
      }
      if (error) setLastEvent(`Supabase write failed: ${error.message}`);
      else setLastEvent('Command written and audit event logged.');
    } else {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setLastEvent('Mock command accepted. Live hardware will activate after Supabase credentials are added.');
    }
    setBusy(false);
  }

  return (
    <main className="shell">
      <div className="grid-bg" />
      <header className="hero">
        <div>
          <p className="eyebrow">Project Verde V3.0</p>
          <h1>Supabase Command Center</h1>
          <p className="hero-copy">Competition-grade plant intelligence dashboard for sensor telemetry, pump control, camera capture, and AI diagnosis.</p>
        </div>
        <div className="hero-card">
          <div className="orb" />
          <p>NODE</p>
          <b>{nodeSlug}</b>
          <span><Wifi size={14} /> {systemMode}</span>
        </div>
      </header>

      <section className="status-strip">
        <div><Radio size={18} /> Last event: {lastEvent}</div>
        <div className={health.danger ? 'health danger-text' : 'health'}>{health.label} — {health.detail}</div>
      </section>

      <section className="metrics">
        <MetricCard label="Soil Moisture" value={`${Math.round(sensor.moisture)}%`} sub={`Threshold ${controls.moisture_threshold}%`} icon={<Sprout />} glow={sensor.moisture < controls.moisture_threshold} />
        <MetricCard label="Temperature" value={`${sensor.temperature.toFixed(1)}°C`} sub={`${sensor.humidity}% humidity`} icon={<Thermometer />} />
        <MetricCard label="Tank Level" value={`${Math.round(sensor.tank_level)}%`} sub="HC-SR04 bucket estimate" icon={<Droplets />} danger={sensor.tank_level < 15} />
        <MetricCard label="Light" value={`${sensor.light_lux} lx`} sub="LDR ambient reading" icon={<SunMedium />} />
      </section>

      <section className="main-grid">
        <SensorChart data={history} />
        <ControlPanel controls={controls} busy={busy} onPatch={patchControls} />
      </section>

      <section className="lower-grid">
        <CameraPanel captures={captures} />
        <div className="panel terminal">
          <div className="panel-head"><h3>AI Plant Terminal</h3><span className="status-chip warn">STAGED</span></div>
          <p><b>VERDE_AI:</b> Awaiting Plant.id + Gemini API keys. Current mock assessment: leaves normal, moisture trend slightly decreasing, irrigation logic armed.</p>
          <p><b>NEXT:</b> ESP32-CAM upload endpoint stores image in Supabase Storage bucket <code>plant-captures</code>, then Gemini converts diagnosis into treatment steps.</p>
        </div>
        <div className="panel hardware-contract">
          <div className="panel-head"><h3>Hardware Contract</h3><Gauge /></div>
          <ul>
            <li>GPIO23 powers resistive soil probe only during read window.</li>
            <li>GPIO34 reads soil analog value.</li>
            <li>GPIO25 controls pump relay channel 1.</li>
            <li>GPIO26 reserved for relay channel 2 / auxiliary output after Aarav confirms wiring.</li>
            <li>ESP32 reads <code>control_state</code> and posts to <code>sensor_readings</code>.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
