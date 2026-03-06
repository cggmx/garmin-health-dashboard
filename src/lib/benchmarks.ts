import type { UserProfile, Sex } from './types';

// ── Population Reference Percentiles ─────────────────────────────────────────
// Based on published epidemiological research (NHANES, Cooper Institute, etc.)

interface Percentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

type AgeGroup = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

// ── HRV Norms (rMSSD, ms) ────────────────────────────────────────────────────
// p10 = lowest 10% of population, p90 = top 10% (high HRV = better fitness)
const HRV_NORMS: Record<Sex, Record<AgeGroup, Percentiles>> = {
  male: {
    '18-24': { p10: 38, p25: 50, p50: 67, p75: 87, p90: 110 },
    '25-34': { p10: 32, p25: 43, p50: 58, p75: 77, p90:  98 },
    '35-44': { p10: 26, p25: 37, p50: 50, p75: 68, p90:  86 },
    '45-54': { p10: 21, p25: 30, p50: 42, p75: 57, p90:  72 },
    '55-64': { p10: 17, p25: 25, p50: 35, p75: 48, p90:  62 },
    '65+':   { p10: 14, p25: 20, p50: 29, p75: 40, p90:  53 },
  },
  female: {
    '18-24': { p10: 36, p25: 47, p50: 62, p75: 81, p90: 103 },
    '25-34': { p10: 30, p25: 41, p50: 55, p75: 73, p90:  93 },
    '35-44': { p10: 24, p25: 35, p50: 48, p75: 65, p90:  82 },
    '45-54': { p10: 19, p25: 29, p50: 40, p75: 54, p90:  69 },
    '55-64': { p10: 16, p25: 24, p50: 33, p75: 46, p90:  59 },
    '65+':   { p10: 13, p25: 19, p50: 27, p75: 38, p90:  50 },
  },
};

// ── RHR Norms (bpm) ──────────────────────────────────────────────────────────
// Lower RHR = better cardiovascular fitness.
// p10 = fittest 10% (lowest bpm), p90 = least fit 10% (highest bpm)
const RHR_NORMS: Record<Sex, Record<AgeGroup, Percentiles>> = {
  male: {
    '18-24': { p10: 48, p25: 54, p50: 63, p75: 73, p90: 82 },
    '25-34': { p10: 49, p25: 55, p50: 64, p75: 74, p90: 83 },
    '35-44': { p10: 50, p25: 56, p50: 65, p75: 75, p90: 84 },
    '45-54': { p10: 50, p25: 57, p50: 66, p75: 76, p90: 85 },
    '55-64': { p10: 50, p25: 57, p50: 66, p75: 77, p90: 86 },
    '65+':   { p10: 49, p25: 56, p50: 66, p75: 77, p90: 87 },
  },
  female: {
    '18-24': { p10: 50, p25: 58, p50: 68, p75: 78, p90: 88 },
    '25-34': { p10: 51, p25: 59, p50: 69, p75: 79, p90: 89 },
    '35-44': { p10: 51, p25: 59, p50: 70, p75: 80, p90: 90 },
    '45-54': { p10: 52, p25: 60, p50: 70, p75: 81, p90: 91 },
    '55-64': { p10: 52, p25: 60, p50: 71, p75: 82, p90: 92 },
    '65+':   { p10: 51, p25: 60, p50: 71, p75: 82, p90: 92 },
  },
};

// ── Sleep Duration Norms (hours) ──────────────────────────────────────────────
// Based on NSF recommendations and NHANES population data
const SLEEP_NORMS: Record<AgeGroup, Percentiles> = {
  '18-24': { p10: 5.8, p25: 6.5, p50: 7.5, p75: 8.4, p90: 9.2 },
  '25-34': { p10: 5.8, p25: 6.5, p50: 7.4, p75: 8.3, p90: 9.1 },
  '35-44': { p10: 5.7, p25: 6.4, p50: 7.3, p75: 8.2, p90: 9.0 },
  '45-54': { p10: 5.5, p25: 6.2, p50: 7.0, p75: 7.9, p90: 8.7 },
  '55-64': { p10: 5.3, p25: 6.0, p50: 6.8, p75: 7.7, p90: 8.5 },
  '65+':   { p10: 5.2, p25: 5.9, p50: 6.7, p75: 7.5, p90: 8.2 },
};

// ── Fitness Level Adjustments ─────────────────────────────────────────────────
// Trained individuals tend to have higher HRV and lower RHR than the general
// population at the same age. We adjust reference norms accordingly.
const HRV_FITNESS_FACTOR: Record<string, number> = {
  beginner:     0.85,  // less cardiovascular adaptation than average
  intermediate: 1.00,  // general population baseline
  advanced:     1.20,  // structured training → higher HRV typical
  athlete:      1.40,  // daily high-intensity training → much higher HRV
};

const RHR_FITNESS_DELTA: Record<string, number> = {
  beginner:     +5,    // tends higher than population average
  intermediate:  0,    // population baseline
  advanced:     -5,    // lower than average (better conditioning)
  athlete:      -10,   // significantly lower (elite conditioning)
};

// ── Core Math ─────────────────────────────────────────────────────────────────

function getAgeGroup(age: number): AgeGroup {
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  if (age <= 64) return '55-64';
  return '65+';
}

function getAgeGroupLabel(age: number): string {
  if (age <= 24) return '18–24';
  if (age <= 34) return '25–34';
  if (age <= 44) return '35–44';
  if (age <= 54) return '45–54';
  if (age <= 64) return '55–64';
  return '65+';
}

/**
 * Compute the raw CDF percentile (1–99): what % of the population has a
 * value at or below `value`. Interpolates linearly between breakpoints.
 */
function rawPercentile(value: number, p: Percentiles): number {
  if (value <= p.p10) {
    return Math.max(1, Math.round((value / p.p10) * 10));
  }
  if (value <= p.p25) {
    const t = (value - p.p10) / (p.p25 - p.p10);
    return Math.round(10 + t * 15);
  }
  if (value <= p.p50) {
    const t = (value - p.p25) / (p.p50 - p.p25);
    return Math.round(25 + t * 25);
  }
  if (value <= p.p75) {
    const t = (value - p.p50) / (p.p75 - p.p50);
    return Math.round(50 + t * 25);
  }
  if (value <= p.p90) {
    const t = (value - p.p75) / (p.p90 - p.p75);
    return Math.round(75 + t * 15);
  }
  // Extrapolate gently above p90
  return Math.min(99, Math.round(90 + ((value - p.p90) / (p.p90 * 0.25)) * 9));
}

/**
 * Returns a *fitness* percentile (1–99, higher = better).
 * - higherIsBetter = true  → fitness pct = raw pct  (HRV, sleep duration)
 * - higherIsBetter = false → fitness pct = 100 - raw (RHR: lower bpm = fitter)
 */
function fitnessPercentile(
  value: number,
  p: Percentiles,
  higherIsBetter: boolean,
): number {
  const raw = rawPercentile(value, p);
  return higherIsBetter ? raw : Math.min(99, 100 - raw);
}

// ── Public Types ──────────────────────────────────────────────────────────────

export type BenchmarkCategory =
  | 'excellent'
  | 'good'
  | 'average'
  | 'below_average'
  | 'low';

const CATEGORIES: Record<BenchmarkCategory, { label: string; color: string }> = {
  excellent:     { label: 'Excelente', color: '#4ade80' },
  good:          { label: 'Bueno',     color: '#86efac' },
  average:       { label: 'Normal',    color: '#facc15' },
  below_average: { label: 'Bajo',      color: '#fb923c' },
  low:           { label: 'Muy bajo',  color: '#f87171' },
};

function toCategory(pct: number): BenchmarkCategory {
  if (pct >= 75) return 'excellent';
  if (pct >= 55) return 'good';
  if (pct >= 35) return 'average';
  if (pct >= 15) return 'below_average';
  return 'low';
}

export interface MetricBenchmark {
  /** The actual measured value */
  value: number;
  /** Fitness percentile 1-99 (99 = best) */
  percentile: number;
  category: BenchmarkCategory;
  /** Spanish label: "Excelente", "Bueno", etc. */
  label: string;
  /** CSS color string */
  color: string;
  /** 25th percentile for this demographic */
  p25: number;
  /** Median (50th pct) for this demographic */
  p50: number;
  /** 75th percentile for this demographic */
  p75: number;
  /** Unit string: 'ms', 'bpm', 'h' */
  unit: string;
  /** true for HRV/sleep (higher=better), false for RHR (lower=better) */
  higherIsBetter: boolean;
  /** e.g. "Hombres 35–44 años" */
  demographicLabel: string;
}

export interface ProfileBenchmarks {
  hrv: MetricBenchmark;
  rhr: MetricBenchmark;
  sleep: MetricBenchmark;
  ageGroupLabel: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute age/sex/fitness-adjusted benchmark percentiles for HRV, RHR and sleep.
 *
 * @param profile  User profile (age, sex, fitnessLevel)
 * @param data     Current metric values
 */
export function computeBenchmarks(
  profile: UserProfile,
  data: { hrv: number; rhr: number; sleepHours: number },
): ProfileBenchmarks {
  const ageGroup = getAgeGroup(profile.age);
  const ageLabel = getAgeGroupLabel(profile.age);
  const sexLabel = profile.sex === 'male' ? 'Hombres' : 'Mujeres';
  const demographicLabel = `${sexLabel} ${ageLabel} años`;

  // ── HRV ─────────────────────────────────────────────────────────────────────
  const rawHrv = HRV_NORMS[profile.sex][ageGroup];
  const factor = HRV_FITNESS_FACTOR[profile.fitnessLevel] ?? 1;
  const hrvNorms: Percentiles = {
    p10: Math.round(rawHrv.p10 * factor),
    p25: Math.round(rawHrv.p25 * factor),
    p50: Math.round(rawHrv.p50 * factor),
    p75: Math.round(rawHrv.p75 * factor),
    p90: Math.round(rawHrv.p90 * factor),
  };
  const hrvPct = fitnessPercentile(data.hrv, hrvNorms, true);
  const hrvCat = toCategory(hrvPct);

  // ── RHR ─────────────────────────────────────────────────────────────────────
  const rawRhr = RHR_NORMS[profile.sex][ageGroup];
  const delta = RHR_FITNESS_DELTA[profile.fitnessLevel] ?? 0;
  const rhrNorms: Percentiles = {
    p10: rawRhr.p10 + delta,
    p25: rawRhr.p25 + delta,
    p50: rawRhr.p50 + delta,
    p75: rawRhr.p75 + delta,
    p90: rawRhr.p90 + delta,
  };
  const rhrPct = fitnessPercentile(data.rhr, rhrNorms, false);
  const rhrCat = toCategory(rhrPct);

  // ── Sleep ────────────────────────────────────────────────────────────────────
  const sleepNorms = SLEEP_NORMS[ageGroup];
  const sleepPct = fitnessPercentile(data.sleepHours, sleepNorms, true);
  const sleepCat = toCategory(sleepPct);

  return {
    ageGroupLabel: `${ageLabel} años`,
    hrv: {
      value: data.hrv,
      percentile: hrvPct,
      category: hrvCat,
      label: CATEGORIES[hrvCat].label,
      color: CATEGORIES[hrvCat].color,
      p25: hrvNorms.p25,
      p50: hrvNorms.p50,
      p75: hrvNorms.p75,
      unit: 'ms',
      higherIsBetter: true,
      demographicLabel,
    },
    rhr: {
      value: data.rhr,
      percentile: rhrPct,
      category: rhrCat,
      label: CATEGORIES[rhrCat].label,
      color: CATEGORIES[rhrCat].color,
      p25: rhrNorms.p25,
      p50: rhrNorms.p50,
      p75: rhrNorms.p75,
      unit: 'bpm',
      higherIsBetter: false,
      demographicLabel,
    },
    sleep: {
      value: data.sleepHours,
      percentile: sleepPct,
      category: sleepCat,
      label: CATEGORIES[sleepCat].label,
      color: CATEGORIES[sleepCat].color,
      p25: sleepNorms.p25,
      p50: sleepNorms.p50,
      p75: sleepNorms.p75,
      unit: 'h',
      higherIsBetter: true,
      demographicLabel: `Adultos ${ageLabel} años`,
    },
  };
}

/** Format a fitness percentile as a readable Spanish string. */
export function formatPercentile(pct: number): string {
  if (pct >= 90) return 'Top 10%';
  if (pct >= 75) return 'Top 25%';
  if (pct >= 60) return 'Top 40%';
  if (pct >= 50) return 'Top 50%';
  return `Percentil ${pct}`;
}
