#!/usr/bin/env node
/**
 * Run this script ONCE locally to get long-lived Garmin OAuth tokens.
 * Then add GARMIN_OAUTH1 and GARMIN_OAUTH2 to your Vercel env vars.
 *
 * Usage:
 *   node scripts/get-garmin-tokens.js
 *
 * Or with credentials in env:
 *   GARMIN_USERNAME=you@email.com GARMIN_PASSWORD=secret node scripts/get-garmin-tokens.js
 */

require('dotenv').config({ path: '.env.local' });
const { GarminConnect } = require('garmin-connect');

async function main() {
  const user = process.env.GARMIN_USERNAME;
  const pass = process.env.GARMIN_PASSWORD;

  if (!user || !pass) {
    console.error('❌  GARMIN_USERNAME or GARMIN_PASSWORD not set in .env.local');
    process.exit(1);
  }

  console.log(`🔐  Logging in as ${user}...`);
  const client = new GarminConnect({ username: user, password: pass });

  try {
    await client.login();
  } catch (err) {
    console.error('❌  Login failed:', err.message);
    process.exit(1);
  }

  const oauth1 = client.client.oauth1Token;
  const oauth2 = client.client.oauth2Token;

  if (!oauth1 || !oauth2) {
    console.error('❌  Could not extract OAuth tokens after login');
    process.exit(1);
  }

  const o1 = JSON.stringify(oauth1);
  const o2 = JSON.stringify(oauth2);

  console.log('\n✅  Login successful! Copy these values to Vercel:\n');
  console.log('─'.repeat(70));
  console.log('GARMIN_OAUTH1 =', o1);
  console.log('─'.repeat(70));
  console.log('GARMIN_OAUTH2 =', o2);
  console.log('─'.repeat(70));
  console.log('\n📋  Quick commands to add them to Vercel:');
  console.log(`  echo '${o1}' | npx vercel env add GARMIN_OAUTH1 production`);
  console.log(`  echo '${o2}' | npx vercel env add GARMIN_OAUTH2 production`);
  console.log('\n⚠️   Refresh tokens expire in ~90 days. Re-run this script then.\n');
}

main();
