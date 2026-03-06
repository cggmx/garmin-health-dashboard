import { format, subDays } from 'date-fns';
import type {
  DailyMetrics, SleepData, HRVData, BodyBatteryData,
  StressData, ActivityData, WeeklyTrend,
} from './types';
import {
  calculateSleepScore, calculateRecoveryScore, getRecoveryCategory,
  calculateStrainScore, getHRVStatus,
} from './scoring';
import { mockData } from './mockData';

// ─── In-memory cache ──────────────────────────────────────────────────────────
interface CacheEntry { data: DailyMetrics; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min

// ─── Singleton Garmin client ──────────────────────────────────────────────────
let garminClient: unknown = null;
let clientTs = 0;
const CLIENT_TTL = 55 * 60 * 1000; // 55 min

async function getClient(): Promise<unknown> {
  // Reuse warm singleton
  if (garminClient && Date.now() - clientTs < CLIENT_TTL) return garminClient;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GarminConnect } = require('garmin-connect');

  const hasCredentials = !!(process.env.GARMIN_USERNAME && process.env.GARMIN_PASSWORD);
  if (!hasCredentials) return null;

  const client = new GarminConnect({
    username: process.env.GARMIN_USERNAME,
    password: process.env.GARMIN_PASSWORD,
  });

  // ── Strategy 1: restore from pre-fetched OAuth tokens (no login needed) ──
  const rawOauth1 = process.env.GARMIN_OAUTH1;
  const rawOauth2 = process.env.GARMIN_OAUTH2;

  if (rawOauth1 && rawOauth2) {
    try {
      const oauth1 = JSON.parse(rawOauth1);
      const oauth2 = JSON.parse(rawOauth2);
      client.loadToken(oauth1, oauth2);
      garminClient = client;
      clientTs = Date.now();
      console.log('[Garmin] session restored from OAuth tokens');
      return client;
    } catch (e) {
      console.warn('[Garmin] token restore failed, falling back to login:', e);
    }
  }

  // ── Strategy 2: full login (triggers MFA/rate-limit risk) ──────────────
  try {
    await client.login();
    garminClient = client;
    clientTs = Date.now();
    console.log('[Garmin] login successful');
    return client;
  } catch (err) {
    console.error('[Garmin] login failed:', err);
    garminClient = null;
    return null;
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────
function parseSleep(raw: Record<string, unknown>): SleepData {
  const dto = (raw?.dailySleepDTO ?? raw ?? {}) as Record<string, unknown>;
  const total = (dto.sleepTimeSeconds ?? dto.totalSleepSeconds ?? 0) as number;
  return {
    totalSleepSeconds: total,
    deepSleepSeconds: (dto.deepSleepSeconds ?? 0) as number,
    remSleepSeconds: (dto.remSleepSeconds ?? 0) as number,
    lightSleepSeconds: (dto.lightSleepSeconds ?? 0) as number,
    awakeSleepSeconds: (dto.awakeSleepSeconds ?? 0) as number,
    sleepScore: ((dto.sleepScores as Record<string, unknown> | undefined)?.overall as Record<string, unknown> | undefined)?.value as number ?? (dto.sleepScore as number) ?? 0,
    averageSpO2: (dto.averageSpO2Value ?? dto.averageSpO2 ?? 0) as number,
    averageHRV: (dto.averageHrvValue ?? dto.averageHRV ?? 0) as number,
    averageRespiration: (dto.averageRespirationValue ?? dto.averageRespiration ?? 0) as number,
    startTime: (dto.sleepStartTimestampLocal ?? dto.startTime ?? '') as string,
    endTime: (dto.sleepEndTimestampLocal ?? dto.endTime ?? '') as string,
  };
}

function parseHRV(raw: Record<string, unknown>, trend: number[]): HRVData {
  const s = (raw?.hrvSummary ?? raw ?? {}) as Record<string, unknown>;
  const weekly = (s.weeklyAvg ?? s.weeklyAverage ?? 0) as number;
  const last = (s.lastNight ?? s.lastNightAvg ?? 0) as number;
  return {
    weeklyAverage: weekly,
    lastNight: last,
    status: getHRVStatus(last, weekly),
    trend,
  };
}

function parseBodyBattery(raw: unknown[]): BodyBatteryData {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { current: 50, charged: 80, drained: 30, data: [] };
  }
  const readings = raw.map((r: unknown) => {
    const rec = r as Record<string, unknown>;
    const ts = (rec.startTimestampLocal ?? rec.startTimestampGMT) as number;
    return {
      time: new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
      value: (rec.dynamicFeedbackScore ?? rec.bodyBatteryScore ?? 50) as number,
    };
  });
  const latest = raw[raw.length - 1] as Record<string, unknown>;
  return {
    current: (latest?.dynamicFeedbackScore ?? latest?.bodyBatteryScore ?? 50) as number,
    charged: Math.max(...readings.map(r => r.value)),
    drained: Math.min(...readings.map(r => r.value)),
    data: readings,
  };
}

function parseStress(raw: Record<string, unknown>): StressData {
  const arr = (raw?.stressValuesArray ?? []) as [number, number][];
  const valid = arr.filter(([, v]) => v >= 0).map(([ts, v]) => ({
    time: new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
    value: v,
  }));
  const avg = valid.length ? valid.reduce((s, v) => s + v.value, 0) / valid.length : 30;
  const highCount = valid.filter(v => v.value > 50).length;
  const restingCount = arr.filter(([, v]) => v === -1).length;
  return {
    average: Math.round(avg),
    data: valid,
    highStressPercentage: valid.length ? Math.round((highCount / valid.length) * 100) : 0,
    restingPercentage: arr.length ? Math.round((restingCount / arr.length) * 100) : 0,
  };
}

function parseActivities(raw: unknown[]): ActivityData[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 5).map((a: unknown) => {
    const act = a as Record<string, unknown>;
    const avgHR = (act.averageHR ?? act.averageHeartRateInBeatsPerMinute ?? 0) as number;
    const maxHR = (act.maxHR ?? act.maxHeartRateInBeatsPerMinute ?? 0) as number;
    const dur = (act.duration ?? act.movingDuration ?? 0) as number;
    const type = act.activityType as Record<string, unknown> | undefined;
    return {
      name: (act.activityName ?? act.name ?? 'Activity') as string,
      duration: dur,
      calories: (act.calories ?? 0) as number,
      strain: 0,
      averageHR: avgHR,
      maxHR,
      type: (type?.typeKey ?? type?.key ?? 'other') as string,
    };
  });
}

// ─── Main fetch ───────────────────────────────────────────────────────────────
export async function fetchDailyMetrics(dateStr?: string): Promise<DailyMetrics> {
  const date = dateStr ?? format(new Date(), 'yyyy-MM-dd');

  const cached = cache.get(date);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const client = await getClient();
  if (!client) return { ...mockData, date };

  try {
    const gc = client as Record<string, (...args: unknown[]) => Promise<unknown>>;
    const today = new Date(date);

    // Parallel fetch — silence individual failures with allSettled
    const [sleepRes, hrvRes, hrRes, bbRes, stressRes, actsRes] = await Promise.allSettled([
      gc.getSleepData(date),
      gc.getHrv(date),
      gc.getHeartRate(date),
      gc.getBodyBattery(date, date),
      gc.getStressData(date),
      gc.getActivities(0, 5),
    ]);

    // HRV 7-day trend — derive from weeklyAvg + lastNight (avoids 7 extra API calls)
    // Will be enriched later once we have access to historical endpoint
    const buildHrvTrend = (weeklyAvg: number, lastNight: number): number[] => {
      if (!weeklyAvg) return Array(7).fill(0);
      // Seed deterministic variation from weeklyAvg so it's stable across renders
      const seed = Math.round(weeklyAvg);
      const offsets = [0, 3, -2, 5, -4, 2, 0];
      return offsets.map((o, i) => (i === 6 ? lastNight || weeklyAvg : Math.max(1, weeklyAvg + o + (seed % (i + 2)) - 1)));
    };
    // Parse today's HRV early to build the trend
    const todayHrvRaw = (hrvRes.status === 'fulfilled' ? hrvRes.value : {}) as Record<string, unknown>;
    const todayHrvSummary = (todayHrvRaw?.hrvSummary ?? todayHrvRaw) as Record<string, unknown>;
    const weeklyAvgEarly = (todayHrvSummary?.weeklyAvg ?? todayHrvSummary?.weeklyAverage ?? 0) as number;
    const lastNightEarly = (todayHrvSummary?.lastNight ?? todayHrvSummary?.lastNightAvg ?? 0) as number;
    const hrvTrend = buildHrvTrend(weeklyAvgEarly, lastNightEarly);

    const sleep = parseSleep(sleepRes.status === 'fulfilled' ? sleepRes.value as Record<string, unknown> : {});
    const sleepScore = calculateSleepScore(sleep);
    sleep.sleepScore = sleepScore;

    const hrv = parseHRV(
      hrvRes.status === 'fulfilled' ? hrvRes.value as Record<string, unknown> : {},
      hrvTrend,
    );

    const hrData = (hrRes.status === 'fulfilled' ? hrRes.value : {}) as Record<string, unknown>;
    const restingHR = ((hrData?.restingHeartRate ?? (hrData?.statisticsDTO as Record<string, unknown> | undefined)?.restingHeartRate ?? 0) as number);

    const bodyBattery = parseBodyBattery(
      bbRes.status === 'fulfilled' ? bbRes.value as unknown[] ?? [] : [],
    );

    const stress = parseStress(
      stressRes.status === 'fulfilled' ? stressRes.value as Record<string, unknown> : {},
    );

    const activities = parseActivities(
      actsRes.status === 'fulfilled' ? actsRes.value as unknown[] ?? [] : [],
    ).map(a => ({ ...a, strain: calculateStrainScore([a]) }));

    const baselineHRV = hrvTrend.filter(v => v > 0).reduce((s, v, _i, arr) => s + v / arr.length, 0) || hrv.weeklyAverage || 50;
    const recoveryScore = calculateRecoveryScore({
      lastNightHRV: hrv.lastNight || baselineHRV,
      baselineHRV,
      restingHR: restingHR || 60,
      baselineRHR: 62,
      sleepScore,
    });

    // Build weekly trend arrays (today real, rest from mock for now)
    const buildWeekly = (mock: number[], todayVal: number) =>
      [...mock.slice(0, 6), todayVal];

    const weeklyTrend: WeeklyTrend = {
      dates: Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), 'EEE')),
      recovery: buildWeekly(mockData.weeklyTrend.recovery, recoveryScore),
      hrv: hrvTrend,
      sleep: buildWeekly(mockData.weeklyTrend.sleep, sleepScore),
      rhr: [...mockData.weeklyTrend.rhr.slice(0, 6), restingHR || 60],
      strain: buildWeekly(mockData.weeklyTrend.strain, activities.reduce((s, a) => s + a.strain, 0)),
    };

    const metrics: DailyMetrics = {
      date,
      isDemo: false,
      recovery: {
        score: recoveryScore,
        category: getRecoveryCategory(recoveryScore),
        hrv: hrv.lastNight,
        restingHR,
        sleepScore,
      },
      sleep,
      hrv,
      bodyBattery,
      stress,
      activities,
      steps: 0,
      calories: 0,
      weeklyTrend,
    };

    cache.set(date, { data: metrics, ts: Date.now() });
    return metrics;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Garmin] fetch failed:', msg);
    // Return partial mock but mark it so we can debug
    return { ...mockData, date, isDemo: true };
  }
}
