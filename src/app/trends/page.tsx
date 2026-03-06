'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import type { DailyMetrics } from '@/lib/types';
import WeeklyTrend from '@/components/WeeklyTrend';
import BottomNav from '@/components/BottomNav';

export default function TrendsPage() {
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
          <TrendingUp size={16} className="text-secondary" />
          <h1 className="text-sm font-bold text-primary">Tendencias</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4">
        {data ? (
          <WeeklyTrend trend={data.weeklyTrend} />
        ) : (
          <div className="animate-pulse bg-surface rounded-2xl h-96" />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
