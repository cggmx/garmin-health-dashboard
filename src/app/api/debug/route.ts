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

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GarminConnect } = require('garmin-connect');
    const client = new GarminConnect({
      username: process.env.GARMIN_USERNAME,
      password: process.env.GARMIN_PASSWORD,
    });

    const rawOauth1 = process.env.GARMIN_OAUTH1;
    const rawOauth2 = process.env.GARMIN_OAUTH2;
    let loginMethod = 'password';

    if (rawOauth1 && rawOauth2) {
      try {
        client.loadToken(JSON.parse(rawOauth1), JSON.parse(rawOauth2));
        loginMethod = 'oauth_token';
      } catch {
        await client.login();
      }
    } else {
      await client.login();
    }

    const date = format(new Date(), 'yyyy-MM-dd');
    const today = new Date(date);
    const GC_API = 'https://connectapi.garmin.com';
    const gc = client as Record<string, (...args: unknown[]) => Promise<unknown>>;

    // ── Helper ─────────────────────────────────────────────────────────────────
    const probe = async (fn: () => Promise<unknown>) => {
      const start = Date.now();
      try {
        const data = await fn();
        const json = JSON.stringify(data);
        return {
          ok: true, ms: Date.now() - start,
          keys: data && typeof data === 'object' ? Object.keys(data as object).slice(0, 12) : typeof data,
          preview: json.slice(0, 300),
        };
      } catch (e: unknown) {
        return { ok: false, ms: Date.now() - start, error: (e as Error)?.message ?? String(e) };
      }
    };

    // ── Get displayName (fast) ─────────────────────────────────────────────────
    let displayName = '';
    try {
      const p = await gc.getUserProfile() as Record<string, unknown>;
      displayName = (p.displayName ?? '') as string;
    } catch { /* ignore */ }

    // ── Run ALL probes in PARALLEL ─────────────────────────────────────────────
    const [
      sleepR, hrvR, hrR, stressR, actsR, stepsR,
      bb1R, bb2R, bb3R, bb4R, bb5R, bb6R, bb7R, summaryR,
    ] = await Promise.all([
      probe(() => gc.getSleepData(today)),
      probe(() => gc.get(`${GC_API}/hrv-service/hrv/${date}`)),
      probe(() => gc.getHeartRate(today)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/dailyStress/${date}`)),
      probe(() => gc.getActivities(0, 5)),
      probe(() => gc.getSteps(today)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/event/${date}/${date}`)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/reading/${date}`)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/${date}`)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/dailyBodyBattery/${displayName}?startDate=${date}&endDate=${date}`)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/${displayName}?startDate=${date}&endDate=${date}`)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery?displayName=${displayName}&date=${date}`)),
      probe(() => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/event?startDate=${date}&endDate=${date}`)),
      probe(() => gc.get(`${GC_API}/usersummary-service/usersummary/daily/${displayName}?calendarDate=${date}`)),
    ]);

    return NextResponse.json({
      status: 'ok',
      date,
      loginMethod,
      displayName,
      sleep: sleepR,
      hrv: hrvR,
      heartRate: hrR,
      stress: stressR,
      activities: actsR,
      steps: stepsR,
      bb_event: bb1R,
      bb_reading: bb2R,
      bb_flat: bb3R,
      bb_daily_named: bb4R,
      bb_named_startend: bb5R,
      bb_query: bb6R,
      bb_event_query: bb7R,
      usersummary: summaryR,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      status: 'login_failed',
      error: (err as Error)?.message ?? String(err),
    });
  }
}
