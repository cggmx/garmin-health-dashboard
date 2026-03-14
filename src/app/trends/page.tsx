'use client';

import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Loader2, FileDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { DailyMetrics, TrendPoint } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import TrendSparkline from '@/components/ui/TrendSparkline';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import { calculateMedian, getCategoryColor } from '@/lib/scoring';
import { useProfile } from '@/lib/useProfile';
import { useLang } from '@/lib/i18n';

type Range = 7 | 30 | 90;

// ── PDF export ─────────────────────────────────────────────────────────────────
async function exportWeeklyPDF(data: DailyMetrics) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const pad = 14;
  const col = (W - pad * 2) / 2;
  let y = 20;

  const BG   = [8,   8,   8]   as [number, number, number];
  const SURF = [17,  17,  17]  as [number, number, number];
  const PRIM = [250, 250, 250] as [number, number, number];
  const SEC  = [160, 160, 160] as [number, number, number];
  const GRN  = [74,  222, 128] as [number, number, number];
  const PRP  = [192, 132, 252] as [number, number, number];
  const SKY  = [56,  189, 248] as [number, number, number];
  const IND  = [129, 140, 248] as [number, number, number];

  doc.setFillColor(...BG);
  doc.rect(0, 0, W, 297, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PRIM);
  doc.text('Resumen Semanal', pad, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SEC);
  const today = new Date();
  const from  = new Date(today); from.setDate(today.getDate() - 6);
  const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  doc.text(`${fmt(from)} – ${fmt(today)} · Garmin Health Dashboard`, pad, y);
  y += 2;

  doc.setDrawColor(31, 31, 31);
  doc.setLineWidth(0.4);
  doc.line(pad, y + 4, W - pad, y + 4);
  y += 10;

  const card = (
    x: number, cy: number, w: number, h: number,
    label: string, value: string, unit: string,
    color: [number, number, number], series: number[],
  ) => {
    doc.setFillColor(...SURF);
    doc.roundedRect(x, cy, w, h, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SEC);
    doc.text(label.toUpperCase(), x + 4, cy + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...color);
    doc.text(value, x + 4, cy + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SEC);
    doc.text(unit, x + 4 + doc.getTextWidth(value) + 1.5, cy + 17);

    const valid = series.filter(v => v > 0);
    if (valid.length > 1) {
      const sx = x + 4; const sy = cy + h - 10;
      const sw = w - 8; const sh = 8;
      const mn = Math.min(...valid); const mx = Math.max(...valid);
      const range = mx - mn || 1;
      const pts = series.map((v, i) => [
        sx + (i / (series.length - 1)) * sw,
        sy + sh - ((v - mn) / range) * sh,
      ]);
      doc.setDrawColor(...color);
      doc.setLineWidth(0.6);
      for (let i = 1; i < pts.length; i++) {
        doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      }
    }
  };

  const t = data.weeklyTrend;
  const avgArr = (arr: number[]) => {
    const v = arr.filter(x => x > 0);
    return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : 0;
  };

  const cw = col - 2; const ch = 38;
  const ORG: [number, number, number] = [251, 146, 60];

  card(pad,       y, cw, ch, 'Recuperación', String(avgArr(t.recovery)),       '%',    GRN, t.recovery);
  card(pad + col, y, cw, ch, 'HRV',          String(avgArr(t.hrv)),            'ms',   PRP, t.hrv);
  y += ch + 4;
  card(pad,       y, cw, ch, 'Sueño',        avgArr(t.sleepHours).toFixed(1),  'h',    IND, t.sleepHours);
  card(pad + col, y, cw, ch, 'FC Reposo',    String(avgArr(t.rhr)),            'bpm',  SKY, t.rhr);
  y += ch + 4;
  card(pad, y, W - pad * 2, ch, 'Esfuerzo diario', avgArr(t.strain).toFixed(1), '/ 21', ORG, t.strain);
  y += ch + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PRIM);
  doc.text('Desglose diario', pad, y);
  y += 6;

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const colW = (W - pad * 2) / 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...SEC);
  days.forEach((d, i) => doc.text(d, pad + i * colW + colW / 2, y, { align: 'center' }));
  y += 5;

  const rows = [
    { label: 'Recup %',  data: t.recovery,   color: GRN, fmt: (v: number) => String(Math.round(v)) },
    { label: 'HRV ms',   data: t.hrv,         color: PRP, fmt: (v: number) => String(Math.round(v)) },
    { label: 'Sueño h',  data: t.sleepHours,  color: IND, fmt: (v: number) => v.toFixed(1) },
    { label: 'FCR',      data: t.rhr,         color: SKY, fmt: (v: number) => String(Math.round(v)) },
    { label: 'Esf.',     data: t.strain,      color: ORG, fmt: (v: number) => v.toFixed(1) },
  ];

  rows.forEach(row => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...SEC);
    doc.text(row.label, pad - 1, y, { align: 'right' });
    row.data.slice(0, 7).forEach((v, i) => {
      doc.setTextColor(...(v > 0 ? row.color : SEC));
      doc.text(v > 0 ? row.fmt(v) : '–', pad + i * colW + colW / 2, y, { align: 'center' });
    });
    y += 6;
  });

  y += 6;
  doc.setDrawColor(31, 31, 31);
  doc.line(pad, y, W - pad, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...SEC);
  doc.text('Garmin Health Dashboard · Datos obtenidos de Garmin Connect', pad, y);
  doc.text(new Date().toLocaleString('es-ES'), W - pad, y, { align: 'right' });

  doc.save(`resumen-semanal-${today.toISOString().slice(0, 10)}.pdf`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildDateLabels(days: number): string[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(today, days - 1 - i);
    return days === 7 ? format(d, 'EEE', { locale: es }) : format(d, 'd/M');
  });
}

function computeStats(series: number[]) {
  const v = series.filter(x => x > 0);
  if (!v.length) return { avg: 0, min: 0, max: 0, delta: 0 };
  const avg = v.reduce((s, x) => s + x, 0) / v.length;
  const min = Math.min(...v);
  const max = Math.max(...v);
  // delta: first half avg vs second half avg
  const mid = Math.ceil(v.length / 2);
  const first = v.slice(0, mid);
  const last  = v.slice(mid);
  const aFirst = first.reduce((s, x) => s + x, 0) / first.length;
  const aLast  = last.length ? last.reduce((s, x) => s + x, 0) / last.length : aFirst;
  const delta  = ((aLast - aFirst) / (aFirst || 1)) * 100;
  return { avg, min, max, delta };
}

const RANGE_OPTIONS: Range[] = [7, 30, 90];

interface RowData {
  label: string;
  unit: string;
  color: string;
  series: number[];
  decimals: number;
  higherIsBetter: boolean; // true for recovery/hrv/sleep; false for rhr
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const { t } = useLang();
  const { profile } = useProfile();
  const [data,         setData]         = useState<DailyMetrics | null>(null);
  const [range,        setRange]        = useState<Range>(7);
  const [trendPoints,  setTrendPoints]  = useState<TrendPoint[] | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [pdfLoading,   setPdfLoading]   = useState(false);

  useEffect(() => {
    const localDate = format(new Date(), 'yyyy-MM-dd');
    fetch(`/api/health?date=${localDate}`).then(r => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (range === 7) { setTrendPoints(null); return; }
    setTrendLoading(true);
    setTrendPoints(null);
    const localDate = format(new Date(), 'yyyy-MM-dd');
    fetch(`/api/trends?range=${range}&date=${localDate}`)
      .then(r => r.json())
      .then((pts: TrendPoint[]) => { setTrendPoints(pts); setTrendLoading(false); })
      .catch(() => setTrendLoading(false));
  }, [range]);

  const buildRows = (): RowData[] => {
    if (range === 7 && data) {
      const avgRec = Math.round(data.weeklyTrend.recovery.reduce((s, v) => s + v, 0) / 7);
      return [
        { label: t('trends.recovery'), unit: '%',   color: getCategoryColor(avgRec), series: data.weeklyTrend.recovery,  decimals: 0, higherIsBetter: true  },
        { label: t('trends.hrv'),      unit: 'ms',  color: '#c084fc',                series: data.weeklyTrend.hrv,        decimals: 0, higherIsBetter: true  },
        { label: t('trends.sleep'),    unit: 'h',   color: '#818cf8',                series: data.weeklyTrend.sleepHours, decimals: 1, higherIsBetter: true  },
        { label: t('trends.rhr'),      unit: 'bpm', color: '#38bdf8',                series: data.weeklyTrend.rhr,        decimals: 0, higherIsBetter: false },
        { label: t('trends.strain'),   unit: '/21', color: '#fb923c',                series: data.weeklyTrend.strain,     decimals: 1, higherIsBetter: false },
      ];
    }
    if (trendPoints && trendPoints.length > 0) {
      return [
        { label: t('trends.recovery'), unit: '%',   color: '#4ade80', series: trendPoints.map(p => p.recovery),   decimals: 0, higherIsBetter: true  },
        { label: t('trends.hrv'),      unit: 'ms',  color: '#c084fc', series: trendPoints.map(p => p.hrv),        decimals: 0, higherIsBetter: true  },
        { label: t('trends.sleep'),    unit: 'h',   color: '#818cf8', series: trendPoints.map(p => p.sleepHours), decimals: 1, higherIsBetter: true  },
        { label: t('trends.rhr'),      unit: 'bpm', color: '#38bdf8', series: trendPoints.map(p => p.rhr),        decimals: 0, higherIsBetter: false },
        { label: t('trends.strain'),   unit: '/21', color: '#fb923c', series: trendPoints.map(p => p.strain),     decimals: 1, higherIsBetter: false },
      ];
    }
    return [];
  };

  const rows  = buildRows();
  const dates = buildDateLabels(range);
  const isLoading = range === 7 ? !data : trendLoading;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <TrendingUp size={16} className="text-secondary" />
          <h1 className="text-sm font-bold text-primary">{t('trends.title')}</h1>
          {data && (
            <button
              onClick={async () => {
                setPdfLoading(true);
                try { await exportWeeklyPDF(data); } finally { setPdfLoading(false); }
              }}
              disabled={pdfLoading}
              className="ml-auto flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors disabled:opacity-50"
            >
              {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              {t('trends.pdf')}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">

        {/* ── Range selector ─────────────────────────────────────────── */}
        <div className="flex gap-1.5 p-1 bg-surface rounded-xl border border-border">
          {RANGE_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r ? 'bg-bg border border-border text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>

        {/* ── AI Summary — only for 7d ───────────────────────────────── */}
        {range === 7 && data && (
          <WeeklySummaryCard trend={data.weeklyTrend} profile={profile} />
        )}

        {/* ── Loading skeleton ───────────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-24 bg-border rounded animate-pulse" />
                  <div className="h-3 w-16 bg-border rounded animate-pulse" />
                </div>
                <div className="h-16 bg-border rounded animate-pulse" />
              </div>
            ))}
            {range > 7 && (
              <div className="flex items-center justify-center gap-2 text-xs text-secondary">
                <Loader2 size={13} className="animate-spin" />
                {t('trends.fetchingData', { range })}
              </div>
            )}
          </div>
        )}

        {/* ── Metric cards ───────────────────────────────────────────── */}
        {!isLoading && rows.map((row) => {
          const p50 = calculateMedian(row.series);
          const { avg, min, max, delta } = computeStats(row.series);
          const avgDisplay = row.decimals === 1 ? avg.toFixed(1) : String(Math.round(avg));
          const minDisplay = row.decimals === 1 ? min.toFixed(1) : String(Math.round(min));
          const maxDisplay = row.decimals === 1 ? max.toFixed(1) : String(Math.round(max));

          // Delta: positive delta is "good" for higherIsBetter metrics, "bad" for others
          const isPositiveTrend = row.higherIsBetter ? delta > 3 : delta < -3;
          const isNegativeTrend = row.higherIsBetter ? delta < -3 : delta > 3;
          const deltaAbs = Math.abs(Math.round(delta));

          return (
            <div key={row.label} className="card">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-secondary uppercase tracking-widest">
                    {row.label}
                  </span>
                  {/* Delta badge */}
                  {deltaAbs >= 3 && (
                    <span
                      className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        color: isPositiveTrend ? '#4ade80' : isNegativeTrend ? '#f87171' : '#9ca3af',
                        backgroundColor: isPositiveTrend ? '#4ade8018' : isNegativeTrend ? '#f8717118' : '#9ca3af18',
                      }}
                    >
                      {isPositiveTrend
                        ? <ArrowUpRight size={9} />
                        : isNegativeTrend
                        ? <ArrowDownRight size={9} />
                        : <Minus size={9} />}
                      {deltaAbs}%
                    </span>
                  )}
                </div>
                {/* Avg value */}
                <span
                  className="text-xl font-black leading-none"
                  style={{ color: row.color }}
                >
                  {avgDisplay}
                  <span className="text-xs font-normal text-muted ml-0.5">{row.unit}</span>
                </span>
              </div>

              {/* Min / Max row */}
              <div className="flex gap-3 mb-3">
                <div className="flex items-center gap-1 text-[10px] text-muted">
                  <span className="text-secondary">{t('trends.min')}</span>
                  <span className="font-semibold text-primary">{minDisplay}{row.unit}</span>
                </div>
                <div className="w-px bg-border" />
                <div className="flex items-center gap-1 text-[10px] text-muted">
                  <span className="text-secondary">{t('trends.max')}</span>
                  <span className="font-semibold text-primary">{maxDisplay}{row.unit}</span>
                </div>
                <div className="w-px bg-border" />
                <div className="flex items-center gap-1 text-[10px] text-muted">
                  <span className="text-secondary">{t('trends.p50')}</span>
                  <span className="font-semibold" style={{ color: row.color }}>
                    {row.decimals === 1 ? p50.toFixed(1) : String(p50)}{row.unit}
                  </span>
                </div>
              </div>

              {/* Sparkline */}
              <TrendSparkline
                data={row.series}
                labels={dates}
                color={row.color}
                height={56}
                referenceValue={p50}
                referenceLabel="p50"
              />

              {/* Date range */}
              <div className="flex justify-between mt-1.5 text-[10px] text-muted">
                <span>{dates[0]}</span>
                <span>{dates[dates.length - 1]}</span>
              </div>
            </div>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}
