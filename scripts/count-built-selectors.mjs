#!/usr/bin/env node
/** Rough selector count: `.`, `#`, and type selectors before `{` in built CSS. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssDir = path.join(root, '.next/static/chunks');
let css = '';
if (fs.existsSync(cssDir)) {
  for (const ent of fs.readdirSync(cssDir, { withFileTypes: true })) {
    if (ent.isFile() && ent.name.endsWith('.css')) {
      css += fs.readFileSync(path.join(cssDir, ent.name), 'utf8');
    }
  }
}
if (!css) {
  const alt = path.join(root, '.next/static/css');
  if (fs.existsSync(alt)) {
    for (const ent of fs.readdirSync(alt, { withFileTypes: true })) {
      if (ent.isFile() && ent.name.endsWith('.css')) {
        css += fs.readFileSync(path.join(alt, ent.name), 'utf8');
      }
    }
  }
}
if (!css) {
  console.error('No .next CSS found — run npm run build first');
  process.exit(1);
}
const re = /(?:^|[},])\s*([^{@]+)\{/g;
const set = new Set();
let m;
while ((m = re.exec(css)) !== null) {
  const sel = m[1].trim();
  if (sel && !sel.startsWith('@')) set.add(sel);
}
console.log(JSON.stringify({ rules: set.size, bytes: css.length }));