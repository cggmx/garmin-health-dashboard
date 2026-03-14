'use client';

import { Moon, Zap } from 'lucide-react';
import type { SleepData } from '@/lib/types';
import type { MetricBenchmark } from '@/lib/benchmarks';
import { formatDuration } from '@/lib/scoring';
import BenchmarkBadge from './ui/BenchmarkBadge';
import { useLang } from '@/lib/i18n';

interface Props {
  sleep: SleepData;
  /** Age-adjusted sleep duration benchmark; omit if no profile is set. */
  benchmark?: MetricBenchmark;
  /** True when showing demo/mock data — score is estimated, not from Garmin. */
  isDemo?: boolean;
}

export default function SleepCard({ sleep, benchmark, isDemo }: Props) {
  const { t, locale } = useLang();
  const totalHours = sleep.totalSleepSeconds / 3600;

  const STAGES = [
    { key: 'deepSleepSeconds' as const, label: t('sleep.deep'), color: '#818cf8', target: 0.2 },
    { key: 'remSleepSeconds' as const, label: t('sleep.rem'), color: '#c084fc', target: 0.25 },
    { key: 'lightSleepSeconds' as const, label: t('sleep.light'), color: '#38bdf8', target: 0.5 },
    { key: 'awakeSleepSeconds' as const, label: t('sleep.awake'), color: '#404040', target: 0.05 },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <Moon size={14} className="text-sleep" />
        <span>{t('sleep.title')}</span>
        <span className="ml-auto flex flex-col items-end">
          <span className="text-sm font-bold text-primary leading-none">
            {sleep.sleepScore}
            <span className="text-xs text-secondary ml-0.5">/ 100</span>
          </span>
          <span className="text-[9px] text-muted leading-none mt-0.5">
            {isDemo ? t('sleep.estimated') : t('sleep.garmin')}
          </span>
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-end gap-2 mb-4">
        <span className="text-3xl font-black text-primary leading-none">
          {formatDuration(sleep.totalSleepSeconds)}
        </span>
        <span className="text-xs text-secondary mb-1">
          {totalHours.toFixed(1)} {t('sleep.recommended')}
        </span>
      </div>

      {/* Duration bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, (totalHours / 8) * 100)}%`,
            backgroundColor: totalHours >= 7 ? '#818cf8' : totalHours >= 6 ? '#facc15' : '#f87171',
          }}
        />
      </div>

      {/* Sleep stages */}
      <div className="flex gap-1 h-6 rounded-lg overflow-hidden mb-3">
        {STAGES.map(s => {
          const pct = sleep.totalSleepSeconds
            ? (sleep[s.key] / sleep.totalSleepSeconds) * 100
            : 0;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              className="transition-all duration-700"
              title={`${s.label}: ${formatDuration(sleep[s.key])}`}
            />
          );
        })}
      </div>

      {/* Stage legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {STAGES.map(s => {
          const pct = sleep.totalSleepSeconds
            ? Math.round((sleep[s.key] / sleep.totalSleepSeconds) * 100)
            : 0;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-secondary truncate">{s.label}</span>
              <span className="text-xs text-primary ml-auto font-medium">
                {formatDuration(sleep[s.key])}
                <span className="text-muted ml-1">{pct}%</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Extra stats */}
      {(sleep.averageSpO2 > 0 || sleep.averageHRV > 0) && (
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          {sleep.averageSpO2 > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] text-secondary uppercase tracking-widest">{t('sleep.spo2')}</span>
              <span className="text-sm font-bold text-primary">{sleep.averageSpO2.toFixed(1)}%</span>
            </div>
          )}
          {sleep.averageHRV > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] text-secondary uppercase tracking-widest">{t('sleep.hrvNight')}</span>
              <span className="text-sm font-bold text-primary">{sleep.averageHRV} ms</span>
            </div>
          )}
          {sleep.averageRespiration > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] text-secondary uppercase tracking-widest">{t('sleep.resp')}</span>
              <span className="text-sm font-bold text-primary">{sleep.averageRespiration.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto text-xs text-secondary">
            <Zap size={11} className="text-strain" />
            <span>
              {new Date(sleep.startTime).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              {' → '}
              {new Date(sleep.endTime).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* Demographic benchmark — only shown when profile is set */}
      {benchmark && sleep.totalSleepSeconds > 0 && (
        <BenchmarkBadge benchmark={benchmark} />
      )}
    </div>
  );
}
