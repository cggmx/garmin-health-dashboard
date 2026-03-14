'use client';

import { Heart } from 'lucide-react';
import { calculateVO2max, getVO2maxCategory } from '@/lib/scoring';
import type { Sex } from '@/lib/types';
import { useLang } from '@/lib/i18n';

const CATEGORY_PERCENTILE: Record<string, string> = {
  superior:  'Top 5%',
  excelente: 'Top 20%',
  bueno:     'Top 40%',
  promedio:  'Top 60%',
  bajo:      'Bottom 40%',
};

interface Props {
  restingHR: number;
  age: number;
  sex: Sex;
  observedMaxHR?: number;
}

export default function VO2maxCard({ restingHR, age, sex, observedMaxHR }: Props) {
  const { t } = useLang();
  if (!restingHR || restingHR < 30) return null;

  const vo2max = calculateVO2max(restingHR, age, observedMaxHR);
  const norm = getVO2maxCategory(vo2max, age, sex);

  const CATEGORY_LABEL: Record<string, string> = {
    superior:  t('vo2max.categories.superior'),
    excelente: t('vo2max.categories.excellent'),
    bueno:     t('vo2max.categories.good'),
    promedio:  t('vo2max.categories.average'),
    bajo:      t('vo2max.categories.low'),
  };

  // Bar: map vo2 to 0–100% on a 20–70 scale
  const barPct = Math.min(100, Math.max(0, ((vo2max - 20) / 50) * 100));

  // Category thresholds for the bar markers (male 30-39 as reference)
  const segments = [
    { label: t('vo2max.chartLabels.low'),       pct: 0,   color: '#f87171' },
    { label: t('vo2max.chartLabels.avg'),        pct: 20,  color: '#fb923c' },
    { label: t('vo2max.chartLabels.good'),       pct: 40,  color: '#facc15' },
    { label: t('vo2max.chartLabels.excellent'),  pct: 60,  color: '#86efac' },
    { label: t('vo2max.chartLabels.superior'),   pct: 80,  color: '#4ade80' },
  ];

  return (
    <div className="card">
      <div className="card-header mb-4">
        <Heart size={14} className="text-secondary" />
        <span>{t('vo2max.title')}</span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ color: norm.color, backgroundColor: `${norm.color}18` }}
        >
          {CATEGORY_LABEL[norm.label]}
        </span>
      </div>

      {/* Big value */}
      <div className="flex items-end gap-3 mb-4">
        <span className="text-5xl font-black leading-none" style={{ color: norm.color }}>
          {vo2max}
        </span>
        <div className="mb-1">
          <p className="text-sm text-secondary leading-tight">{t('vo2max.unit')}</p>
          <p className="text-xs text-muted mt-0.5">{CATEGORY_PERCENTILE[norm.label]}</p>
        </div>
      </div>

      {/* Gradient bar */}
      <div className="mb-4">
        <div
          className="relative h-3 rounded-full overflow-hidden mb-1"
          style={{
            background:
              'linear-gradient(to right, #f87171 0%, #fb923c 25%, #facc15 45%, #86efac 65%, #4ade80 100%)',
          }}
        >
          <div
            className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-bg shadow-lg"
            style={{
              left: `${barPct}%`,
              transform: 'translateX(-50%) translateY(-50%)',
              backgroundColor: norm.color,
              boxShadow: `0 0 6px ${norm.color}88`,
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted px-0.5 mt-1">
          {segments.map(s => (
            <span key={s.label} style={{ color: s.color }}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* Formula details */}
      <div className="flex gap-3 py-2 px-3 rounded-xl bg-bg border border-border">
        <div className="text-center">
          <p className="text-xs font-semibold text-primary">{restingHR}</p>
          <p className="text-[9px] text-muted">{t('vo2max.inputs.restingHR')}</p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <p className="text-xs font-semibold text-primary">
            {observedMaxHR && observedMaxHR > 100 ? observedMaxHR : Math.round(208 - 0.7 * age)}
          </p>
          <p className="text-[9px] text-muted">{observedMaxHR && observedMaxHR > 100 ? t('vo2max.inputs.maxHRReal') : t('vo2max.inputs.maxHREstimated')}</p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center flex-1">
          <p className="text-xs font-semibold text-primary">{t('vo2max.formula')}</p>
          <p className="text-[9px] text-muted">{t('vo2max.formulaDetail')}</p>
        </div>
      </div>

      <p className="text-[10px] text-muted border-t border-border pt-3 mt-3">
        {t('vo2max.note')}
      </p>
    </div>
  );
}
