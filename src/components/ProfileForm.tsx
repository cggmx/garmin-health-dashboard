'use client';

import { useState } from 'react';
import { User, CheckCircle } from 'lucide-react';
import type { UserProfile, Sex, FitnessLevel, Goal, WeightGoal } from '@/lib/types';
import { calculateBMI } from '@/lib/benchmarks';
import { clsx } from 'clsx';
import { useLang } from '@/lib/i18n';

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

function bmiColor(bmi: number): string {
  if (bmi < 18.5) return '#38bdf8';
  if (bmi < 25)   return '#4ade80';
  if (bmi < 30)   return '#facc15';
  if (bmi < 35)   return '#fb923c';
  return '#f87171';
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ProfileForm({ initial, onSave, onCancel, ctaLabel }: Props) {
  const { t } = useLang();
  const defaultCtaLabel = ctaLabel ?? t('profile.save');

  function bmiLabel(bmi: number): string {
    if (bmi < 18.5) return t('profile.bmiCategories.underweight');
    if (bmi < 25)   return t('profile.bmiCategories.healthy');
    if (bmi < 30)   return t('profile.bmiCategories.overweight');
    if (bmi < 35)   return t('profile.bmiCategories.obese1');
    return t('profile.bmiCategories.obese2');
  }
  const [name, setName]               = useState(initial?.name ?? '');
  const [age, setAge]                 = useState(initial?.age?.toString() ?? '');
  const [sex, setSex]                 = useState<Sex>(initial?.sex ?? 'male');
  const [height, setHeight]           = useState(initial?.height?.toString() ?? '');
  const [weight, setWeight]           = useState(initial?.weight?.toString() ?? '');
  const [weightGoal, setWeightGoal]   = useState<WeightGoal | ''>(initial?.weightGoal ?? '');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(initial?.fitnessLevel ?? 'intermediate');
  const [goal, setGoal]               = useState<Goal>(initial?.goal ?? 'general_health');

  const ageNum    = parseInt(age, 10);
  const heightNum = parseInt(height, 10);
  const weightNum = parseFloat(weight);
  const isValid   = age !== '' && ageNum >= 10 && ageNum <= 100;

  // Live BMI preview
  const bmi = (heightNum >= 100 && weightNum > 0)
    ? calculateBMI(weightNum, heightNum)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      name: name.trim() || undefined,
      age: ageNum,
      sex,
      height: heightNum > 0 ? heightNum : undefined,
      weight: weightNum > 0 ? weightNum : undefined,
      weightGoal: (weightGoal || undefined) as WeightGoal | undefined,
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
          {t('profile.name')} <span className="text-muted font-normal normal-case">{t('profile.nameOptional')}</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('profile.namePlaceholder')}
          maxLength={30}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Age */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">
          {t('profile.age')}
        </label>
        <input
          type="number"
          value={age}
          onChange={e => setAge(e.target.value)}
          placeholder={t('profile.agePlaceholder')}
          min={10}
          max={100}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
        {age !== '' && !isValid && (
          <p className="text-xs text-recovery-red">{t('profile.ageError')}</p>
        )}
      </div>

      {/* Sex */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">{t('profile.sex')}</label>
        <div className="flex gap-2">
          <OptionButton value="male" current={sex} label={t('profile.male')} onClick={setSex} />
          <OptionButton value="female" current={sex} label={t('profile.female')} onClick={setSex} />
        </div>
      </div>

      {/* Height + Weight side by side */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-secondary uppercase tracking-widest">
            {t('profile.height')} <span className="text-muted font-normal normal-case">{t('profile.heightUnit')}</span>
          </label>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(e.target.value)}
            placeholder={t('profile.heightPlaceholder')}
            min={100}
            max={250}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-secondary uppercase tracking-widest">
            {t('profile.weight')} <span className="text-muted font-normal normal-case">{t('profile.weightUnit')}</span>
          </label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder={t('profile.weightPlaceholder')}
            min={30}
            max={300}
            step={0.1}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Live BMI preview */}
      {bmi > 0 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between border"
          style={{ borderColor: `${bmiColor(bmi)}40`, backgroundColor: `${bmiColor(bmi)}0d` }}
        >
          <div>
            <p className="text-xs text-secondary">{t('profile.bmiCalculated')}</p>
            <p className="text-xs text-muted mt-0.5">
              {t('profile.bmiRange', { min: Math.round(18.5 * (heightNum/100) ** 2 * 10) / 10, max: Math.round(24.9 * (heightNum/100) ** 2 * 10) / 10 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black leading-none" style={{ color: bmiColor(bmi) }}>
              {bmi}
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: bmiColor(bmi) }}>
              {bmiLabel(bmi)}
            </p>
          </div>
        </div>
      )}

      {/* Weight goal — only shown when weight is entered */}
      {weightNum > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-secondary uppercase tracking-widest">
            {t('profile.weightGoalLabel')} <span className="text-muted font-normal normal-case">{t('profile.weightGoalOptional')}</span>
          </label>
          <div className="flex gap-2">
            <OptionButton value="lose"     current={weightGoal as WeightGoal} label={t('profile.weightGoalLose')}     onClick={setWeightGoal} />
            <OptionButton value="maintain" current={weightGoal as WeightGoal} label={t('profile.weightGoalMaintain')} onClick={setWeightGoal} />
            <OptionButton value="gain"     current={weightGoal as WeightGoal} label={t('profile.weightGoalGain')}     onClick={setWeightGoal} />
          </div>
        </div>
      )}

      {/* Fitness level */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">{t('profile.fitnessLevel')}</label>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton value="beginner"     current={fitnessLevel} label={t('profile.fitnessLevels.beginner')}     onClick={setFitnessLevel} />
          <OptionButton value="intermediate" current={fitnessLevel} label={t('profile.fitnessLevels.intermediate')} onClick={setFitnessLevel} />
          <OptionButton value="advanced"     current={fitnessLevel} label={t('profile.fitnessLevels.advanced')}     onClick={setFitnessLevel} />
          <OptionButton value="athlete"      current={fitnessLevel} label={t('profile.fitnessLevels.athlete')}      onClick={setFitnessLevel} />
        </div>
        <p className="text-[10px] text-muted">
          {fitnessLevel === 'beginner'     && t('profile.fitnessDescs.beginner')}
          {fitnessLevel === 'intermediate' && t('profile.fitnessDescs.intermediate')}
          {fitnessLevel === 'advanced'     && t('profile.fitnessDescs.advanced')}
          {fitnessLevel === 'athlete'      && t('profile.fitnessDescs.athlete')}
        </p>
      </div>

      {/* Goal */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-secondary uppercase tracking-widest">{t('profile.goal')}</label>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton value="recovery"       current={goal} label={t('profile.goals.recovery')}       onClick={setGoal} />
          <OptionButton value="performance"    current={goal} label={t('profile.goals.performance')}    onClick={setGoal} />
          <OptionButton value="weight_loss"    current={goal} label={t('profile.goals.weight_loss')}    onClick={setGoal} />
          <OptionButton value="general_health" current={goal} label={t('profile.goals.general_health')} onClick={setGoal} />
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
            {t('profile.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-bg flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
        >
          <CheckCircle size={16} />
          {defaultCtaLabel}
        </button>
      </div>

      {/* Context note */}
      <p className="text-[10px] text-muted text-center -mt-2 pb-1">
        <User size={10} className="inline mr-1" />
        {t('profile.savedNote')}
      </p>
    </form>
  );
}
