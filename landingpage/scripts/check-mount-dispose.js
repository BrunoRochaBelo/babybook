#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const featuresDir = path.join(root, 'src', 'features');

const tsExt = ['.ts', '.tsx', '.js', '.jsx'];
const missed = [];

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      walk(full);
      continue;
    }
    const ext = path.extname(f.name);
    if (!tsExt.includes(ext)) continue;
    // Skip test and storybook files
    if (full.endsWith('.spec.ts') || full.endsWith('.test.ts') || full.endsWith('.stories.tsx')) continue;

    const content = fs.readFileSync(full, 'utf8');
    // Allow developers to opt-out of the check by adding this comment
    if (content.includes('@no-check-mount-dispose')) continue;
    if (!hasMountOrSetupExport(content)) {
      missed.push(path.relative(root, full));
    }
  }
}

function hasMountOrSetupExport(content) {
  // Basic heuristic checks for named exports `setup...`, `mount...` or `init...`
  const patterns = [
    /export\s+function\s+\w*(?:setup|mount|init)\w*\s*\(/,
    /export\s+(?:const|let)\s+\w*(?:setup|mount|init)\w*\s*=\s*/,
    /export\s+default\s+function\s+.*(?:setup|mount|init)/,
    /export\s+\{\s*\w*(?:setup|mount|init)\w*\s*\}/,
  ];
  if (patterns.some((re) => re.test(content))) return true;

  // fallback: check if file exports any binding and contains 'setup' / 'mount' / 'init' word
  const hasExport = /export\s+(?:const|let|function|default|{)/.test(content);
  const hasAnyKeyword = /\b(setup|mount|init)\b/.test(content);
  return hasExport && hasAnyKeyword;
}

try {
  if (!fs.existsSync(featuresDir)) {
    console.log('No features directory found, skipping mount/dispose check.');
    process.exit(0);
  }
  walk(featuresDir);
  if (missed.length > 0) {
    console.error('\nThe following feature files do not export a `setup*` or `mount*` function:');
    for (const f of missed) console.error(' - ' + f);
    console.error('\nPlease follow the mount/dispose pattern and export a `setup*` or `mount*` function that returns a cleanup function.');
    process.exit(1);
  }
  console.log('All feature files export `setup*` or `mount*` functions.');
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(2);
}
