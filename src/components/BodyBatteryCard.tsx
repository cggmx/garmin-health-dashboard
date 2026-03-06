'use client';

import { BatteryMedium, TrendingUp, TrendingDown } from 'lucide-react';
import type { BodyBatteryData } from '@/lib/types';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface Props {
  bodyBattery: BodyBatteryData;
}

function batteryColor(value: number) {
  if (value >= 70) return '#4ade80';
  if (value >= 40) return '#facc15';
  return '#f87171';
}

export default function BodyBatteryCard({ bodyBattery }: Props) {
  const color = batteryColor(bodyBattery.current);

  return (
    <div className="card">
      <div className="card-header">
        <BatteryMedium size={14} className="text-battery" />
        <span>Body Battery</span>
        <span
          className="ml-auto text-2xl font-black leading-none"
          style={{ color }}
        >
          {bodyBattery.current}
        </span>
      </div>

      {/* Horizontal bar */}
      <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${bodyBattery.current}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>

      {/* Charged / Drained */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={13} className="text-recovery-green" />
          <span className="text-xs text-secondary">Cargado:</span>
          <span className="text-xs font-bold text-recovery-green">{bodyBattery.charged}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown size={13} className="text-recovery-red" />
          <span className="text-xs text-secondary">Drenado:</span>
          <span className="text-xs font-bold text-recovery-red">{bodyBattery.drained}</span>
        </div>
      </div>

      {/* Area chart */}
      {bodyBattery.data.length > 0 && (
        <ResponsiveContainer width="100%" height={72}>
          <AreaChart data={bodyBattery.data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-md bg-surface border border-border px-2 py-1 text-xs">
                    <span className="text-secondary mr-1">{payload[0].payload.time}</span>
                    <span style={{ color }}>{payload[0].value}</span>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#bbGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
