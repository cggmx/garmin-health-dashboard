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

    // ── Get displayName (needed for some wellness endpoints) ──────────────────
    let displayName = '';
    try {
      const start = Date.now();
      const profile = await gc.getUserProfile();
      const p = profile as Record<string, unknown>;
      displayName = (p.displayName ?? p.userName ?? '') as string;
      results.profile = { ok: true, ms: Date.now() - start, displayName, keys: Object.keys(p).slice(0, 10) };
    } catch (e) {
      results.profile = { ok: false, error: String(e) };
    }

    // ── Helper: probe one endpoint, return ok/error + first 400 chars of JSON ─
    async function probe(label: string, fn: () => Promise<unknown>) {
      const start = Date.now();
      try {
        const data = await fn();
        const json = JSON.stringify(data);
        return {
          ok: true,
          ms: Date.now() - start,
          keys: data && typeof data === 'object' ? Object.keys(data as object).slice(0, 12) : typeof data,
          preview: json.slice(0, 400),
        };
      } catch (e: unknown) {
        const err = e as Error;
        return { ok: false, ms: Date.now() - start, error: err?.message ?? String(e) };
      }
    }

    // ── Standard working endpoints ────────────────────────────────────────────
    results.sleep      = await probe('sleep',      () => gc.getSleepData(today));
    results.heartRate  = await probe('heartRate',  () => gc.getHeartRate(today));
    results.stress     = await probe('stress',     () => gc.get(`${GC_API}/wellness-service/wellness/dailyStress/${date}`));
    results.activities = await probe('activities', () => gc.getActivities(0, 5));
    results.steps      = await probe('steps',      () => gc.getSteps(today));

    // ── HRV URL candidates ────────────────────────────────────────────────────
    results['hrv_v1_hrv-service']         = await probe('hrv_v1', () => gc.get(`${GC_API}/hrv-service/hrv/${date}`));
    results['hrv_v2_daily']               = await probe('hrv_v2', () => gc.get(`${GC_API}/hrv-service/hrv/daily/${date}`));
    results['hrv_v3_wellness']            = await probe('hrv_v3', () => gc.get(`${GC_API}/wellness-service/wellness/hrv/${date}`));
    if (displayName) {
      results['hrv_v4_named_heartRate']   = await probe('hrv_v4', () => gc.get(`${GC_API}/wellness-service/wellness/dailyHeartRate/${displayName}?date=${date}`));
      results['hrv_v5_named_hrv']         = await probe('hrv_v5', () => gc.get(`${GC_API}/hrv-service/hrv/${displayName}/${date}`));
    }

    // ── BodyBattery URL candidates ────────────────────────────────────────────
    results['bb_v1_event']                = await probe('bb_v1', () => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/event/${date}/${date}`));
    results['bb_v2_reading']              = await probe('bb_v2', () => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/reading/${date}`));
    results['bb_v3_flat']                 = await probe('bb_v3', () => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/${date}`));
    if (displayName) {
      results['bb_v4_daily_named']        = await probe('bb_v4', () => gc.get(`${GC_API}/wellness-service/wellness/dailyBodyBattery/${displayName}?startDate=${date}&endDate=${date}`));
      results['bb_v5_named_startend']     = await probe('bb_v5', () => gc.get(`${GC_API}/wellness-service/wellness/bodyBattery/${displayName}?startDate=${date}&endDate=${date}`));
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
