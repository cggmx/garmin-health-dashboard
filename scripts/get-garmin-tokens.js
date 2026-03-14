#!/usr/bin/env node
/**
 * Run this script ONCE locally to get long-lived Garmin OAuth tokens.
 * Supports accounts with MFA (email verification code) enabled.
 *
 * Then add GARMIN_OAUTH1 and GARMIN_OAUTH2 to your Vercel env vars.
 *
 * Usage (reads from .env.local or prompts interactively):
 *   node scripts/get-garmin-tokens.js
 */

const readline = require('readline');
const FormData = require('form-data');

// ── Load .env.local ──────────────────────────────────────────────────────────
try {
  const fs = require('fs');
  const envPath = require('path').join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
  }
} catch (_) { /* ignore */ }

// ── Prompt helper ────────────────────────────────────────────────────────────
async function prompt(question, hidden = false) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (hidden && process.stdout.isTTY) {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    return new Promise(resolve => {
      let input = '';
      process.stdin.on('data', (ch) => {
        ch = ch.toString();
        if (ch === '\r' || ch === '\n') {
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (ch === '\u0003') {
          process.exit();
        } else if (ch === '\u007f') {
          input = input.slice(0, -1);
        } else {
          input += ch;
        }
      });
      process.stdin.resume();
    });
  }
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// ── Patch garmin-connect to support MFA ─────────────────────────────────────
// The library has handleMFA() as an empty stub. We capture the MFA HTML here,
// then complete the OAuth flow manually after prompting the user for the code.
let capturedMfaHtml = null;

function patchMfaHandler() {
  try {
    const HttpClientModule = require('garmin-connect/dist/common/HttpClient');
    const Ctor = HttpClientModule.HttpClient || Object.values(HttpClientModule).find(v => v?.prototype?.handleMFA);
    if (Ctor) {
      Ctor.prototype.handleMFA = function (htmlStr) {
        // Detect MFA page by looking for the email code input field
        if (
          /name=["']?(mfa|verificationCode|code|otpCode)["']?/i.test(htmlStr) ||
          /MFA|verification code|enter.*code|código/i.test(htmlStr)
        ) {
          capturedMfaHtml = htmlStr;
        }
      };
    }
  } catch (_) { /* ignore — patch is best-effort */ }
}

// ── Complete OAuth flow after MFA submission ─────────────────────────────────
async function completeMfaLogin(httpClient, mfaHtml) {
  const TICKET_RE = /ticket=([^"]+)"/;

  // Parse form action URL from the MFA page
  const actionMatch = mfaHtml.match(/action="([^"]+)"/);
  const mfaUrl = actionMatch
    ? actionMatch[1].replace(/&amp;/g, '&')
    : 'https://sso.garmin.com/sso/verifyMFA/loginEnterMfaCode';

  // Parse CSRF token
  const csrfMatch = mfaHtml.match(/name=["']?_csrf["']?\s+value="([^"]+)"/);
  if (!csrfMatch) throw new Error('Could not find CSRF token in MFA page. Please open a GitHub issue.');

  // Detect field name (mfa / verificationCode / etc.)
  const fieldMatch = mfaHtml.match(/name=["']?(mfa|verificationCode|code|otpCode)["']?/i);
  const fieldName = fieldMatch ? fieldMatch[1] : 'mfa';

  // Prompt user for the email code
  const mfaCode = await prompt('\n📧  Check your email for the Garmin verification code: ');
  if (!mfaCode) throw new Error('No verification code entered.');

  // Build and POST the MFA form using the same axios session (has cookies)
  const form = new FormData();
  form.append(fieldName, mfaCode.trim());
  form.append('_csrf', csrfMatch[1]);
  form.append('embed', 'true');
  form.append('fromPage', 'setupPasswordPage');

  const referer = httpClient.url
    ? (httpClient.url.SIGNIN_URL || 'https://sso.garmin.com/sso/signin')
    : 'https://sso.garmin.com/sso/signin';

  const response = await httpClient.client.post(mfaUrl, form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://sso.garmin.com',
      Referer: referer,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    },
    maxRedirects: 5,
  });

  const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  const ticketMatch = TICKET_RE.exec(html);
  if (!ticketMatch) {
    throw new Error(
      'MFA code rejected or expired — please try again.\n' +
      'If the code is correct, Garmin may require you to temporarily disable ' +
      '2-factor authentication to use this script.'
    );
  }

  const ticket = ticketMatch[1];
  console.log('  MFA accepted ✓');

  // Complete the standard OAuth flow
  const oauth1 = await httpClient.getOauth1Token(ticket);
  await httpClient.exchange(oauth1);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  patchMfaHandler();

  const { GarminConnect } = require('garmin-connect');

  let user = process.env.GARMIN_USERNAME;
  let pass = process.env.GARMIN_PASSWORD;

  if (!user) user = await prompt('Garmin username (email): ');
  if (!pass) pass = await prompt('Garmin password: ', true);

  if (!user || !pass) {
    console.error('❌  Username and password are required');
    process.exit(1);
  }

  const client = new GarminConnect({ username: user, password: pass });
  const httpClient = client.client; // internal HttpClient instance

  console.log(`\n🔐  Logging in as ${user}...`);

  try {
    await client.login();
    console.log('  Login successful (no MFA required) ✓');
  } catch (err) {
    // Check if MFA was triggered
    if (capturedMfaHtml) {
      console.log('  MFA required — checking your email code...');
      try {
        await completeMfaLogin(httpClient, capturedMfaHtml);
      } catch (mfaErr) {
        console.error('\n❌  MFA flow failed:', mfaErr.message);
        console.error('\nTroubleshooting:');
        console.error('  1. Make sure you enter the code quickly (it expires in ~5 min)');
        console.error('  2. Alternatively, temporarily disable 2FA in your Garmin account,');
        console.error('     run this script, then re-enable it.');
        process.exit(1);
      }
    } else {
      console.error('\n❌  Login failed:', err.message);
      console.error('\nCheck your username and password and try again.');
      process.exit(1);
    }
  }

  // Extract tokens
  const oauth1 = httpClient.oauth1Token;
  const oauth2 = httpClient.oauth2Token;

  if (!oauth1 || !oauth2) {
    console.error('❌  Could not extract OAuth tokens after login. Try again.');
    process.exit(1);
  }

  const o1 = JSON.stringify(oauth1);
  const o2 = JSON.stringify(oauth2);

  console.log('\n✅  Tokens obtained!\n');

  // Try to add tokens to Vercel automatically
  const { execSync } = require('child_process');
  try {
    console.log('Adding GARMIN_OAUTH1 to Vercel...');
    execSync(`echo '${o1}' | npx vercel env add GARMIN_OAUTH1 production --force`, {
      stdio: 'inherit',
      cwd: require('path').join(__dirname, '..'),
    });
    console.log('Adding GARMIN_OAUTH2 to Vercel...');
    execSync(`echo '${o2}' | npx vercel env add GARMIN_OAUTH2 production --force`, {
      stdio: 'inherit',
      cwd: require('path').join(__dirname, '..'),
    });
    console.log('\n✅  GARMIN_OAUTH1 and GARMIN_OAUTH2 added to Vercel!');
    console.log('⚠️   Tokens expire in ~90 days — re-run this script then.\n');
    console.log('Deploying to apply the new env vars...');
    execSync('npx vercel --prod', {
      stdio: 'inherit',
      cwd: require('path').join(__dirname, '..'),
    });
    console.log('\n🎉  Done! Your dashboard should now show real Garmin data.\n');
  } catch (_) {
    // Auto-add failed — print manually
    console.log('⚠️  Could not add to Vercel automatically. Add these manually:\n');
    console.log('In Vercel → Project → Settings → Environment Variables:\n');
    console.log('  Name : GARMIN_OAUTH1');
    console.log('  Value:', o1);
    console.log('\n  Name : GARMIN_OAUTH2');
    console.log('  Value:', o2);
    console.log('\nOr via CLI:');
    console.log(`  echo '${o1}' | npx vercel env add GARMIN_OAUTH1 production`);
    console.log(`  echo '${o2}' | npx vercel env add GARMIN_OAUTH2 production`);
    console.log('\nThen redeploy: npx vercel --prod\n');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
