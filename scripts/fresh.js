/* eslint-disable no-console */
const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Kill Metro, clear its caches, start clean.
 *
 * Metro snapshots node_modules when it boots. Installing a package underneath a
 * running dev server leaves a half-updated file map, and the failure looks
 * exactly like a broken library: "Unable to resolve X" for a package that is
 * sitting right there on disk. Ctrl+C often leaves the process holding 8081,
 * so --clear alone does not save you.
 *
 * Rule: after any install, run `npm run fresh`.
 */

const isWindows = process.platform === 'win32';

function killPort(port) {
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = new Set(
        out
          .split('\n')
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid) && pid !== '0'),
      );
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`  killed process ${pid} on port ${port}`);
        } catch {
          /* already gone */
        }
      }
    } else {
      execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'ignore' });
    }
  } catch {
    console.log(`  nothing listening on ${port}`);
  }
}

function removeDir(relative) {
  const target = path.join(__dirname, '..', relative);
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`  removed ${relative}`);
}

console.log('Stopping any running Metro...');
killPort(8081);
killPort(8082);

console.log('Clearing caches...');
removeDir('.expo');
removeDir('node_modules/.cache');

console.log('Starting Expo with a cold cache...\n');
spawn(isWindows ? 'npx.cmd' : 'npx', ['expo', 'start', '--clear'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
