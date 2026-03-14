'use client';

import Link from 'next/link';
import { Activity, ChevronRight } from 'lucide-react';
import type { HRVData } from '@/lib/types';
import type { MetricBenchmark } from '@/lib/benchmarks';
import TrendSparkline from './ui/TrendSparkline';
import BenchmarkBadge from './ui/BenchmarkBadge';
import { useLang } from '@/lib/i18n';

interface Props {
  hrv: HRVData;
  /** Age/sex-adjusted benchmark; omit if no profile is set. */
  benchmark?: MetricBenchmark;
}

export default function HRVCard({ hrv, benchmark }: Props) {
  const { t } = useLang();

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    balanced: { label: t('hrv.states.balanced'), color: '#4ade80' },
    unbalanced: { label: t('hrv.states.unbalanced'), color: '#facc15' },
    poor: { label: t('hrv.states.low'), color: '#f87171' },
  };

  const statusInfo = STATUS_LABELS[hrv.status] ?? STATUS_LABELS.balanced;
  const trend7 = hrv.trend.length > 0 ? hrv.trend : [0];
  const positives = trend7.filter(v => v > 0);
  const min7 = positives.length > 0 ? Math.min(...positives) : 0;
  const max7 = Math.max(...trend7);
  const avg7 = hrv.weeklyAverage;

  return (
    <div className="card">
      <div className="card-header">
        <Activity size={14} className="text-hrv" />
        <span>{t('hrv.title')}</span>
      </div>

      {/* Main value */}
      <div className="flex items-end gap-3 mb-1">
        <span className="text-4xl font-black text-primary leading-none" style={{ color: '#c084fc' }}>
          {hrv.lastNight}
        </span>
        <span className="text-sm text-secondary mb-1">{t('hrv.msLastNight')}</span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
          style={{ backgroundColor: `${statusInfo.color}22`, color: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Baseline context */}
      <p className="text-xs text-secondary mb-3">
        {t('hrv.avg7d')}{' '}
        <span className="text-primary font-semibold">{avg7} ms</span>
        {hrv.lastNight > avg7 ? (
          <span className="text-recovery-green ml-1">{t('hrv.aboveBaseline')}</span>
        ) : hrv.lastNight < avg7 ? (
          <span className="text-recovery-red ml-1">{t('hrv.belowBaseline')}</span>
        ) : (
          <span className="text-secondary ml-1">{t('hrv.atBaseline')}</span>
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
        <span>{t('hrv.min7d')} <span className="text-primary">{min7} ms</span></span>
        <span>{t('hrv.max7d')} <span className="text-primary">{max7} ms</span></span>
      </div>

      {/* Demographic benchmark — only shown when profile is set */}
      {benchmark && <BenchmarkBadge benchmark={benchmark} />}

      {/* Detail link */}
      <Link
        href="/hrv"
        className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors mt-3 pt-3 border-t border-border"
      >
        <Activity size={11} />
        {t('hrv.detailLink')}
        <ChevronRight size={11} className="ml-auto" />
      </Link>
    </div>
  );
}
