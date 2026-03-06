export interface SleepData {
  totalSleepSeconds: number;
  deepSleepSeconds: number;
  remSleepSeconds: number;
  lightSleepSeconds: number;
  awakeSleepSeconds: number;
  sleepScore: number;
  averageSpO2: number;
  averageHRV: number;
  averageRespiration: number;
  startTime: string;
  endTime: string;
}

export interface HRVData {
  weeklyAverage: number;
  lastNight: number;
  status: 'balanced' | 'unbalanced' | 'poor';
  trend: number[];
}

export interface BodyBatteryData {
  current: number;
  charged: number;
  drained: number;
  data: Array<{ time: string; value: number }>;
}

export interface StressData {
  average: number;
  data: Array<{ time: string; value: number }>;
  highStressPercentage: number;
  restingPercentage: number;
}

export interface ActivityData {
  name: string;
  duration: number;
  calories: number;
  strain: number;
  averageHR: number;
  maxHR: number;
  type: string;
}

export interface RecoveryData {
  score: number;
  category: 'green' | 'yellow' | 'red';
  hrv: number;
  restingHR: number;
  sleepScore: number;
}

export interface WeeklyTrend {
  dates: string[];
  recovery: number[];
  hrv: number[];
  sleep: number[];
  rhr: number[];
  strain: number[];
}

export interface DailyMetrics {
  date: string;
  isDemo: boolean;
  recovery: RecoveryData;
  sleep: SleepData;
  hrv: HRVData;
  bodyBattery: BodyBatteryData;
  stress: StressData;
  activities: ActivityData[];
  steps: number;
  calories: number;
  weeklyTrend: WeeklyTrend;
}
