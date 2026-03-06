'use client';

import { ResponsiveContainer, AreaChart, Area, Tooltip, ReferenceLine } from 'recharts';

interface TrendSparklineProps {
  data: number[];
  labels?: string[];
  color: string;
  height?: number;
  showDots?: boolean;
  referenceValue?: number;
}

export default function TrendSparkline({
  data,
  labels = [],
  color,
  height = 56,
  referenceValue,
}: TrendSparklineProps) {
  const chartData = data.map((v, i) => ({ v, label: labels[i] ?? '' }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {referenceValue !== undefined && (
          <ReferenceLine
            y={referenceValue}
            stroke={color}
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
        )}
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="rounded-md bg-surface border border-border px-2 py-1 text-xs text-primary">
                {payload[0].payload.label && (
                  <span className="text-secondary mr-1">{payload[0].payload.label}</span>
                )}
                <span style={{ color }}>{payload[0].value}</span>
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
