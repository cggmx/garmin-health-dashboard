'use client';

import { useState, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLang } from '@/lib/i18n';
import { Scale, TrendingDown, TrendingUp, Minus, Trash2, Plus } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useWeightLog } from '@/lib/useWeightLog';
import { getWeightBenchmark } from '@/lib/benchmarks';
import type { UserProfile } from '@/lib/types';

interface Props {
  profile: UserProfile | null;
}

function linearRegressionSlope(points: { date: string; weight: number }[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  const x0 = new Date(points[0].date).getTime();
  const xs = points.map(p => (new Date(p.date).getTime() - x0) / 86400000);
  const ys = points.map(p => p.weight);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  return den === 0 ? 0 : num / den; // kg/day
}

export default function WeightLog({ profile }: Props) {
  const { t } = useLang();
  const { entries, addEntry, removeEntry, loaded } = useWeightLog();
  const [range, setRange] = useState<number>(30); // 30 | 90 | 0 (0 = all)
  const [inputDate, setInputDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [inputWeight, setInputWeight] = useState('');

  const wb = profile ? getWeightBenchmark(profile) : null;

  // Goal weight for reference line
  const goalWeight = useMemo(() => {
    if (!wb || !profile?.weightGoal) return null;
    if (profile.weightGoal === 'lose') return wb.idealMax;
    if (profile.weightGoal === 'gain') return wb.idealMin;
    return Math.round((wb.idealMin + wb.idealMax) / 2 * 10) / 10;
  }, [wb, profile]);

  // Filter by range
  const visible = useMemo(() => {
    if (!range) return entries;
    const cutoff = format(subDays(new Date(), range), 'yyyy-MM-dd');
    return entries.filter(e => e.date >= cutoff);
  }, [entries, range]);

  // Chart data
  const chartData = visible.map(e => ({
    date: e.date,
    label: format(parseISO(e.date), 'd/M'),
    weight: e.weight,
  }));

  // Stats
  const first = entries[0];
  const last = entries[entries.length - 1];
  const totalChange = first && last && first.date !== last.date
    ? Math.round((last.weight - first.weight) * 10) / 10
    : null;

  // Weekly trend from linear regression on visible range
  const slopePerDay = linearRegressionSlope(visible);
  const slopePerWeek = Math.round(slopePerDay * 7 * 100) / 100;

  // Y-axis domain
  const weights = visible.map(e => e.weight);
  if (goalWeight) weights.push(goalWeight);
  const minY = weights.length ? Math.floor(Math.min(...weights) - 1.5) : 50;
  const maxY = weights.length ? Math.ceil(Math.max(...weights) + 1.5) : 100;

  const handleAdd = () => {
    const w = parseFloat(inputWeight);
    if (!inputDate || isNaN(w) || w < 20 || w > 400) return;
    addEntry(inputDate, Math.round(w * 10) / 10);
    setInputWeight('');
  };

  if (!loaded) return null;

  const historyEntries = [...entries].reverse().slice(0, 7);

  const slopeColor = slopePerWeek < -0.05 ? '#4ade80' : slopePerWeek > 0.05 ? '#facc15' : '#6b7280';

  return (
    <div className="card">
      <div className="card-header mb-4">
        <Scale size={14} className="text-sky-400" />
        <span>{t('weightLog.title')}</span>
        {visible.length >= 2 && (
          <span className="ml-auto text-xs font-semibold flex items-center gap-1" style={{ color: slopeColor }}>
            {slopePerWeek < -0.05 ? <TrendingDown size={11} /> :
             slopePerWeek > 0.05 ? <TrendingUp size={11} /> :
             <Minus size={11} />}
            {slopePerWeek > 0 ? '+' : ''}{slopePerWeek} {t('weightLog.ratePerWeek')}
          </span>
        )}
      </div>

      {/* Quick log form */}
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={inputDate}
          onChange={e => setInputDate(e.target.value)}
          className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-primary/50"
        />
        <input
          type="number"
          value={inputWeight}
          onChange={e => setInputWeight(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="kg"
          step="0.1"
          min="20"
          max="400"
          className="w-20 bg-bg border border-border rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-primary/50 text-center"
        />
        <button
          onClick={handleAdd}
          disabled={!inputWeight}
          className="px-3 py-2 rounded-xl bg-sky-400/10 text-sky-400 text-xs font-semibold border border-sky-400/20 hover:bg-sky-400/20 transition-colors disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Stats row */}
      {entries.length >= 1 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-bg rounded-xl p-2 text-center border border-border">
            <p className="text-[10px] text-muted mb-0.5">{t('weightLog.start')}</p>
            <p className="text-sm font-bold text-primary">
              {first?.weight} <span className="text-[10px] font-normal text-muted">kg</span>
            </p>
          </div>
          <div className="bg-bg rounded-xl p-2 text-center border border-border">
            <p className="text-[10px] text-muted mb-0.5">{t('weightLog.current')}</p>
            <p className="text-sm font-bold text-primary">
              {last?.weight} <span className="text-[10px] font-normal text-muted">kg</span>
            </p>
          </div>
          <div className="bg-bg rounded-xl p-2 text-center border border-border">
            <p className="text-[10px] text-muted mb-0.5">{t('weightLog.totalChange')}</p>
            <p
              className="text-sm font-bold"
              style={{
                color: totalChange === null
                  ? '#6b7280'
                  : totalChange < 0 ? '#4ade80'
                  : totalChange > 0 ? '#facc15'
                  : '#e5e7eb',
              }}
            >
              {totalChange === null ? '—' : `${totalChange > 0 ? '+' : ''}${totalChange}`}{' '}
              <span className="text-[10px] font-normal text-muted">kg</span>
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 ? (
        <>
          {/* Range tabs */}
          <div className="flex gap-1 mb-3">
            {[30, 90, 0].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                style={{
                  backgroundColor: range === r ? '#38bdf422' : 'transparent',
                  color: range === r ? '#38bdf4' : '#6b7280',
                  fontWeight: range === r ? 600 : 400,
                }}
              >
                {r === 0 ? t('weightLog.all') : `${r}d`}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis domain={[minY, maxY]} hide />
              {goalWeight !== null && (
                <ReferenceLine
                  y={goalWeight}
                  stroke="#4ade80"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  border: '1px solid #1f1f1f',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#38bdf8' }}
                formatter={(v: number) => [`${v} kg`, t('weightLog.weightLabel')]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#38bdf8', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#38bdf8' }}
              />
            </LineChart>
          </ResponsiveContainer>

          {goalWeight !== null && (
            <p className="text-[10px] text-muted text-center mt-1">
              {t('weightLog.goalLine', { goal: goalWeight })}
            </p>
          )}
        </>
      ) : entries.length === 1 ? (
        <p className="text-xs text-muted text-center py-4">
          {t('weightLog.needMoreData')}
        </p>
      ) : (
        <p className="text-xs text-muted text-center py-4">
          {t('weightLog.empty')}
        </p>
      )}

      {/* History */}
      {historyEntries.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
            {t('weightLog.recentHistory')}
          </p>
          <div className="flex flex-col gap-1">
            {historyEntries.map(e => (
              <div key={e.date} className="flex items-center py-1 text-xs gap-2">
                <span className="text-secondary flex-1">
                  {format(parseISO(e.date), "d 'de' MMMM", { locale: es })}
                </span>
                <span className="text-primary font-semibold">{e.weight} kg</span>
                <button
                  onClick={() => removeEntry(e.date)}
                  className="text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
