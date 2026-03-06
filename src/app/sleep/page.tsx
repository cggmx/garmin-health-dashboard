'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Moon } from 'lucide-react';
import type { DailyMetrics } from '@/lib/types';
import SleepCard from '@/components/SleepCard';
import BottomNav from '@/components/BottomNav';
import TrendSparkline from '@/components/ui/TrendSparkline';

export default function SleepPage() {
  const [data, setData] = useState<DailyMetrics | null>(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setData);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Moon size={16} className="text-sleep" />
          <h1 className="text-sm font-bold text-primary">Sueño</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
        {data ? (
          <>
            <SleepCard sleep={data.sleep} />
            <div className="card">
              <div className="card-header mb-4">
                <Moon size={14} className="text-sleep" />
                <span>Sueño 7 días</span>
              </div>
              <TrendSparkline
                data={data.weeklyTrend.sleep}
                labels={data.weeklyTrend.dates}
                color="#818cf8"
                height={80}
              />
              <div className="flex justify-between mt-2 text-xs text-secondary">
                {data.weeklyTrend.dates.map((d, i) => (
                  <span key={i} className="text-center">
                    <span className="block text-muted">{d}</span>
                    <span className="text-primary font-medium">{data.weeklyTrend.sleep[i]}%</span>
                  </span>
                ))}
              </div>
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
