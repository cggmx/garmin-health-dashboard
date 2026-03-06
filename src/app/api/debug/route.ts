import { NextResponse } from 'next/server';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const hasUser = !!process.env.GARMIN_USERNAME;
  const hasPass = !!process.env.GARMIN_PASSWORD;

  if (!hasUser || !hasPass) {
    return NextResponse.json({
      status: 'no_credentials',
      hasUsername: hasUser,
      hasPassword: hasPass,
    });
  }

  const results: Record<string, unknown> = {};

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GarminConnect } = require('garmin-connect');
    const client = new GarminConnect({
      username: process.env.GARMIN_USERNAME,
      password: process.env.GARMIN_PASSWORD,
    });

    const loginStart = Date.now();
    await client.login();
    results.login = { ok: true, ms: Date.now() - loginStart };

    const date = format(new Date(), 'yyyy-MM-dd');
    results.date = date;

    const gc = client as Record<string, (...args: unknown[]) => Promise<unknown>>;

    // Test each endpoint individually
    const endpoints: [string, () => Promise<unknown>][] = [
      ['sleep', () => gc.getSleepData(date)],
      ['hrv', () => gc.getHrv(date)],
      ['heartRate', () => gc.getHeartRate(date)],
      ['bodyBattery', () => gc.getBodyBattery(date, date)],
      ['stress', () => gc.getStressData(date)],
      ['activities', () => gc.getActivities(0, 5)],
    ];

    for (const [name, fn] of endpoints) {
      const start = Date.now();
      try {
        const data = await fn();
        results[name] = {
          ok: true,
          ms: Date.now() - start,
          // Return a sample of the data structure
          keys: data && typeof data === 'object' ? Object.keys(data as object).slice(0, 10) : typeof data,
        };
      } catch (e: unknown) {
        const err = e as Error;
        results[name] = { ok: false, ms: Date.now() - start, error: err?.message ?? String(e) };
      }
    }

    return NextResponse.json({ status: 'ok', results });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({
      status: 'login_failed',
      error: error?.message ?? String(err),
      results,
    });
  }
}
