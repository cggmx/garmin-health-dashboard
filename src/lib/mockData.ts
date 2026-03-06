import { format, subDays } from 'date-fns';
import type { DailyMetrics } from './types';

const today = new Date();

export const mockData: DailyMetrics = {
  date: format(today, 'yyyy-MM-dd'),
  isDemo: true,
  recovery: {
    score: 73,
    category: 'green',
    hrv: 52,
    restingHR: 58,
    sleepScore: 78,
  },
  sleep: {
    totalSleepSeconds: 26100,  // 7h 15m
    deepSleepSeconds: 5220,    // 1h 27m (20%)
    remSleepSeconds: 6900,     // 1h 55m (26%)
    lightSleepSeconds: 12180,  // 3h 23m
    awakeSleepSeconds: 1800,   // 30m
    sleepScore: 78,
    averageSpO2: 96.2,
    averageHRV: 48,
    averageRespiration: 14.1,
    startTime: new Date(today.getTime() - 8.5 * 3600000).toISOString(),
    endTime: new Date(today.getTime() - 0.5 * 3600000).toISOString(),
  },
  hrv: {
    weeklyAverage: 50,
    lastNight: 52,
    status: 'balanced',
    trend: [45, 48, 44, 51, 49, 53, 52],
  },
  bodyBattery: {
    current: 68,
    charged: 82,
    drained: 14,
    data: [
      { time: '00:00', value: 42 },
      { time: '01:00', value: 52 },
      { time: '02:00', value: 62 },
      { time: '03:00', value: 70 },
      { time: '04:00', value: 77 },
      { time: '05:00', value: 82 },
      { time: '06:00', value: 82 },
      { time: '07:00', value: 80 },
      { time: '08:00', value: 74 },
      { time: '09:00', value: 68 },
      { time: '10:00', value: 72 },
      { time: '11:00', value: 65 },
      { time: '12:00', value: 60 },
      { time: '13:00', value: 65 },
      { time: '14:00', value: 58 },
      { time: '15:00', value: 52 },
      { time: '16:00', value: 55 },
      { time: '17:00', value: 62 },
      { time: '18:00', value: 68 },
      { time: '19:00', value: 68 },
    ],
  },
  stress: {
    average: 28,
    data: [
      { time: '06:00', value: 12 },
      { time: '07:00', value: 20 },
      { time: '08:00', value: 42 },
      { time: '09:00', value: 55 },
      { time: '10:00', value: 38 },
      { time: '11:00', value: 45 },
      { time: '12:00', value: 22 },
      { time: '13:00', value: 18 },
      { time: '14:00', value: 35 },
      { time: '15:00', value: 48 },
      { time: '16:00', value: 30 },
      { time: '17:00', value: 25 },
      { time: '18:00', value: 20 },
      { time: '19:00', value: 15 },
    ],
    highStressPercentage: 18,
    restingPercentage: 42,
  },
  activities: [
    {
      name: 'Morning Run',
      duration: 3480,
      calories: 512,
      strain: 13.8,
      averageHR: 151,
      maxHR: 176,
      type: 'running',
    },
  ],
  steps: 8432,
  calories: 2387,
  weeklyTrend: {
    dates: Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), 'EEE')),
    recovery: [65, 45, 72, 81, 58, 69, 73],
    hrv: [48, 42, 51, 55, 47, 50, 52],
    sleep: [75, 68, 82, 79, 65, 72, 78],
    rhr: [60, 62, 58, 57, 61, 59, 58],
    strain: [8.2, 12.5, 6.1, 15.3, 9.8, 7.2, 13.8],
  },
};
