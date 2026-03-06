'use client';

import { useState } from 'react';
import { User, CheckCircle } from 'lucide-react';
import type { UserProfile, Sex, FitnessLevel, Goal } from '@/lib/types';
import { clsx } from 'clsx';

interface Props {
  initial?: Partial<UserProfile>;
  onSave: (profile: UserProfile) => void;
  onCancel?: () => void;
  ctaLabel?: string;
}

// ─── Selector helpers ────────────────────────────────────────────────────────
function OptionButton<T extends string>({
  value, current, label, onClick,
}: { value: T; current: T; label: string; onClick: (v: T) => void }) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={clsx(
        'flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border',
        active
          ? 'bg-primary text-bg border-primary'
          : 'bg-surface text-secondary border-border hover:border-secondary hover:text-primary',
      )}
    >
      {label}
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ProfileForm({ initial, onSave, onCancel, ctaLabel = 'Guardar perfil' }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [age, setAge] = useState(initial?.age?.toString() ?? '');
  const [sex, setSex] = useState<Sex>(initial?.sex ?? 'male');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(initial?.fitnessLevel ?? 'intermediate');
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? 'general_health');

  const ageNum = parseInt(age, 10);
  const isValid = age !== '' && ageNum >= 10 && ageNum <= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      name: name.trim() || undefined,
      age: ageNum,
      sex,
      fitnessLevel,
      goal,
      setupCompleted: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">
          Nombre <span className="text-muted font-normal normal-case">(opcional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="ej. Carlos"
          maxLength={30}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Age */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">
          Edad
        </label>
        <input
          type="number"
          value={age}
          onChange={e => setAge(e.target.value)}
          placeholder="ej. 35"
          min={10}
          max={100}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
        {age !== '' && !isValid && (
          <p className="text-xs text-recovery-red">Ingresa una edad válida entre 10 y 100.</p>
        )}
      </div>

      {/* Sex */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">Sexo</label>
        <div className="flex gap-2">
          <OptionButton value="male" current={sex} label="Hombre" onClick={setSex} />
          <OptionButton value="female" current={sex} label="Mujer" onClick={setSex} />
        </div>
      </div>

      {/* Fitness level */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">Nivel de forma física</label>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton value="beginner" current={fitnessLevel} label="Principiante" onClick={setFitnessLevel} />
          <OptionButton value="intermediate" current={fitnessLevel} label="Intermedio" onClick={setFitnessLevel} />
          <OptionButton value="advanced" current={fitnessLevel} label="Avanzado" onClick={setFitnessLevel} />
          <OptionButton value="athlete" current={fitnessLevel} label="Atleta" onClick={setFitnessLevel} />
        </div>
        <p className="text-[10px] text-muted">
          {fitnessLevel === 'beginner' && 'Menos de 6 meses de actividad regular.'}
          {fitnessLevel === 'intermediate' && '6 meses a 2 años de actividad regular.'}
          {fitnessLevel === 'advanced' && 'Más de 2 años, entrenamiento estructurado.'}
          {fitnessLevel === 'athlete' && 'Entrenamiento diario de alta intensidad, competición.'}
        </p>
      </div>

      {/* Goal */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">Objetivo principal</label>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton value="recovery" current={goal} label="Recuperación" onClick={setGoal} />
          <OptionButton value="performance" current={goal} label="Rendimiento" onClick={setGoal} />
          <OptionButton value="weight_loss" current={goal} label="Pérdida de peso" onClick={setGoal} />
          <OptionButton value="general_health" current={goal} label="Salud general" onClick={setGoal} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-secondary bg-surface border border-border hover:text-primary transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-bg flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
        >
          <CheckCircle size={16} />
          {ctaLabel}
        </button>
      </div>

      {/* Context note */}
      <p className="text-[10px] text-muted text-center -mt-2 pb-1">
        <User size={10} className="inline mr-1" />
        Guardado localmente en tu dispositivo. Tus métricas se comparan con personas de tu perfil.
      </p>
    </form>
  );
}
