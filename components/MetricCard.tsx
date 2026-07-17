import { ReactNode } from 'react';

type MetricCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: ReactNode;
  danger?: boolean;
  glow?: boolean;
};

export function MetricCard({ label, value, sub, icon, danger, glow }: MetricCardProps) {
  return (
    <div className={`metric-card ${danger ? 'danger' : ''} ${glow ? 'glow' : ''}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <p className="metric-label">{label}</p>
        <h2>{value}</h2>
        <p className="metric-sub">{sub}</p>
      </div>
    </div>
  );
}
