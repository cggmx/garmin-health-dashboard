'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Activity, Info } from 'lucide-react';
import type { DailyMetrics, TrendPoint } from '@/lib/types';
import { useProfile } from '@/lib/useProfile';
import { computeBenchmarks } from '@/lib/benchmarks';
import type { ProfileBenchmarks } from '@/lib/benchmarks';
import BenchmarkBadge from '@/components/ui/BenchmarkBadge';
import BottomNav from '@/components/BottomNav';
import { useLang } from '@/lib/i18n';

const HRV_COLOR = '#c084fc';

// Relative-to-baseline zone for a single data point
function zoneColor(hrv: number, median: number): string {
  if (median === 0) return HRV_COLOR;
  const ratio = hrv / median;
  if (ratio >= 1.1)  return '#4ade80';
  if (ratio >= 0.9)  return HRV_COLOR;
  if (ratio >= 0.75) return '#facc15';
  return '#f87171';
}

// Day label every N points for 30/90d charts
function buildDateLabels(points: TrendPoint[], step: number): (string | null)[] {
  return points.map((p, i) =>
    i % step === 0 ? format(new Date(p.date), 'd/M') : null
  );
}

export default function HRVPage() {
  const { t } = useLang();
  const [data, setData] = useState<DailyMetrics | null>(null);
  const [trends, setTrends] = useState<TrendPoint[] | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const { profile, loaded: profileLoaded } = useProfile();

  const STATUS_META: Record<string, { label: string; color: string; desc: string }> = {
    balanced:   { label: t('hrv.states.balanced'),    color: '#4ade80', desc: t('hrv.states.balancedDesc') },
    unbalanced: { label: t('hrv.states.unbalanced'),  color: '#facc15', desc: t('hrv.states.unbalancedDesc') },
    poor:       { label: t('hrv.states.low'),          color: '#f87171', desc: t('hrv.states.lowDesc') },
  };

  useEffect(() => {
    const localDate = format(new Date(), 'yyyy-MM-dd');
    fetch(`/api/health?date=${localDate}`).then(r => r.json()).then(setData);
    fetch(`/api/trends?range=30&date=${localDate}`)
      .then(r => r.json())
      .then((pts: TrendPoint[]) => setTrends(pts.length > 0 ? pts : null))
      .catch(() => setTrends(null))
      .finally(() => setTrendsLoading(false));
  }, []);

  const benchmarks: ProfileBenchmarks | null =
    profile && data && data.hrv.weeklyAverage > 0 && data.recovery.restingHR > 0
      ? computeBenchmarks(profile, {
          hrv: data.hrv.weeklyAverage,
          rhr: data.recovery.restingHR,
          sleepHours: data.sleep.totalSleepSeconds / 3600,
        })
      : null;

  if (!data || !profileLoaded) {
    return (
      <div className="min-h-screen bg-bg">
        <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <Activity size={16} style={{ color: HRV_COLOR }} />
            <h1 className="text-sm font-bold text-primary">{t('hrv.title')}</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
          {[72, 52, 200, 160].map((h, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-2xl" style={{ height: h }} />
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  const { hrv } = data;
  const statusMeta = STATUS_META[hrv.status] ?? STATUS_META.balanced;

  // 7d bar chart
  const hrv7 = hrv.trend.filter(v => v > 0);
  const max7 = Math.max(1, ...hrv.trend);
  const avg7 = hrv.weeklyAverage;
  const dates7 = Array.from({ length: 7 }, (_, i) =>
    format(new Date(Date.now() - (6 - i) * 86400000), 'EEE', { locale: es })
  );

  // 30d bar chart from trends
  const hrv30 = trends?.map(p => p.hrv) ?? [];
  const valid30 = hrv30.filter(v => v > 0);
  const median30 = valid30.length
    ? [...valid30].sort((a, b) => a - b)[Math.floor(valid30.length / 2)]
    : avg7;
  const max30 = Math.max(1, ...hrv30);
  const dateLabels30 = trends ? buildDateLabels(trends, Math.ceil(trends.length / 6)) : [];

  // Personal baseline relative zones
  const deviationPct = avg7 > 0
    ? Math.round(((hrv.lastNight - avg7) / avg7) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Activity size={16} style={{ color: HRV_COLOR }} />
          <h1 className="text-sm font-bold text-primary">{t('hrv.title')}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-end gap-3 mb-1">
            <span className="text-5xl font-black leading-none" style={{ color: HRV_COLOR }}>
              {hrv.lastNight}
            </span>
            <div className="mb-1">
              <p className="text-sm text-secondary">ms rMSSD anoche</p>
              <p className="text-xs mt-0.5" style={{ color: statusMeta.color }}>
                {statusMeta.label}
              </p>
            </div>
            <span
              className="ml-auto mb-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: statusMeta.color, backgroundColor: `${statusMeta.color}22` }}
            >
              {statusMeta.label}
            </span>
          </div>
          <p className="text-xs text-secondary mb-4">{statusMeta.desc}</p>

          {/* Baseline comparison row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface px-3 py-2.5 text-center">
              <p className="text-xs text-muted mb-0.5">Anoche</p>
              <p className="text-lg font-bold" style={{ color: HRV_COLOR }}>{hrv.lastNight}</p>
              <p className="text-[10px] text-muted">ms</p>
            </div>
            <div className="rounded-xl bg-surface px-3 py-2.5 text-center">
              <p className="text-xs text-muted mb-0.5">Media 7d</p>
              <p className="text-lg font-bold text-primary">{avg7}</p>
              <p className="text-[10px] text-muted">ms</p>
            </div>
            <div className="rounded-xl bg-surface px-3 py-2.5 text-center">
              <p className="text-xs text-muted mb-0.5">vs baseline</p>
              <p className="text-lg font-bold" style={{
                color: deviationPct >= 0 ? '#4ade80' : '#f87171',
              }}>
                {deviationPct >= 0 ? '+' : ''}{deviationPct}%
              </p>
              <p className="text-[10px] text-muted">hoy</p>
            </div>
          </div>
        </div>

        {/* ── 7-day bar chart ───────────────────────────────────────── */}
        <div className="card">
          <div className="card-header mb-4">
            <Activity size={14} style={{ color: HRV_COLOR }} />
            <span>{t('hrv.trend7d')}</span>
            <span className="ml-auto text-xs text-muted">{t('hrv.avg7dLabel', { avg: avg7 })}</span>
          </div>

          <div className="flex items-end justify-between gap-1.5 h-24 relative">
            {/* Reference line at 7d average */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-border"
              style={{ bottom: `${(avg7 / max7) * 100}%` }}
            />
            {hrv.trend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium" style={{ color: v > 0 ? zoneColor(v, avg7) : '#333' }}>
                  {v > 0 ? v : '—'}
                </span>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${v > 0 ? (v / max7) * 100 : 0}%`,
                    backgroundColor: v > 0 ? zoneColor(v, avg7) : '#1f1f1f',
                    minHeight: v > 0 ? 4 : 0,
                    boxShadow: v > 0 ? `0 0 6px ${zoneColor(v, avg7)}55` : 'none',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {dates7.map((d, i) => (
              <span key={i} className="flex-1 text-center text-xs text-muted capitalize">{d}</span>
            ))}
          </div>

          {/* Min/max */}
          <div className="flex justify-between mt-3 text-xs text-secondary border-t border-border pt-3">
            <span>{t('hrv.min7dLabel', { min: hrv7.length ? Math.min(...hrv7) : '—' })}</span>
            <span>{t('hrv.max7dLabel', { max: hrv7.length ? Math.max(...hrv7) : '—' })}</span>
            <span>{t('hrv.avg7dLabel', { avg: avg7 })}</span>
          </div>
        </div>

        {/* ── 30-day trend chart ────────────────────────────────────── */}
        <div className="card">
          <div className="card-header mb-4">
            <Activity size={14} style={{ color: HRV_COLOR }} />
            <span>{t('hrv.trend30d')}</span>
            {trendsLoading && <span className="ml-auto text-xs text-muted">{t('hrv.loading')}</span>}
            {!trendsLoading && trends && (
              <span className="ml-auto text-xs text-muted">{t('hrv.median30d', { median: median30 })}</span>
            )}
          </div>

          {!trendsLoading && !trends && (
            <div className="text-center py-6">
              <p className="text-xs text-secondary">{t('hrv.noHistory')}</p>
              <p className="text-[10px] text-muted mt-1">{t('hrv.noHistoryDesc')}</p>
            </div>
          )}

          {trendsLoading && (
            <div className="h-24 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-border border-t-hrv animate-spin" />
            </div>
          )}

          {!trendsLoading && trends && hrv30.length > 0 && (
            <>
              <div className="flex items-end gap-px h-20 relative">
                {/* Median reference line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-border/60"
                  style={{ bottom: `${(median30 / max30) * 100}%` }}
                />
                {hrv30.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${v > 0 ? Math.max(4, (v / max30) * 100) : 0}%`,
                      backgroundColor: v > 0 ? zoneColor(v, median30) : '#1f1f1f',
                      opacity: v > 0 ? 0.85 : 0.3,
                    }}
                  />
                ))}
              </div>
              {/* Date labels (every N bars) */}
              <div className="flex mt-1.5 relative h-4">
                {dateLabels30.map((label, i) => label ? (
                  <span
                    key={i}
                    className="absolute text-[9px] text-muted -translate-x-1/2"
                    style={{ left: `${(i / hrv30.length) * 100}%` }}
                  >
                    {label}
                  </span>
                ) : null)}
              </div>
              {/* Legend */}
              <div className="flex gap-3 mt-4 pt-3 border-t border-border">
                {[
                  { color: '#4ade80', label: '>+10%' },
                  { color: HRV_COLOR, label: 'Normal' },
                  { color: '#facc15', label: '−10%' },
                  { color: '#f87171', label: '<−25%' },
                ].map(z => (
                  <div key={z.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
                    <span className="text-[10px] text-muted">{z.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Demographic benchmark ─────────────────────────────────── */}
        {benchmarks && (
          <div className="card">
            <div className="card-header mb-3">
              <Activity size={14} style={{ color: HRV_COLOR }} />
              <span>{t('hrv.zones.demographicTitle')}</span>
            </div>
            <BenchmarkBadge benchmark={benchmarks.hrv} />
          </div>
        )}

        {/* ── Relative zones (personal baseline) ───────────────────── */}
        <div className="card">
          <div className="card-header mb-3">
            <Info size={14} className="text-secondary" />
            <span>{t('hrv.zones.zoneTitle')}</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: t('hrv.zones.excellent'),    range: t('hrv.zones.excellentThreshold'), color: '#4ade80', desc: t('hrv.zones.excellentDesc') },
              { label: t('hrv.zones.normal'),       range: t('hrv.zones.normalThreshold'),    color: HRV_COLOR, desc: t('hrv.zones.normalDesc') },
              { label: t('hrv.zones.slight'),       range: t('hrv.zones.slightThreshold'),    color: '#facc15', desc: t('hrv.zones.slightDesc') },
              { label: t('hrv.zones.significant'),  range: t('hrv.zones.significantThreshold'), color: '#f87171', desc: t('hrv.zones.significantDesc') },
            ].map(z => (
              <div key={z.label} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: z.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-primary">{z.label}</p>
                    <p className="text-[10px] text-muted whitespace-nowrap">{z.range}</p>
                  </div>
                  <p className="text-[11px] text-secondary mt-0.5">{z.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Educational section ───────────────────────────────────── */}
        <div className="card">
          <div className="card-header mb-3">
            <Info size={14} className="text-secondary" />
            <span>{t('hrv.info.title')}</span>
          </div>

          <div className="flex flex-col gap-4 text-xs text-secondary">

            <div>
              <p className="font-semibold text-primary mb-1">{t('hrv.info.whatTitle')}</p>
              <p>{t('hrv.info.whatDesc')}</p>
            </div>

            <div>
              <p className="font-semibold text-primary mb-1">{t('hrv.info.whyTitle')}</p>
              <p>{t('hrv.info.whyDesc')}</p>
            </div>

            <div>
              <p className="font-semibold text-primary mb-1">{t('hrv.info.howTitle')}</p>
              <p className="mb-1">{t('hrv.info.howDesc')}</p>
              <ul className="space-y-1 list-disc list-inside text-secondary">
                <li>{t('hrv.info.tip1')}</li>
                <li>{t('hrv.info.tip2')}</li>
                <li>{t('hrv.info.tip3')}</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-primary mb-1">{t('hrv.info.reducersTitle')}</p>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {(t('hrv.info.reducers') as unknown as string[]).map((f: string) => (
                  <div key={f} className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-recovery-red">↓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-primary mb-1">{t('hrv.info.improversTitle')}</p>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {(t('hrv.info.improvers') as unknown as string[]).map((f: string) => (
                  <div key={f} className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-recovery-green">↑</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <p className="text-[10px] text-muted mt-4 pt-3 border-t border-border">
            {t('hrv.info.ref')}
          </p>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}
