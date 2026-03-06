'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame } from 'lucide-react';
import type { DailyMetrics } from '@/lib/types';
import StrainCard from '@/components/StrainCard';
import BottomNav from '@/components/BottomNav';
import TrendSparkline from '@/components/ui/TrendSparkline';

export default function StrainPage() {
  const [data, setData] = useState<DailyMetrics | null>(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setData);
  }, []);

  const todayStrain = data?.activities.reduce((s, a) => s + a.strain, 0) ?? 0;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Flame size={16} className="text-strain" />
          <h1 className="text-sm font-bold text-primary">Esfuerzo</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
        {data ? (
          <>
            <StrainCard activities={data.activities} todayStrain={todayStrain} />
            <div className="card">
              <div className="card-header mb-4">
                <Flame size={14} className="text-strain" />
                <span>Esfuerzo 7 días</span>
              </div>
              <TrendSparkline
                data={data.weeklyTrend.strain}
                labels={data.weeklyTrend.dates}
                color="#fb923c"
                height={80}
              />
            </div>
          </>
        ) : (
          <div className="animate-pulse bg-surface rounded-2xl h-64" />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
