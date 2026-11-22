#!/usr/bin/env node
/**
 * One-off split of src/app/globals.css → src/styles/*.css (Phase 6a).
 * Preserves every line and order; section boundaries at /* --- and /* =====.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const globalsPath = path.join(root, 'src/app/globals.css');
const stylesDir = path.join(root, 'src/styles');

const src = fs.readFileSync(globalsPath, 'utf8');
const lines = src.split('\n');

/** Byte offsets: lineStarts[i] is the start of 1-based line (i + 1). */
function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}
const starts = lineStarts(src);

function extractLines(firstLine, lastLineInclusive) {
  const from = starts[firstLine - 1];
  const afterLast =
    lastLineInclusive < lines.length ? starts[lastLineInclusive] : src.length;
  return src.slice(from, afterLast);
}

const splitAt = new Set([1, 43]);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^\/\* ---/.test(line)) splitAt.add(i + 1);
  if (/^\/\* =====/.test(line)) splitAt.add(i + 1);
}
const sorted = [...splitAt].sort((a, b) => a - b);

const PHASE_NAMES = [
  [/6B|MOBILE|TOUCH/i, 'mobile-phase-header'],
  [/5D.*GATE|THE GATE/i, 'gate'],
  [/5F.*STATUS/i, 'status'],
  [/5G-C.*CONNECTIONS/i, 'connections-tray'],
];

function slugFromStartLine(startLine) {
  if (startLine === 1) return 'tokens';
  if (startLine === 43) return 'base';
  const line = lines[startLine - 1];
  if (/^\/\* =====/.test(line)) {
    let block = line;
    for (let j = startLine; j < lines.length && !lines[j].includes('*/'); j++) {
      block += ' ' + lines[j];
    }
    for (const [re, name] of PHASE_NAMES) {
      if (re.test(block)) return name;
    }
    return 'phase-block';
  }
  const m = line.match(/^\/\* ---\s+(.+?)\s+-+\s*\*\//);
  if (!m) return `section-${startLine}`;
  let t = m[1].toLowerCase();
  t = t.replace(/\(.*?\)/g, '');
  t = t.replace(/—.*$/, '');
  t = t.replace(/design\.md.*?$/i, '');
  t = t.replace(/phase\s+[\w-]+.*$/gi, '');
  t = t.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const aliases = {
    hud: 'hud',
    intro: 'intro',
    'character-select': 'character-select',
    nameplates: 'nameplates',
    'approach-prompt': 'approach-prompt',
    'profile-panel': 'profile-panel',
    'find-button-hud': 'find-hud',
    'find-overlay-one-solid-dossier-card': 'find',
    'ui-stacking-order': 'ui-stacking',
    'tracking-banner': 'tracking',
    'intro-note': 'intro-note',
    'become-visible-character-creation': 'create',
    'you-card-guest-cta': 'you-card',
    toast: 'toast',
    'invisible-guest-bar-top-centre-an-empty-slot-waiting-for-you':
      'guest-bar',
    'game-cursors-menus-only-the-mouse-is-captured-while-you-play': 'cursors',
    'pause-menu': 'pause',
    'sound-settings-pause-menu': 'pause-sound',
    'body-choice-become-visible-step-1': 'body-choice',
    'portal-where-to-picker': 'portal',
    'travel-transition-panels-wipe-in-title-card-panels-wipe-out': 'travel',
    'phone-basics-no-zoom-bounce-selection-menus-still-scroll': 'mobile-touch-basics',
    'touch-controls': 'mobile-touch-controls',
    'keyboard-only-hints-don-t-belong-on-a-phone': 'mobile-keyboard-hints',
    'phone-layout-portrait-phones-and-landscape-phones-short-screens':
      'mobile-layout',
    'portrait-phones-panels-become-bottom-sheets': 'mobile-portrait-sheets',
    'landscape-phones-side-panels-narrower-and-shorter': 'mobile-landscape',
    connect: 'connect',
    'your-invites': 'invites',
    'connect-stepper-takes-over-the-profile-panel': 'connect-stepper',
    'live-city-who-is-really-here-right-now': 'live',
    '5g-c-chat-chat-cards-in-the-tray-and-the-chat-inside-it': 'chat-tray',
    'day-zero-missions-the-tracker-under-the-location-badge': 'missions',
    'the-you-panel-profile-status-invites': 'you-panel',
  };
  return aliases[t] || t.slice(0, 52) || `section-${startLine}`;
}

const used = new Map();
function fileName(base) {
  const n = used.get(base) || 0;
  used.set(base, n + 1);
  return n === 0 ? `${base}.css` : `${base}-${n}.css`;
}

fs.mkdirSync(stylesDir, { recursive: true });

const chunks = [];
for (let k = 0; k < sorted.length; k++) {
  const startLine = sorted[k];
  const endLineInclusive =
    k + 1 < sorted.length ? sorted[k + 1] - 1 : lines.length;
  const content = extractLines(startLine, endLineInclusive);
  const base = slugFromStartLine(startLine);
  const fname = fileName(base);
  fs.writeFileSync(path.join(stylesDir, fname), content, 'utf8');
  chunks.push({ fname, startLine, endLineInclusive, lines: endLineInclusive - startLine + 1 });
}

const imports = chunks.map((c) => `@import '../styles/${c.fname}';`);
fs.writeFileSync(globalsPath, imports.join('\n') + '\n', 'utf8');

console.log(
  JSON.stringify(
    {
      chunks: chunks.length,
      totalLines: chunks.reduce((s, c) => s + c.lines, 0),
      sourceLines: lines.length,
    },
    null,
    2,
  ),
);