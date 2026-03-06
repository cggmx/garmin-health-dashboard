import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

  // Try to login
  try {
    const { GarminConnect } = require('garmin-connect');
    const client = new GarminConnect({
      username: process.env.GARMIN_USERNAME,
      password: process.env.GARMIN_PASSWORD,
    });
    await client.login();
    return NextResponse.json({ status: 'ok', message: 'Login successful' });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({
      status: 'login_failed',
      error: error?.message ?? String(err),
    });
  }
}
