'use client';

import { Flame, Timer, Heart } from 'lucide-react';
import type { ActivityData } from '@/lib/types';
import { getStrainColor, formatDuration } from '@/lib/scoring';
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

interface Props {
  activities: ActivityData[];
  todayStrain: number;
  steps?: number;
  floorsAscended?: number;
  highlyActiveSeconds?: number;
  bodyBatteryDrained?: number;
}

export default function StrainCard({ activities, todayStrain, steps = 0, floorsAscended = 0, highlyActiveSeconds = 0, bodyBatteryDrained = 0 }: Props) {
  const { t } = useLang();
  const highlyActiveMin = Math.round(highlyActiveSeconds / 60);
  const strainColor = getStrainColor(todayStrain);

  return (
    <div className="card">
      <div className="card-header">
        <Flame size={14} className="text-strain" />
        <span>{t('strain.titleToday')}</span>
        <div className="ml-auto flex items-end gap-1">
          <span className="text-2xl font-black leading-none" style={{ color: strainColor }}>
            {todayStrain.toFixed(1)}
          </span>
          <span className="text-xs text-secondary mb-0.5">/ 21</span>
        </div>
      </div>

      {/* Strain bar (Whoop-style 0-21 scale) */}
      <div className="relative w-full h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${(todayStrain / 21) * 100}%`,
            backgroundColor: strainColor,
            boxShadow: `0 0 8px ${strainColor}66`,
          }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-[9px] text-muted uppercase tracking-widest mb-4">
        <span>{t('common.low')}</span>
        <span>{t('common.moderate')}</span>
        <span>{t('common.high')}</span>
        <span>{t('strain.extreme')}</span>
      </div>

      {/* Activities */}
      {activities.length === 0 ? (
        <div className="py-2 text-center">
          <p className="text-xs text-secondary">{t('strain.noActivities')}</p>
          {todayStrain > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {steps > 0 && (
                <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.steps', { steps: steps.toLocaleString() })}
                </span>
              )}
              {highlyActiveMin > 5 && (
                <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.activeMin', { min: highlyActiveMin })}
                </span>
              )}
              {floorsAscended > 3 && (
                <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.floors', { floors: floorsAscended })}
                </span>
              )}
              {bodyBatteryDrained > 10 && (
                <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.batteryDrained', { drained: bodyBatteryDrained })}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(steps > 0 || highlyActiveMin > 10 || floorsAscended > 3 || bodyBatteryDrained > 10) && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {steps > 0 && (
                <span className="text-[10px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.steps', { steps: steps.toLocaleString() })}
                </span>
              )}
              {highlyActiveMin > 10 && (
                <span className="text-[10px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.activeMin', { min: highlyActiveMin })}
                </span>
              )}
              {floorsAscended > 3 && (
                <span className="text-[10px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.floors', { floors: floorsAscended })}
                </span>
              )}
              {bodyBatteryDrained > 10 && (
                <span className="text-[10px] text-muted bg-bg px-2 py-0.5 rounded-full">
                  {t('strain.batteryDrained', { drained: bodyBatteryDrained })}
                </span>
              )}
            </div>
          )}
          {activities.map((act, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg">
              <span className="text-xl">
                {ACTIVITY_ICONS[act.type] ?? ACTIVITY_ICONS.other}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{act.name}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-secondary">
                    <Timer size={10} />
                    {formatDuration(act.duration)}
                  </span>
                  {act.averageHR > 0 && (
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <Heart size={10} />
                      {act.averageHR} bpm avg
                    </span>
                  )}
                  {act.calories > 0 && (
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <Flame size={10} />
                      {act.calories} kcal
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className="text-sm font-bold"
                  style={{ color: getStrainColor(act.strain) }}
                >
                  {act.strain.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted">{t('strain.strainLabel')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
