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

    // Try OAuth tokens first (no login needed)
    const rawOauth1 = process.env.GARMIN_OAUTH1;
    const rawOauth2 = process.env.GARMIN_OAUTH2;
    let loginMethod = 'password';

    if (rawOauth1 && rawOauth2) {
      try {
        const oauth1 = JSON.parse(rawOauth1);
        const oauth2 = JSON.parse(rawOauth2);
        client.loadToken(oauth1, oauth2);
        loginMethod = 'oauth_token';
        results.login = { ok: true, ms: 0, method: loginMethod };
      } catch {
        const loginStart = Date.now();
        await client.login();
        results.login = { ok: true, ms: Date.now() - loginStart, method: loginMethod };
      }
    } else {
      const loginStart = Date.now();
      await client.login();
      results.login = { ok: true, ms: Date.now() - loginStart, method: loginMethod };
    }

    const date = format(new Date(), 'yyyy-MM-dd');
    const today = new Date(date);
    const GC_API = 'https://connectapi.garmin.com';
    results.date = date;

    const gc = client as Record<string, (...args: unknown[]) => Promise<unknown>>;

    // Test each endpoint
    const endpoints: [string, () => Promise<unknown>][] = [
      ['sleep', () => gc.getSleepData(today)],
      ['hrv', () => gc.get(`${GC_API}/hrv-service/hrv/daily/${date}`)],
      ['heartRate', () => gc.getHeartRate(today)],
      ['bodyBattery', () => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/event/${date}`)],
      ['stress', () => gc.get(`${GC_API}/wellness-service/wellness/dailyStress/${date}`)],
      ['activities', () => gc.getActivities(0, 5)],
      ['steps', () => gc.getSteps(today)],
    ];

    for (const [name, fn] of endpoints) {
      const start = Date.now();
      try {
        const data = await fn();
        results[name] = {
          ok: true,
          ms: Date.now() - start,
          keys: data && typeof data === 'object' ? Object.keys(data as object).slice(0, 10) : data,
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
