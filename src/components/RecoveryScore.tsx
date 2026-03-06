'use client';

import CircularGauge from './ui/CircularGauge';
import type { RecoveryData } from '@/lib/types';
import type { ProfileBenchmarks } from '@/lib/benchmarks';
import { getCategoryColor } from '@/lib/scoring';
import { formatPercentile } from '@/lib/benchmarks';

const LABELS: Record<string, string> = {
  green: 'Recuperado',
  yellow: 'Moderado',
  red: 'En Fatiga',
};

interface Props {
  recovery: RecoveryData;
  /** Age/sex-adjusted benchmarks; omit or null if no profile is set. */
  benchmarks?: ProfileBenchmarks | null;
}

export default function RecoveryScore({ recovery, benchmarks }: Props) {
  const color = getCategoryColor(recovery.score);
  const label = LABELS[recovery.category];

  return (
    <div className="flex flex-col items-center py-2">
      {/* Label above */}
      <p className="text-xs font-semibold tracking-widest text-secondary uppercase mb-3">
        Recuperación
      </p>

      {/* Gauge */}
      <div className="relative" style={{ width: 220, height: 220 }}>
        <CircularGauge score={recovery.score} size={220} strokeWidth={14} color={color}>
          {/* Center text */}
          <div className="flex flex-col items-center select-none pointer-events-none">
            <span
              className="font-black leading-none text-primary"
              style={{ fontSize: 56, color }}
            >
              {recovery.score}
            </span>
            <span
              className="text-xs font-semibold tracking-widest uppercase mt-1"
              style={{ color }}
            >
              {label}
            </span>
          </div>
        </CircularGauge>
      </div>

      {/* Sub-metrics row */}
      <div className="flex gap-6 mt-4">
        <MetricPill
          label="HRV"
          value={`${recovery.hrv} ms`}
          color="#c084fc"
          benchmark={benchmarks?.hrv}
        />
        <MetricPill
          label="FC Reposo"
          value={`${recovery.restingHR} bpm`}
          color="#38bdf8"
          benchmark={benchmarks?.rhr}
        />
        <MetricPill
          label="Sueño"
          value={`${recovery.sleepScore}%`}
          color="#818cf8"
        />
      </div>

      {/* Demographic footnote — only when benchmarks are available */}
      {benchmarks && (
        <p className="text-[9px] text-muted mt-3">
          Percentiles vs. {benchmarks.hrv.demographicLabel}
        </p>
      )}
    </div>
  );
}

interface MetricPillProps {
  label: string;
  value: string;
  color: string;
  benchmark?: { percentile: number; color: string; label: string };
}

function MetricPill({ label, value, color, benchmark }: MetricPillProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-semibold tracking-widest text-secondary uppercase">
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color }}>
        {value}
      </span>
      {/* Benchmark percentile badge — shown only when profile is configured */}
      {benchmark && (
        <span
          className="text-[9px] font-semibold px-1.5 py-px rounded-full mt-0.5"
          style={{
            color: benchmark.color,
            backgroundColor: `${benchmark.color}18`,
          }}
          title={benchmark.label}
        >
          {formatPercentile(benchmark.percentile)}
        </span>
      )}
    </div>
  );
}
