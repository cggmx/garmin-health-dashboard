'use client';

import { Activity } from 'lucide-react';
import type { HRVData } from '@/lib/types';
import TrendSparkline from './ui/TrendSparkline';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  balanced: { label: 'Equilibrado', color: '#4ade80' },
  unbalanced: { label: 'Desequilibrado', color: '#facc15' },
  poor: { label: 'Bajo', color: '#f87171' },
};

interface Props {
  hrv: HRVData;
}

export default function HRVCard({ hrv }: Props) {
  const statusInfo = STATUS_LABELS[hrv.status] ?? STATUS_LABELS.balanced;
  const trend7 = hrv.trend.length > 0 ? hrv.trend : [0];
  const min7 = Math.min(...trend7.filter(v => v > 0));
  const max7 = Math.max(...trend7);
  const avg7 = hrv.weeklyAverage;

  return (
    <div className="card">
      <div className="card-header">
        <Activity size={14} className="text-hrv" />
        <span>Variabilidad Cardíaca</span>
      </div>

      {/* Main value */}
      <div className="flex items-end gap-3 mb-1">
        <span className="text-4xl font-black text-primary leading-none" style={{ color: '#c084fc' }}>
          {hrv.lastNight}
        </span>
        <span className="text-sm text-secondary mb-1">ms anoche</span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
          style={{ backgroundColor: `${statusInfo.color}22`, color: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Baseline context */}
      <p className="text-xs text-secondary mb-3">
        Media 7 días:{' '}
        <span className="text-primary font-semibold">{avg7} ms</span>
        {hrv.lastNight > avg7 ? (
          <span className="text-recovery-green ml-1">↑ Por encima de tu línea base</span>
        ) : hrv.lastNight < avg7 ? (
          <span className="text-recovery-red ml-1">↓ Por debajo de tu línea base</span>
        ) : (
          <span className="text-secondary ml-1">= En tu línea base</span>
        )}
      </p>

      {/* 7-day sparkline */}
      <TrendSparkline
        data={trend7}
        color="#c084fc"
        height={52}
        referenceValue={avg7}
      />

      {/* Min / Max */}
      <div className="flex justify-between mt-2 text-xs text-secondary">
        <span>Mín 7d: <span className="text-primary">{min7} ms</span></span>
        <span>Máx 7d: <span className="text-primary">{max7} ms</span></span>
      </div>
    </div>
  );
}
