#!/usr/bin/env node
/**
 * Guards against the class of bug that crashes a release binary but never shows
 * up in Expo Go, in a typecheck, or in a test.
 *
 * Two checks:
 *
 * 1. Native package versions against what this Expo SDK actually ships.
 *    A package on the wrong major links fine and builds fine, then dies at
 *    startup with NoSuchMethodError when it calls into a native API that does
 *    not exist in the linked expo-modules-core. That is exactly what happened
 *    with expo-font 57.0.1 against SDK 54: expo-modules-core 3.0.30 has no
 *    getDirectConverter, so the app crashed before the first frame.
 *
 * 2. Asset extensions against actual file bytes.
 *    Metro sniffs content, so a JPEG named .png works everywhere in development.
 *    AAPT2 trusts the extension, so the same file fails the release build with
 *    "file failed to compile". Six of ours were JPEGs named .png.
 *
 * Run before every build. `npm run check:native`.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const problems = [];

// ---------------------------------------------------------------------------
// 1. Native module versions
// ---------------------------------------------------------------------------

const bundled = require(path.join(root, 'node_modules/expo/bundledNativeModules.json'));

/** "~14.0.12" and "14.0.12" both reduce to "14". */
const major = (v) => String(v).replace(/^[~^><= ]+/, '').split('.')[0];

function installedVersion(name) {
  try {
    return require(path.join(root, 'node_modules', name, 'package.json')).version;
  } catch {
    return null;
  }
}

function everyInstalledPackage() {
  const names = [];
  for (const entry of fs.readdirSync(path.join(root, 'node_modules'))) {
    if (entry.startsWith('.')) continue;
    if (entry.startsWith('@')) {
      const scopeDir = path.join(root, 'node_modules', entry);
      if (!fs.statSync(scopeDir).isDirectory()) continue;
      for (const sub of fs.readdirSync(scopeDir)) names.push(`${entry}/${sub}`);
    } else {
      names.push(entry);
    }
  }
  return names;
}

for (const name of everyInstalledPackage()) {
  const expected = bundled[name];
  if (!expected) continue;
  const actual = installedVersion(name);
  if (!actual) continue;
  if (major(actual) !== major(expected)) {
    problems.push(
      `${name} is on the wrong major: installed ${actual}, this SDK ships ${expected}. ` +
        `Pin it in package.json and reinstall.`,
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Asset extensions against real bytes
// ---------------------------------------------------------------------------

function sniff(buf) {
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  const head = buf.slice(0, 6).toString('latin1');
  if (head === 'GIF87a' || head === 'GIF89a') return 'gif';
  return 'unknown';
}

const assetsDir = path.join(root, 'assets');
if (fs.existsSync(assetsDir)) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = path.extname(entry.name).slice(1).toLowerCase().replace('jpeg', 'jpg');
      if (!['png', 'jpg', 'webp', 'gif'].includes(ext)) continue;

      const actual = sniff(fs.readFileSync(full, { length: 32 }) ?? fs.readFileSync(full));
      if (actual !== 'unknown' && actual !== ext) {
        problems.push(
          `${path.relative(root, full)} is really a ${actual.toUpperCase()} named .${ext}. ` +
            `AAPT2 will refuse it in a release build. Re-encode or rename it.`,
        );
      }
    }
  };
  walk(assetsDir);
}

// ---------------------------------------------------------------------------

if (problems.length === 0) {
  console.log('Native versions and asset formats are consistent.');
  process.exit(0);
}

console.error('\nProblems that would break a release build:\n');
for (const p of problems) console.error(`  - ${p}`);
console.error('');
process.exit(1);
