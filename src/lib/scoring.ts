import type { SleepData, ActivityData } from './types';

export function calculateSleepScore(sleep: SleepData): number {
  if (!sleep.totalSleepSeconds) return 50;

  const totalHours = sleep.totalSleepSeconds / 3600;
  const deepPct = sleep.deepSleepSeconds / sleep.totalSleepSeconds;
  const remPct = sleep.remSleepSeconds / sleep.totalSleepSeconds;

  // Duration score (60%) — optimal: 7–9h
  let durationScore: number;
  if (totalHours >= 7 && totalHours <= 9) durationScore = 100;
  else if (totalHours >= 6.5) durationScore = 85;
  else if (totalHours >= 6) durationScore = 70;
  else if (totalHours >= 5) durationScore = 50;
  else durationScore = 25;

  // Quality score (40%) — targets: deep=20%, REM=25%
  const deepScore = Math.min(100, (deepPct / 0.2) * 100);
  const remScore = Math.min(100, (remPct / 0.25) * 100);
  const qualityScore = deepScore * 0.5 + remScore * 0.5;

  return Math.round(Math.max(0, Math.min(100, durationScore * 0.6 + qualityScore * 0.4)));
}

export function calculateRecoveryScore(params: {
  lastNightHRV: number;
  baselineHRV: number;
  restingHR: number;
  baselineRHR: number;
  sleepScore: number;
}): number {
  const { lastNightHRV, baselineHRV, restingHR, baselineRHR, sleepScore } = params;

  if (!baselineHRV || !baselineRHR) return Math.round(sleepScore);

  // HRV component (40%): ratio vs 7-day baseline
  const hrvRatio = lastNightHRV / baselineHRV;
  const hrvScore = Math.min(100, Math.max(0, 50 + (hrvRatio - 1) * 200));

  // RHR component (30%): percentage deviation from baseline (lower = better)
  const rhrDevPct = ((baselineRHR - restingHR) / baselineRHR) * 100;
  const rhrScore = Math.min(100, Math.max(0, 50 + rhrDevPct * 3));

  return Math.round(
    Math.max(0, Math.min(100, hrvScore * 0.4 + rhrScore * 0.3 + sleepScore * 0.3))
  );
}

export function calculateStrainScore(activities: ActivityData[]): number {
  if (!activities.length) return 0;
  const raw = activities.reduce((sum, a) => {
    const hrs = a.duration / 3600;
    const intensity = a.maxHR > 0 ? Math.min(1, a.averageHR / a.maxHR) : 0.6;
    return sum + hrs * intensity * 5;
  }, 0);
  return Math.round(Math.min(21, raw) * 10) / 10;
}

export function getRecoveryCategory(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 67) return 'green';
  if (score >= 34) return 'yellow';
  return 'red';
}

export function getCategoryColor(score: number): string {
  if (score >= 67) return '#4ade80';
  if (score >= 34) return '#facc15';
  return '#f87171';
}

export function getStrainColor(strain: number): string {
  if (strain <= 8) return '#38bdf8';
  if (strain <= 14) return '#fb923c';
  return '#f87171';
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function getHRVStatus(hrv: number, baseline: number): 'balanced' | 'unbalanced' | 'poor' {
  const ratio = hrv / Math.max(baseline, 1);
  if (ratio >= 0.95) return 'balanced';
  if (ratio >= 0.8) return 'unbalanced';
  return 'poor';
}
