#!/usr/bin/env node
/**
 * Run this script ONCE locally to get long-lived Garmin OAuth tokens.
 * Then add GARMIN_OAUTH1 and GARMIN_OAUTH2 to your Vercel env vars.
 *
 * Usage (reads from env or prompts):
 *   GARMIN_USERNAME=you@email.com GARMIN_PASSWORD=secret node scripts/get-garmin-tokens.js
 *
 * Or just:
 *   node scripts/get-garmin-tokens.js
 *   (will prompt for username and password)
 */

const { GarminConnect } = require('garmin-connect');
const readline = require('readline');

// Try to load .env.local manually (no dotenv dependency needed)
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
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function main() {
  let user = process.env.GARMIN_USERNAME;
  let pass = process.env.GARMIN_PASSWORD;

  if (!user) user = await prompt('Garmin username (email): ');
  if (!pass) pass = await prompt('Garmin password: ', true);

  if (!user || !pass) {
    console.error('❌  Username and password are required');
    process.exit(1);
  }

  console.log(`\n🔐  Logging in as ${user}...`);
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
    console.error('❌  Could not extract OAuth tokens after login. Try again.');
    process.exit(1);
  }

  const o1 = JSON.stringify(oauth1);
  const o2 = JSON.stringify(oauth2);

  console.log('\n✅  Tokens obtained! Running these commands to add them to Vercel...\n');

  // Add tokens to Vercel automatically
  const { execSync } = require('child_process');
  try {
    execSync(`echo '${o1}' | npx vercel env add GARMIN_OAUTH1 production --force`, {
      stdio: 'inherit',
      cwd: require('path').join(__dirname, '..'),
    });
    execSync(`echo '${o2}' | npx vercel env add GARMIN_OAUTH2 production --force`, {
      stdio: 'inherit',
      cwd: require('path').join(__dirname, '..'),
    });
    console.log('\n✅  GARMIN_OAUTH1 and GARMIN_OAUTH2 added to Vercel!');
    console.log('⚠️   Refresh tokens expire in ~90 days — re-run this script then.\n');
    console.log('Now deploying to apply the new env vars...');
    execSync('npx vercel --prod --scope cggmxs-projects', {
      stdio: 'inherit',
      cwd: require('path').join(__dirname, '..'),
    });
    console.log('\n🎉  Done! Visit https://garmin-heatlth.vercel.app to see real data.\n');
  } catch (e) {
    console.log('\n⚠️  Auto-add failed. Add manually:\n');
    console.log('GARMIN_OAUTH1 value:');
    console.log(o1);
    console.log('\nGARMIN_OAUTH2 value:');
    console.log(o2);
    console.log('\nThen run: npx vercel --prod --scope cggmxs-projects');
  }
}

main().catch(console.error);
