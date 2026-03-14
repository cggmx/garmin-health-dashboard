'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es as dateFnsEs } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { RefreshCw, WifiOff, Gauge, User } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import Link from 'next/link';
import type { DailyMetrics } from '@/lib/types';
import { checkAndNotifyBattery } from '@/lib/notifications';
import { useProfile } from '@/lib/useProfile';
import { computeBenchmarks } from '@/lib/benchmarks';
import type { ProfileBenchmarks } from '@/lib/benchmarks';
import RecoveryScore from './RecoveryScore';
import SleepCard from './SleepCard';
import HRVCard from './HRVCard';
import BodyBatteryCard from './BodyBatteryCard';
import StrainCard from './StrainCard';
import StressCard from './StressCard';
import WeeklyTrend from './WeeklyTrend';
import StatsRow from './StatsRow';
import BottomNav from './BottomNav';
import ProfileSetupModal from './ProfileSetupModal';
import InsightsCard from './InsightsCard';
import PushNotificationManager from './PushNotificationManager';

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface rounded-2xl ${className ?? ''}`} />
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DailyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const { profile, saveProfile, loaded: profileLoaded } = useProfile();
  const showSetup = profileLoaded && !profile;

  const { t, locale, setLocale } = useLang();

  // Date string must be client-only to avoid server/client hydration mismatch
  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    const dateLocale = locale === 'es' ? dateFnsEs : enUS;
    const fmt = locale === 'es' ? "EEEE, d 'de' MMMM" : 'EEEE, MMMM d';
    setDateStr(format(new Date(), fmt, { locale: dateLocale }));
  }, [locale]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass local date so the server doesn't use UTC (which can be a day ahead)
      const localDate = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch(`/api/health?date=${localDate}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DailyMetrics = await res.json();
      setData(json);
      setLastSync(new Date());
      // Cache fitness metrics for profile page (VO2max + training zones)
      if (json.recovery?.restingHR > 0) {
        localStorage.setItem('garmin_last_rhr', String(json.recovery.restingHR));
      }
      const observedMax = json.activities?.reduce((m: number, a: { maxHR: number }) => Math.max(m, a.maxHR ?? 0), 0);
      if (observedMax > 100) {
        localStorage.setItem('garmin_observed_max_hr', String(observedMax));
      }
      // Check Body Battery alert threshold (no-op if notifications are disabled)
      if (json.bodyBattery?.isAvailable) {
        checkAndNotifyBattery(json.bodyBattery.current);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const todayStrain = data?.strain ?? 0;
  const greeting = profile?.name ? t('dashboard.hello', { name: profile.name }) : t('dashboard.title');

  // Compute age/sex/fitness benchmarks whenever we have both profile and data
  const benchmarks: ProfileBenchmarks | null =
    profile && data && data.hrv.weeklyAverage > 0 && data.recovery.restingHR > 0
      ? computeBenchmarks(profile, {
          hrv: data.hrv.weeklyAverage,
          rhr: data.recovery.restingHR,
          sleepHours: data.sleep.totalSleepSeconds / 3600,
        })
      : null;

  return (
    <>
      {/* First-time setup modal */}
      {showSetup && (
        <ProfileSetupModal onComplete={saveProfile} />
      )}

      <div className="min-h-screen bg-bg">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge size={18} className="text-primary" />
              <div>
                <h1 className="text-sm font-bold text-primary leading-none">{greeting}</h1>
                <p className="text-[10px] text-secondary capitalize mt-0.5">
                  {dateStr}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data?.isDemo && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  {t('common.demo')}
                </span>
              )}
              {lastSync && (
                <span className="text-[10px] text-muted">
                  {format(lastSync, 'HH:mm')}
                </span>
              )}
              {/* Language toggle */}
              <button
                onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-border text-secondary hover:text-primary transition-colors"
              >
                {t('dashboard.langToggle')}
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors disabled:opacity-40"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              {/* Profile link */}
              <Link
                href="/profile"
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors"
              >
                {profile ? (
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary">
                      {(profile.name ?? (profile.sex === 'male' ? 'H' : 'M'))[0].toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <User size={15} />
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-md mx-auto px-4 pb-28 pt-2">
          {/* Error state */}
          {error && (
            <div className="card flex items-center gap-3 mb-4 border-red-400/20">
              <WifiOff size={16} className="text-recovery-red flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-recovery-red">{t('dashboard.error')}</p>
                <p className="text-xs text-secondary">{error}</p>
              </div>
              <button
                onClick={fetchData}
                className="ml-auto text-xs text-primary underline"
              >
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && !data && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-72" />
              <Skeleton className="h-48" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          )}

          {/* Data */}
          {data && (
            <div className="flex flex-col gap-4 animate-fade-up">

              {/* Recovery — hero section */}
              <div className="card">
                <RecoveryScore recovery={data.recovery} benchmarks={benchmarks} />
              </div>

              {/* Insights / auto-recommendations */}
              <InsightsCard data={data} profile={profile} benchmarks={benchmarks} />

              {/* Sleep */}
              <SleepCard sleep={data.sleep} benchmark={benchmarks?.sleep} isDemo={data.isDemo} />

              {/* HRV */}
              <HRVCard hrv={data.hrv} benchmark={benchmarks?.hrv} />

              {/* Body Battery */}
              <BodyBatteryCard bodyBattery={data.bodyBattery} />

              {/* Strain + Activities */}
              <StrainCard activities={data.activities} todayStrain={todayStrain} steps={data.steps} floorsAscended={data.floorsAscended} highlyActiveSeconds={data.highlyActiveSeconds} bodyBatteryDrained={data.bodyBattery.drained} />

              {/* Stress timeline */}
              <StressCard stress={data.stress} />

              {/* Steps / Calories */}
              <StatsRow steps={data.steps} calories={data.calories} />

              {/* Push notifications settings */}
              <PushNotificationManager currentBattery={data.bodyBattery.current} />

              {/* Weekly trends */}
              <WeeklyTrend trend={data.weeklyTrend} />

              {/* Footer info */}
              <div className="text-center text-[10px] text-muted py-2">
                {data.isDemo ? (
                  <span>{t('dashboard.demoBadge')}</span>
                ) : (
                  <span>{t('dashboard.dataDate', { date: data.date })}</span>
                )}
              </div>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </>
  );
}
