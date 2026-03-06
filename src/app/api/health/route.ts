import { NextRequest, NextResponse } from 'next/server';
import { fetchDailyMetrics } from '@/lib/garmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? undefined;

  try {
    const data = await fetchDailyMetrics(date);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API] /health error:', err);
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
  }
}
