'use client';

import { Brain } from 'lucide-react';
import type { StressData } from '@/lib/types';
import { ResponsiveContainer, AreaChart, Area, Tooltip, ReferenceLine, XAxis } from 'recharts';

interface Props {
  stress: StressData;
}

function stressColor(avg: number) {
  if (avg <= 25) return '#4ade80';
  if (avg <= 50) return '#facc15';
  return '#f87171';
}

function stressLabel(avg: number) {
  if (avg <= 25) return 'Bajo';
  if (avg <= 50) return 'Moderado';
  return 'Alto';
}

export default function StressCard({ stress }: Props) {
  const color = stressColor(stress.average);

  return (
    <div className="card">
      <div className="card-header">
        <Brain size={14} className="text-stress" />
        <span>Estrés</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
            {stressLabel(stress.average)}
          </span>
          <span className="text-2xl font-black leading-none" style={{ color }}>
            {stress.average}
          </span>
        </div>
      </div>

      {/* Timeline chart */}
      {stress.data.length > 0 && (
        <div className="mb-4">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={stress.data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: '#737373' }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <ReferenceLine y={25} stroke="#4ade80" strokeDasharray="3 3" strokeOpacity={0.3} />
              <ReferenceLine y={50} stroke="#facc15" strokeDasharray="3 3" strokeOpacity={0.3} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-md bg-surface border border-border px-2 py-1 text-xs">
                      <span className="text-secondary mr-1">{payload[0].payload.time}</span>
                      <span style={{ color: stressColor(Number(payload[0].value)) }}>
                        {payload[0].value}
                      </span>
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#stressGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox
          label="En reposo"
          value={`${stress.restingPercentage}%`}
          color="#4ade80"
        />
        <StatBox
          label="Estrés alto"
          value={`${stress.highStressPercentage}%`}
          color="#f87171"
        />
        <StatBox
          label="Nivel medio"
          value={String(stress.average)}
          color={color}
        />
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center bg-bg rounded-lg p-2">
      <span className="text-[10px] text-secondary uppercase tracking-widest text-center leading-tight">
        {label}
      </span>
      <span className="text-lg font-black mt-1" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
