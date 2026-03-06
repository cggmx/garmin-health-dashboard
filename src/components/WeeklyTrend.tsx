'use client';

import { TrendingUp } from 'lucide-react';
import type { WeeklyTrend as WeeklyTrendType } from '@/lib/types';
import { getCategoryColor } from '@/lib/scoring';
import TrendSparkline from './ui/TrendSparkline';

interface Props {
  trend: WeeklyTrendType;
}

export default function WeeklyTrend({ trend }: Props) {
  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

  const rows = [
    {
      label: 'Recuperación',
      data: trend.recovery,
      color: getCategoryColor(avg(trend.recovery)),
      unit: '%',
    },
    {
      label: 'HRV',
      data: trend.hrv,
      color: '#c084fc',
      unit: 'ms',
    },
    {
      label: 'Sueño',
      data: trend.sleep,
      color: '#818cf8',
      unit: '%',
    },
    {
      label: 'FC Reposo',
      data: trend.rhr,
      color: '#38bdf8',
      unit: 'bpm',
    },
  ];

  return (
    <div className="card">
      <div className="card-header mb-4">
        <TrendingUp size={14} className="text-secondary" />
        <span>Tendencias — 7 días</span>
      </div>

      <div className="flex flex-col gap-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-secondary uppercase tracking-widest">{row.label}</span>
              <div className="flex gap-2 items-center">
                {trend.dates.map((d, i) => (
                  <span key={i} className="text-[9px] text-muted hidden sm:block">{d}</span>
                ))}
                <span className="text-xs font-bold ml-1" style={{ color: row.color }}>
                  ∅ {avg(row.data)}{row.unit}
                </span>
              </div>
            </div>
            <TrendSparkline
              data={row.data}
              labels={trend.dates}
              color={row.color}
              height={44}
              referenceValue={avg(row.data)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
