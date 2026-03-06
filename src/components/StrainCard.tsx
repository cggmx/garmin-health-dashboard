'use client';

import { Flame, Timer, Heart } from 'lucide-react';
import type { ActivityData } from '@/lib/types';
import { getStrainColor, formatDuration } from '@/lib/scoring';

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
}

export default function StrainCard({ activities, todayStrain }: Props) {
  const strainColor = getStrainColor(todayStrain);

  return (
    <div className="card">
      <div className="card-header">
        <Flame size={14} className="text-strain" />
        <span>Esfuerzo de Hoy</span>
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
        <span>Recuperación</span>
        <span>Moderado</span>
        <span>Alto</span>
        <span>Extremo</span>
      </div>

      {/* Activities */}
      {activities.length === 0 ? (
        <p className="text-xs text-secondary text-center py-2">Sin actividades registradas hoy</p>
      ) : (
        <div className="flex flex-col gap-2">
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
                <span className="text-[10px] text-muted">esfuerzo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
