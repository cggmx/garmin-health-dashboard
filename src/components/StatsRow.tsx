'use client';

import { Footprints, Flame } from 'lucide-react';

interface Props {
  steps: number;
  calories: number;
}

export default function StatsRow({ steps, calories }: Props) {
  if (!steps && !calories) return null;
  return (
    <div className="flex gap-3">
      {steps > 0 && (
        <div className="card flex-1 flex items-center gap-3 py-3">
          <Footprints size={18} className="text-battery flex-shrink-0" />
          <div>
            <p className="text-[10px] text-secondary uppercase tracking-widest">Pasos</p>
            <p className="text-xl font-black text-primary">{steps.toLocaleString('es')}</p>
          </div>
        </div>
      )}
      {calories > 0 && (
        <div className="card flex-1 flex items-center gap-3 py-3">
          <Flame size={18} className="text-strain flex-shrink-0" />
          <div>
            <p className="text-[10px] text-secondary uppercase tracking-widest">Calorías</p>
            <p className="text-xl font-black text-primary">{calories.toLocaleString('es')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
