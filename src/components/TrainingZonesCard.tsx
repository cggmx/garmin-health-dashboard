'use client';

import { Zap } from 'lucide-react';
import { calculateTrainingZones } from '@/lib/scoring';
import { useLang } from '@/lib/i18n';

interface Props {
  restingHR: number;
  age: number;
  observedMaxHR?: number;
  /** If provided, highlights the zone the user was in today */
  lastActivityAvgHR?: number;
}

export default function TrainingZonesCard({ restingHR, age, observedMaxHR, lastActivityAvgHR }: Props) {
  const { t } = useLang();
  if (!restingHR || restingHR < 30) return null;

  const zones = calculateTrainingZones(restingHR, age, observedMaxHR);

  // Find active zone from today's workout HR
  const activeZone = lastActivityAvgHR
    ? zones.find(z => lastActivityAvgHR >= z.hrLow && lastActivityAvgHR <= z.hrHigh)?.zone
    : null;

  return (
    <div className="card">
      <div className="card-header mb-4">
        <Zap size={14} className="text-secondary" />
        <span>{t('trainingZones.title')}</span>
        <span className="ml-auto text-[10px] text-muted">{t('trainingZones.model')}</span>
      </div>

      <div className="flex flex-col gap-2">
        {[...zones].reverse().map(zone => {
          const isActive = activeZone === zone.zone;
          const widthPct = 40 + zone.zone * 12; // visual width gradient (z1 narrower bar)
          return (
            <div
              key={zone.zone}
              className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${
                isActive ? 'bg-bg border border-current' : 'bg-bg border border-border'
              }`}
              style={isActive ? { borderColor: `${zone.color}55` } : undefined}
            >
              {/* Zone badge */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: `${zone.color}22`, color: zone.color }}
              >
                {zone.zone}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary">{zone.name}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: zone.color }}>
                    {zone.hrLow}–{zone.hrHigh} <span className="text-muted font-normal text-[9px]">bpm</span>
                  </span>
                </div>
                {/* Bar */}
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${widthPct}%`, backgroundColor: zone.color, opacity: 0.7 }}
                  />
                </div>
                <p className="text-[9px] text-muted mt-0.5">{zone.description}</p>
              </div>

              {isActive && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: zone.color, backgroundColor: `${zone.color}22` }}
                >
                  {t('trainingZones.today')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted border-t border-border pt-3 mt-3">
        {t('trainingZones.fcInfo', {
          maxHR: observedMaxHR && observedMaxHR > 100
            ? t('trainingZones.fcMaxObserved', { hr: observedMaxHR })
            : t('trainingZones.fcMaxEstimated', { hr: Math.round(208 - 0.7 * age) }),
          restHR: restingHR,
        })}
      </p>
    </div>
  );
}
