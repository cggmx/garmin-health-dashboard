'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Flame, Scale, Activity, ShieldAlert } from 'lucide-react';
import type { DailyMetrics, TrendPoint } from '@/lib/types';
import StrainCard from '@/components/StrainCard';
import BottomNav from '@/components/BottomNav';
import { getStrainColor, getCategoryColor, formatDuration } from '@/lib/scoring';
import { useLang } from '@/lib/i18n';

const ACTIVITY_ICONS: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  walking: '🚶',
  strength_training: '🏋️',
  yoga: '🧘',
  other: '⚡',
};

// Activity labels will be set via t() inside the component

// ── ACWR helpers ──────────────────────────────────────────────────────────────
interface ACWRResult {
  acute: number;    // 7-day rolling average strain
  chronic: number;  // 28-day rolling average strain
  ratio: number;
  zone: 'undertrain' | 'optimal' | 'moderate' | 'high' | 'danger';
  label: string;
  color: string;
  desc: string;
  hasData: boolean;
}

function computeACWR(points: TrendPoint[]): ACWRResult {
  const valid = points.filter(p => p.strain > 0);
  const hasData = valid.length >= 14; // need reasonable history

  const last28 = points.slice(-28);
  const last7  = points.slice(-7);

  const chronic = last28.length
    ? last28.reduce((s, p) => s + p.strain, 0) / last28.length
    : 0;
  const acute = last7.length
    ? last7.reduce((s, p) => s + p.strain, 0) / last7.length
    : 0;

  const ratio = chronic > 0 ? Math.round((acute / chronic) * 100) / 100 : 0;

  let zone: ACWRResult['zone'];
  let label: string;
  let color: string;
  let desc: string;

  if (ratio === 0) {
    zone = 'optimal'; label = ''; color = '#4a5568'; desc = '';
  } else if (ratio < 0.8) {
    zone = 'undertrain'; label = ''; color = '#38bdf8'; desc = '';
  } else if (ratio <= 1.0) {
    zone = 'optimal'; label = ''; color = '#4ade80'; desc = '';
  } else if (ratio <= 1.3) {
    zone = 'moderate'; label = ''; color = '#facc15'; desc = '';
  } else if (ratio <= 1.5) {
    zone = 'high'; label = ''; color = '#fb923c'; desc = '';
  } else {
    zone = 'danger'; label = ''; color = '#f87171'; desc = '';
  }

  return { acute: Math.round(acute * 10) / 10, chronic: Math.round(chronic * 10) / 10, ratio, zone, label, color, desc, hasData };
}

export default function StrainPage() {
  const { t } = useLang();
  const [data, setData] = useState<DailyMetrics | null>(null);
  const [trends, setTrends] = useState<TrendPoint[] | null>(null);

  const ACTIVITY_LABELS: Record<string, string> = {
    running: t('strain.activityTypes.running'),
    cycling: t('strain.activityTypes.cycling'),
    swimming: t('strain.activityTypes.swimming'),
    walking: t('strain.activityTypes.walking'),
    strength_training: t('strain.activityTypes.strength'),
    yoga: t('strain.activityTypes.yoga'),
    other: t('strain.activityTypes.other'),
  };

  const ACWR_LABELS: Record<string, { label: string; desc: string }> = {
    undertrain: { label: t('strain.acwr.zones.detraining'), desc: t('strain.acwr.zones.detrainingDesc') },
    optimal:    { label: t('strain.acwr.zones.optimal'),    desc: t('strain.acwr.zones.optimalDesc') },
    moderate:   { label: t('strain.acwr.zones.moderate'),   desc: t('strain.acwr.zones.moderateDesc') },
    high:       { label: t('strain.acwr.zones.high'),       desc: t('strain.acwr.zones.highDesc') },
    danger:     { label: t('strain.acwr.zones.danger'),     desc: t('strain.acwr.zones.dangerDesc') },
  };

  useEffect(() => {
    const localDate = format(new Date(), 'yyyy-MM-dd');
    fetch(`/api/health?date=${localDate}`).then(r => r.json()).then(setData);
    fetch(`/api/trends?range=30&date=${localDate}`)
      .then(r => r.json())
      .then((pts: TrendPoint[]) => setTrends(pts.length > 0 ? pts : null))
      .catch(() => setTrends(null));
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-bg">
        <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <Flame size={16} className="text-strain" />
            <h1 className="text-sm font-bold text-primary">{t('strain.detailTitle')}</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
          <div className="animate-pulse bg-surface rounded-2xl h-32" />
          <div className="animate-pulse bg-surface rounded-2xl h-64" />
          <div className="animate-pulse bg-surface rounded-2xl h-48" />
          <div className="animate-pulse bg-surface rounded-2xl h-40" />
        </main>
        <BottomNav />
      </div>
    );
  }

  const todayStrain = data.strain;
  const acwr = trends ? computeACWR(trends) : null;
  const strainSeries = data.weeklyTrend.strain;
  const recoverySeries = data.weeklyTrend.recovery;
  const dates = data.weeklyTrend.dates;

  // 7-day stats
  const validStrain = strainSeries.filter(s => s > 0);
  const avgStrain = validStrain.length
    ? validStrain.reduce((a, b) => a + b, 0) / validStrain.length
    : 0;

  // Balance: normalize strain to 0-100, compare with recovery
  const strainNorm = Math.round((todayStrain / 21) * 100);
  const todayRecovery = data.recovery.score;
  const balance = todayRecovery - strainNorm;
  const balanceLabel =
    balance >= 20 ? t('common.low') : balance >= 0 ? t('common.balance') : t('common.high');
  const balanceColor =
    balance >= 20 ? '#4ade80' : balance >= 0 ? '#facc15' : '#f87171';

  // 7-day bar chart scale
  const maxStrain = Math.max(14, ...strainSeries);

  // Activity type aggregation (today)
  const actByType = data.activities.reduce<
    Record<string, { type: string; strain: number; duration: number; calories: number; count: number }>
  >((acc, act) => {
    const key = act.type;
    if (!acc[key]) acc[key] = { type: key, strain: 0, duration: 0, calories: 0, count: 0 };
    acc[key].strain += act.strain;
    acc[key].duration += act.duration;
    acc[key].calories += act.calories;
    acc[key].count += 1;
    return acc;
  }, {});
  const byType = Object.values(actByType).sort((a, b) => b.strain - a.strain);
  const totalTodayStrain = byType.reduce((s, t) => s + t.strain, 0);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Flame size={16} className="text-strain" />
          <h1 className="text-sm font-bold text-primary">{t('strain.detailTitle')}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Hoy */}
          <div className="card text-center">
            <p className="text-xs text-secondary mb-1">{t('common.today')}</p>
            <p className="text-2xl font-bold leading-none" style={{ color: getStrainColor(todayStrain) }}>
              {todayStrain.toFixed(1)}
            </p>
            <p className="text-xs text-muted mt-1">/ 21</p>
          </div>

          {/* Promedio 7d */}
          <div className="card text-center">
            <p className="text-xs text-secondary mb-1">{t('common.avg7d')}</p>
            <p className="text-2xl font-bold leading-none" style={{ color: getStrainColor(avgStrain) }}>
              {avgStrain.toFixed(1)}
            </p>
            <p className="text-xs text-muted mt-1">/ 21</p>
          </div>

          {/* Balance */}
          <div className="card text-center">
            <p className="text-xs text-secondary mb-1">{t('strain.balance.title')}</p>
            <p className="text-sm font-bold leading-none mt-1" style={{ color: balanceColor }}>
              {balanceLabel}
            </p>
            <p className="text-xs text-muted mt-1">{t('strain.balance.cargaVsRec')}</p>
          </div>
        </div>

        {/* ── Today's strain detail ──────────────────────────────── */}
        <StrainCard activities={data.activities} todayStrain={todayStrain} steps={data.steps} floorsAscended={data.floorsAscended} highlyActiveSeconds={data.highlyActiveSeconds} bodyBatteryDrained={data.bodyBattery.drained} />

        {/* ── 7-day strain bar chart ─────────────────────────────── */}
        <div className="card">
          <div className="card-header mb-4">
            <Flame size={14} className="text-strain" />
            <span>{t('strain.balance.chartTitle')}</span>
            <span className="ml-auto text-xs text-muted">{t('strain.balance.avgLabel', { avg: avgStrain.toFixed(1) })}</span>
          </div>

          <div className="flex items-end justify-between gap-1.5 h-28 relative">
            {/* High-zone reference line at 14 */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-border"
              style={{ bottom: `${(14 / maxStrain) * 100}%` }}
            />
            {strainSeries.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium" style={{ color: s > 0 ? getStrainColor(s) : '#333' }}>
                  {s > 0 ? s.toFixed(1) : '—'}
                </span>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${s > 0 ? (s / maxStrain) * 100 : 0}%`,
                    backgroundColor: s > 0 ? getStrainColor(s) : '#1f1f1f',
                    minHeight: s > 0 ? 4 : 0,
                    boxShadow: s > 0 ? `0 0 6px ${getStrainColor(s)}55` : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2">
            {dates.map((d, i) => (
              <span key={i} className="flex-1 text-center text-xs text-muted">{d}</span>
            ))}
          </div>

          {/* Zone legend */}
          <div className="flex gap-3 mt-3 pt-3 border-t border-border">
            {[
              { label: t('trends.recovery'), color: '#38bdf8', range: '≤8' },
              { label: t('common.moderate'), color: '#fb923c', range: '≤14' },
              { label: t('common.high'), color: '#f87171', range: '>14' },
            ].map(z => (
              <div key={z.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
                <span className="text-xs text-muted">{z.label}</span>
                <span className="text-xs text-muted/60">{z.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Balance carga / recuperación (7d) ─────────────────── */}
        <div className="card">
          <div className="card-header mb-4">
            <Scale size={14} className="text-secondary" />
            <span>{t('strain.balance.title')}</span>
            <span className="ml-auto text-xs text-muted">{t('strain.balance.period')}</span>
          </div>

          {/* Dual-bar chart: strain (norm 0-100) vs recovery (0-100) */}
          <div className="flex items-end justify-between gap-1 h-32 relative">
            {strainSeries.map((s, i) => {
              const sNorm = Math.round((s / 21) * 100);
              const rec = recoverySeries[i] ?? 0;
              const hasData = s > 0 || rec > 0;
              return (
                <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
                  {/* Strain bar */}
                  <div className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${hasData ? sNorm : 0}%`,
                        backgroundColor: hasData ? '#fb923c' : '#1f1f1f',
                        minHeight: hasData && sNorm > 0 ? 3 : 0,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  {/* Recovery bar */}
                  <div className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${hasData ? rec : 0}%`,
                        backgroundColor: hasData ? getCategoryColor(rec) : '#1f1f1f',
                        minHeight: hasData && rec > 0 ? 3 : 0,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-2">
            {dates.map((d, i) => (
              <span key={i} className="flex-1 text-center text-xs text-muted">{d}</span>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#fb923c]" />
              <span className="text-xs text-muted">{t('strain.balance.strainLabel')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#4ade80]" />
              <span className="text-xs text-muted">{t('strain.balance.recoveryLabel')}</span>
            </div>
          </div>

          {/* Interpretation line */}
          <p className="text-xs text-secondary mt-2">
            {balance >= 20
              ? t('strain.balance.goodBalance')
              : balance >= 0
              ? t('strain.balance.evenBalance')
              : t('strain.balance.badBalance')}
          </p>
        </div>

        {/* ── Actividades por tipo (hoy) ─────────────────────────── */}
        {byType.length > 0 && (
          <div className="card">
            <div className="card-header mb-4">
              <Activity size={14} className="text-secondary" />
              <span>{t('strain.activitiesTitle')}</span>
            </div>

            <div className="flex flex-col gap-3">
              {byType.map((t) => {
                const pct = totalTodayStrain > 0
                  ? Math.round((t.strain / totalTodayStrain) * 100)
                  : 0;
                const icon = ACTIVITY_ICONS[t.type] ?? ACTIVITY_ICONS.other;
                const label = ACTIVITY_LABELS[t.type] ?? t.type;
                const color = getStrainColor(t.strain);

                return (
                  <div key={t.type}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{icon}</span>
                      <span className="text-sm text-primary font-medium flex-1">{label}</span>
                      {t.count > 1 && (
                        <span className="text-xs text-muted">×{t.count}</span>
                      )}
                      <span className="text-xs text-secondary">{formatDuration(t.duration)}</span>
                      {t.calories > 0 && (
                        <span className="text-xs text-muted">· {t.calories} kcal</span>
                      )}
                      <span className="text-sm font-bold ml-1" style={{ color }}>
                        {t.strain.toFixed(1)}
                      </span>
                    </div>
                    {/* Contribution bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                          boxShadow: `0 0 4px ${color}55`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted mt-0.5 text-right">{pct}{t('strain.strainPct')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACWR: Ratio carga aguda / crónica ─────────────────────── */}
        {acwr && (
          <div className="card">
            <div className="card-header mb-4">
              <ShieldAlert size={14} className="text-secondary" />
              <span>{t('strain.acwr.title')}</span>
            </div>

            {/* Main ratio display */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                style={{ backgroundColor: `${acwr.color}15`, borderColor: `${acwr.color}40` }}
              >
                <span className="text-2xl font-black" style={{ color: acwr.color }}>
                  {acwr.ratio > 0 ? acwr.ratio.toFixed(2) : '—'}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{ACWR_LABELS[acwr.zone]?.label ?? ''}</p>
                <p className="text-xs text-secondary mt-0.5 leading-snug">{ACWR_LABELS[acwr.zone]?.desc ?? ''}</p>
              </div>
            </div>

            {/* Acute / Chronic breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-surface px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">{t('strain.acwr.acute')}</p>
                <p className="text-lg font-bold text-primary">{acwr.acute}</p>
                <p className="text-[10px] text-muted">{t('strain.acwr.acuteDesc')}</p>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">{t('strain.acwr.chronic')}</p>
                <p className="text-lg font-bold text-primary">{acwr.chronic}</p>
                <p className="text-[10px] text-muted">{t('strain.acwr.acuteDesc')}</p>
              </div>
            </div>

            {/* Zone scale bar */}
            <div className="mb-3">
              <div className="relative h-2.5 rounded-full overflow-hidden" style={{
                background: 'linear-gradient(to right, #38bdf8 0%, #4ade80 20%, #facc15 50%, #fb923c 70%, #f87171 100%)',
              }}>
                {acwr.ratio > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg shadow"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((acwr.ratio - 0.5) / 1.5) * 100))}%`,
                      transform: 'translateX(-50%) translateY(-50%)',
                      backgroundColor: acwr.color,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[9px] text-muted mt-1 px-0.5">
                <span className="text-[#38bdf8]">0.5</span>
                <span className="text-[#4ade80]">0.8</span>
                <span>1.0</span>
                <span className="text-[#facc15]">1.3</span>
                <span className="text-[#fb923c]">1.5</span>
                <span className="text-[#f87171]">2.0</span>
              </div>
              <div className="flex justify-between text-[9px] text-muted mt-0.5 px-0.5">
                <span className="text-[#38bdf8]">{t('common.low')}</span>
                <span className="text-[#4ade80]">{t('common.optimal')}</span>
                <span className="text-[#facc15]">{t('common.moderate')}</span>
                <span className="text-[#fb923c]">{t('common.high')}</span>
                <span className="text-[#f87171]">{t('common.danger')}</span>
              </div>
            </div>

            <p className="text-[10px] text-muted border-t border-border pt-3">
              {t('strain.acwr.ref')}
            </p>
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
