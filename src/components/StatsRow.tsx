'use client';

import { Footprints, Flame } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface Props {
  steps: number;
  calories: number;
}

export default function StatsRow({ steps, calories }: Props) {
  const { t } = useLang();
  if (!steps && !calories) return null;
  return (
    <div className="flex gap-3">
      {steps > 0 && (
        <div className="card flex-1 flex items-center gap-3 py-3">
          <Footprints size={18} className="text-battery flex-shrink-0" />
          <div>
            <p className="text-[10px] text-secondary uppercase tracking-widest">{t('statsRow.steps')}</p>
            <p className="text-xl font-black text-primary">{steps.toLocaleString('es')}</p>
          </div>
        </div>
      )}
      {calories > 0 && (
        <div className="card flex-1 flex items-center gap-3 py-3">
          <Flame size={18} className="text-strain flex-shrink-0" />
          <div>
            <p className="text-[10px] text-secondary uppercase tracking-widest">{t('statsRow.calories')}</p>
            <p className="text-xl font-black text-primary">{calories.toLocaleString('es')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
