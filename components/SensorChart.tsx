'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ReadingPoint } from '@/lib/types';

export function SensorChart({ data }: { data: ReadingPoint[] }) {
  return (
    <section className="panel chart-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Realtime trendline</p>
          <h3>Moisture Telemetry</h3>
        </div>
        <span className="status-chip">LIVE FEED</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 14, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(34,197,94,0.12)" vertical={false} />
            <XAxis dataKey="time" stroke="rgba(226,255,236,0.45)" tick={{ fontSize: 11 }} />
            <YAxis stroke="rgba(226,255,236,0.45)" tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: '#06110b', border: '1px solid rgba(34,197,94,.35)', borderRadius: 14 }}
              labelStyle={{ color: '#bbf7d0' }}
            />
            <Area type="monotone" dataKey="moisture" stroke="#22c55e" strokeWidth={3} fill="url(#moistureGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
