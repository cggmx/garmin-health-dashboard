'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Moon, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { DailyMetrics } from '@/lib/types';
import SleepCard from '@/components/SleepCard';
import BottomNav from '@/components/BottomNav';
import { calculateSleepEfficiency, calculateSleepDebt } from '@/lib/scoring';
import { useLang } from '@/lib/i18n';

export default function SleepPage() {
  const { t } = useLang();
  const [data, setData] = useState<DailyMetrics | null>(null);

  useEffect(() => {
    const localDate = format(new Date(), 'yyyy-MM-dd');
    fetch(`/api/health?date=${localDate}`).then(r => r.json()).then(setData);
  }, []);

  const TARGET_HOURS = 8;

  if (!data) {
    return (
      <div className="min-h-screen bg-bg">
        <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <Moon size={16} className="text-sleep" />
            <h1 className="text-sm font-bold text-primary">{t('sleep.title')}</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
          <div className="animate-pulse bg-surface rounded-2xl h-64" />
          <div className="animate-pulse bg-surface rounded-2xl h-32" />
          <div className="animate-pulse bg-surface rounded-2xl h-48" />
        </main>
        <BottomNav />
      </div>
    );
  }

  const efficiency = calculateSleepEfficiency(data.sleep);
  const sleepHours = data.weeklyTrend.sleepHours;
  const debt = calculateSleepDebt(sleepHours, TARGET_HOURS);
  const avgHours = sleepHours.filter(h => h > 0).length
    ? sleepHours.filter(h => h > 0).reduce((s, h) => s + h, 0) / sleepHours.filter(h => h > 0).length
    : 0;

  const barColor = (h: number) => {
    if (h >= 7) return '#4ade80';
    if (h >= 6) return '#facc15';
    return '#f87171';
  };

  const maxBarHours = Math.max(TARGET_HOURS + 1, ...sleepHours);
  const maxDebtAbs = Math.max(...sleepHours.map(h => Math.abs(TARGET_HOURS - h)), 0.5);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Moon size={16} className="text-sleep" />
          <h1 className="text-sm font-bold text-primary">{t('sleep.title')}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
        {/* ── Sleep detail card ────────────────────────────────── */}
        <SleepCard sleep={data.sleep} />

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Efficiency */}
          <div className="card text-center">
            <p className="text-xs text-secondary mb-1">{t('sleep.efficiency')}</p>
            <p className={`text-2xl font-bold ${efficiency >= 85 ? 'text-green-400' : efficiency >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
              {efficiency}%
            </p>
            <p className="text-xs text-muted mt-0.5">{t('sleep.inBed')}</p>
          </div>

          {/* 7-day average */}
          <div className="card text-center">
            <p className="text-xs text-secondary mb-1">{t('common.avg7d')}</p>
            <p className="text-2xl font-bold text-sleep">
              {avgHours.toFixed(1)}<span className="text-sm font-normal text-secondary ml-0.5">h</span>
            </p>
            <p className="text-xs text-muted mt-0.5">{t('sleep.perNight')}</p>
          </div>

          {/* Sleep debt */}
          <div className="card text-center">
            <p className="text-xs text-secondary mb-1">{t('sleep.debt')}</p>
            <div className="flex items-center justify-center gap-1">
              {debt > 0.5
                ? <TrendingDown size={14} className="text-red-400" />
                : debt < -0.5
                  ? <TrendingUp size={14} className="text-green-400" />
                  : <Minus size={14} className="text-yellow-400" />}
              <p className={`text-2xl font-bold ${debt > 0.5 ? 'text-red-400' : debt < -0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                {Math.abs(debt).toFixed(1)}<span className="text-sm font-normal text-secondary ml-0.5">h</span>
              </p>
            </div>
            <p className="text-xs text-muted mt-0.5">{debt > 0 ? t('sleep.deficit') : debt < 0 ? t('sleep.surplus') : t('sleep.balanced')}</p>
          </div>
        </div>

        {/* ── 7-day hours trend ─────────────────────────────────── */}
        <div className="card">
          <div className="card-header mb-4">
            <Moon size={14} className="text-sleep" />
            <span>{t('sleep.chartTitle')}</span>
            <span className="ml-auto text-xs text-muted">{t('sleep.goalLine', { target: TARGET_HOURS })}</span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-1.5 h-28 relative">
            {/* 8h reference line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-border"
              style={{ bottom: `${(TARGET_HOURS / maxBarHours) * 100}%` }}
            />
            {sleepHours.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium" style={{ color: barColor(h) }}>
                  {h > 0 ? `${h.toFixed(1)}` : '—'}
                </span>
                <div className="w-full rounded-t-sm" style={{
                  height: `${(h / maxBarHours) * 100}%`,
                  backgroundColor: h > 0 ? barColor(h) : '#1f1f1f',
                  minHeight: h > 0 ? 4 : 0,
                }} />
              </div>
            ))}
          </div>

          {/* Day labels */}
          <div className="flex justify-between mt-2">
            {data.weeklyTrend.dates.map((d, i) => (
              <span key={i} className="flex-1 text-center text-xs text-muted">{d}</span>
            ))}
          </div>
        </div>

        {/* ── Sleep debt per day ────────────────────────────────── */}
        <div className="card">
          <div className="card-header mb-4">
            <TrendingDown size={14} className="text-secondary" />
            <span>{t('sleep.deficitPerNight')}</span>
            <span className="ml-auto text-xs text-muted">{t('sleep.vsGoal', { target: TARGET_HOURS })}</span>
          </div>

          <div className="flex items-center justify-between gap-1.5 h-24 relative">
            {/* Zero line */}
            <div className="absolute left-0 right-0 border-t border-border" style={{ top: '50%' }} />

            {sleepHours.map((h, i) => {
              const delta = h > 0 ? h - TARGET_HOURS : 0;
              const pct = (Math.abs(delta) / maxDebtAbs) * 45; // max 45% of half-height
              const isDeficit = delta < 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-center h-full">
                  {/* Surplus bar (above center) */}
                  <div className="flex-1 flex items-end justify-center">
                    {!isDeficit && delta !== 0 && (
                      <div className="w-full rounded-t-sm bg-green-400/70" style={{ height: `${pct}%` }} />
                    )}
                  </div>
                  {/* Deficit bar (below center) */}
                  <div className="flex-1 flex items-start justify-center">
                    {isDeficit && (
                      <div className="w-full rounded-b-sm" style={{
                        height: `${pct}%`,
                        backgroundColor: pct > 30 ? '#f87171' : '#facc15',
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels + delta values */}
          <div className="flex justify-between mt-2">
            {sleepHours.map((h, i) => {
              const delta = h > 0 ? h - TARGET_HOURS : null;
              return (
                <div key={i} className="flex-1 text-center">
                  <span className="block text-xs text-muted">{data.weeklyTrend.dates[i]}</span>
                  {delta !== null && (
                    <span className={`text-xs font-medium ${delta >= 0 ? 'text-green-400' : Math.abs(delta) > 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
