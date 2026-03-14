'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, User, Trash2, ChevronRight, Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useProfile } from '@/lib/useProfile';
import ProfileForm from '@/components/ProfileForm';
import WeightLog from '@/components/WeightLog';
import BottomNav from '@/components/BottomNav';
import NotificationSettings from '@/components/NotificationSettings';
import VO2maxCard from '@/components/VO2maxCard';
import TrainingZonesCard from '@/components/TrainingZonesCard';
import type { UserProfile } from '@/lib/types';
import { getWeightBenchmark } from '@/lib/benchmarks';
import { useLang } from '@/lib/i18n';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLang();
  const { profile, saveProfile, clearProfile, loaded } = useProfile();

  const FITNESS_LABEL: Record<string, string> = {
    beginner:     t('profile.fitnessLevels.beginner'),
    intermediate: t('profile.fitnessLevels.intermediate'),
    advanced:     t('profile.fitnessLevels.advanced'),
    athlete:      t('profile.fitnessLevels.athlete'),
  };

  const GOAL_LABEL: Record<string, string> = {
    recovery:       t('profile.goals.recovery'),
    performance:    t('profile.goals.performance'),
    weight_loss:    t('profile.goals.weight_loss'),
    general_health: t('profile.goals.general_health'),
  };

  const WEIGHT_GOAL_LABEL: Record<string, string> = {
    lose:     t('profile.weightGoals.lose'),
    maintain: t('profile.weightGoals.maintain'),
    gain:     t('profile.weightGoals.gain'),
  };

  const [lastRHR, setLastRHR] = useState(0);
  const [observedMaxHR, setObservedMaxHR] = useState<number | undefined>(undefined);
  useEffect(() => {
    const rhr = parseInt(localStorage.getItem('garmin_last_rhr') ?? '0', 10);
    const maxHR = parseInt(localStorage.getItem('garmin_observed_max_hr') ?? '0', 10);
    if (rhr > 0) setLastRHR(rhr);
    if (maxHR > 100) setObservedMaxHR(maxHR);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  const handleSave = (p: UserProfile) => {
    saveProfile(p);
    router.push('/');
  };

  const handleClear = () => {
    if (confirm(t('profile.deleteConfirm'))) {
      clearProfile();
    }
  };

  const wb = profile ? getWeightBenchmark(profile) : null;
  const weightGoal = profile?.weightGoal;

  // BMI scale position (0-100%) for the visual bar
  // We map BMI 15–40 to 0–100%
  const bmiBarPct = wb ? Math.min(100, Math.max(0, ((wb.bmi - 15) / 25) * 100)) : 0;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <User size={16} className="text-secondary" />
          <h1 className="text-sm font-bold text-primary">{t('profile.title')}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">

        {/* Summary card if profile exists */}
        {profile && (
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <User size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary truncate">
                {profile.name ?? (profile.sex === 'male' ? t('profile.male') : t('profile.female'))}, {profile.age} {t('common.units.years') as string || 'años'}
              </p>
              <p className="text-xs text-secondary">
                {FITNESS_LABEL[profile.fitnessLevel]} · {GOAL_LABEL[profile.goal]}
              </p>
              {wb && (
                <p className="text-xs mt-0.5" style={{ color: wb.color }}>
                  {profile.weight} kg · IMC {wb.bmi} · {wb.label}
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-muted flex-shrink-0" />
          </div>
        )}

        {/* ── BMI card — only when height + weight are set ─────────────── */}
        {wb && (
          <div className="card">
            <div className="card-header mb-4">
              <Scale size={14} className="text-secondary" />
              <span>{t('profile.bmiSection')}</span>
              <span
                className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: wb.color, backgroundColor: `${wb.color}18` }}
              >
                {wb.label}
              </span>
            </div>

            {/* Large BMI value */}
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-black leading-none" style={{ color: wb.color }}>
                {wb.bmi}
              </span>
              <div className="mb-1">
                <p className="text-sm text-secondary leading-tight">{wb.description}</p>
                {wb.direction !== 'ok' && (
                  <p className="text-xs text-muted mt-0.5">
                    {t('profile.bmiHealthyRange', { min: wb.idealMin, max: wb.idealMax })}
                  </p>
                )}
              </div>
            </div>

            {/* IMC visual bar */}
            <div className="mb-4">
              <div className="relative h-3 rounded-full overflow-hidden mb-1" style={{
                background: 'linear-gradient(to right, #38bdf8 0%, #4ade80 25%, #facc15 55%, #fb923c 75%, #f87171 100%)',
              }}>
                {/* User's position dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-bg shadow-lg transition-all"
                  style={{
                    left: `${bmiBarPct}%`,
                    transform: 'translateX(-50%) translateY(-50%)',
                    backgroundColor: wb.color,
                    boxShadow: `0 0 6px ${wb.color}88`,
                  }}
                />
              </div>
              {/* Labels */}
              <div className="flex justify-between text-[9px] text-muted px-0.5">
                <span>15</span>
                <span className="text-[#38bdf8]">18.5</span>
                <span className="text-[#4ade80]">25</span>
                <span className="text-[#facc15]">30</span>
                <span className="text-[#fb923c]">35</span>
                <span>40</span>
              </div>
              <div className="flex justify-between text-[9px] text-muted mt-0.5 px-0.5">
                <span></span>
                <span className="text-[#38bdf8]">{t('profile.bmiLow')}</span>
                <span className="text-[#4ade80]">{t('profile.bmiNormal')}</span>
                <span className="text-[#facc15]">{t('profile.bmiOver')}</span>
                <span className="text-[#fb923c]">{t('profile.bmiOb1')}</span>
                <span></span>
              </div>
            </div>

            {/* Weight goal context */}
            {weightGoal && (
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-bg border border-border mb-3">
                {weightGoal === 'lose'
                  ? <TrendingDown size={14} className="text-yellow-400" />
                  : weightGoal === 'gain'
                  ? <TrendingUp size={14} className="text-sky-400" />
                  : <Minus size={14} className="text-green-400" />}
                <span className="text-xs text-secondary">
                  {WEIGHT_GOAL_LABEL[weightGoal]}
                </span>
                {weightGoal === 'lose' && wb.direction === 'ok' && (
                  <span className="text-xs text-green-400 ml-auto">✓ {t('profile.alreadyInRange')}</span>
                )}
                {weightGoal === 'lose' && wb.distanceKg > 0 && (
                  <span className="text-xs text-muted ml-auto">{t('profile.toGoalNeg', { kg: wb.distanceKg })}</span>
                )}
                {weightGoal === 'gain' && wb.distanceKg > 0 && (
                  <span className="text-xs text-muted ml-auto">{t('profile.toGoalPos', { kg: wb.distanceKg })}</span>
                )}
              </div>
            )}

            {/* Athlete caveat */}
            {wb.athleteCaveat && (
              <p className="text-[10px] text-muted border-t border-border pt-3">
                {t('profile.bmiAthleteNote')}
              </p>
            )}

            {/* Population context */}
            {!wb.athleteCaveat && (
              <p className="text-[10px] text-muted border-t border-border pt-3">
                {t('profile.bmiRef')}
              </p>
            )}
          </div>
        )}

        {/* Hint when no weight data yet */}
        {profile && !wb && (
          <div className="card border-dashed">
            <div className="flex items-center gap-3">
              <Scale size={16} className="text-muted" />
              <div>
                <p className="text-sm text-secondary font-medium">{t('profile.bmiAddData')}</p>
                <p className="text-xs text-muted">{t('profile.bmiAddDataDesc')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Weight history log */}
        <WeightLog profile={profile} />

        {/* ── Fitness metrics (VO2max + Training Zones) — only when profile + HR data available ── */}
        {profile && lastRHR > 0 && (
          <>
            <div className="mt-2 mb-1">
              <p className="text-xs font-semibold text-secondary uppercase tracking-widest">
                {t('profile.fitnessSection')}
              </p>
            </div>
            <VO2maxCard
              restingHR={lastRHR}
              age={profile.age}
              sex={profile.sex}
              observedMaxHR={observedMaxHR}
            />
            <TrainingZonesCard
              restingHR={lastRHR}
              age={profile.age}
              observedMaxHR={observedMaxHR}
            />
          </>
        )}

        {/* Hint when no HR data yet */}
        {profile && lastRHR === 0 && (
          <div className="card border-dashed">
            <div className="flex items-center gap-3">
              <User size={16} className="text-muted" />
              <div>
                <p className="text-sm text-secondary font-medium">{t('profile.vo2maxSection')}</p>
                <p className="text-xs text-muted">{t('profile.vo2maxNote')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notification settings */}
        <NotificationSettings />

        {/* Form */}
        <div className="card">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">
            {profile ? t('profile.update') : t('profile.create')}
          </h2>
          <ProfileForm
            initial={profile ?? undefined}
            onSave={handleSave}
            ctaLabel={profile ? t('profile.update') : t('profile.save')}
          />
        </div>

        {/* Danger zone */}
        {profile && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-xs text-muted hover:text-recovery-red transition-colors mx-auto py-2"
          >
            <Trash2 size={13} />
            {t('profile.delete')}
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
