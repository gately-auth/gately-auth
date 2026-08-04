/**
 * patch-brand-color.mjs
 *
 * Replaces all inline style usages of config.primary_color / primaryColor
 * with a CSS variable reference so dark/light mode switching works correctly.
 *
 * Strategy:
 * - Every component already uses `isDark` state
 * - We replace `backgroundColor: config.primary_color` / `color: config.primary_color`
 *   / `backgroundColor: primaryColor` / `color: primaryColor`
 *   with `backgroundColor: isDark ? '#ffffff' : '#000000'`
 *
 * Also adds the import of resolveBrandColor where needed.
 *
 * Run: node scripts/patch-brand-color.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src', 'components');

const REPLACEMENTS = [
  // backgroundColor: config.primary_color
  [/backgroundColor:\s*config\.primary_color/g, "backgroundColor: isDark ? '#ffffff' : '#000000'"],
  // color: config.primary_color
  [/\bcolor:\s*config\.primary_color\b/g, "color: isDark ? '#ffffff' : '#000000'"],
  // background: config.primary_color
  [/background:\s*config\.primary_color/g, "background: isDark ? '#ffffff' : '#000000'"],

  // backgroundColor: primaryColor (prop pattern)
  [/backgroundColor:\s*primaryColor\b/g, "backgroundColor: isDark ? '#ffffff' : '#000000'"],
  // color: primaryColor (prop pattern)
  [/\bcolor:\s*primaryColor\b/g, "color: isDark ? '#ffffff' : '#000000'"],
  // background: primaryColor
  [/background:\s*primaryColor\b/g, "background: isDark ? '#ffffff' : '#000000'"],

  // style={{ backgroundColor: primaryColor }} inline JSX
  [/style=\{\{\s*backgroundColor:\s*primaryColor\s*\}\}/g, "style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }}"],

  // borderColor: config.primary_color
  [/borderColor:\s*config\.primary_color/g, "borderColor: isDark ? '#ffffff' : '#000000'"],
  // borderColor: primaryColor
  [/borderColor:\s*primaryColor\b/g, "borderColor: isDark ? '#ffffff' : '#000000'"],

  // stroke/fill: config.primary_color
  [/stroke:\s*config\.primary_color/g, "stroke: isDark ? '#ffffff' : '#000000'"],
  [/fill:\s*config\.primary_color/g, "fill: isDark ? '#ffffff' : '#000000'"],

  // Template literal: `${config.primary_color}` or `${primaryColor}` with hex suffix e.g. 15, 20
  [/`\$\{config\.primary_color\}([0-9a-f]{2})`/gi, (_, suffix) => `\`\${isDark ? '#ffffff' : '#000000'}${suffix}\``],
  [/`\$\{primaryColor\}([0-9a-f]{2})`/gi, (_, suffix) => `\`\${isDark ? '#ffffff' : '#000000'}${suffix}\``],

  // boxShadow: `0 0 10px ${primaryColor}`
  [/boxShadow:\s*`0 0 10px \$\{primaryColor\}`/g, "boxShadow: `0 0 10px ${isDark ? '#ffffff' : '#000000'}`"],
  [/boxShadow:\s*`0 0 10px \$\{config\.primary_color\}`/g, "boxShadow: `0 0 10px ${isDark ? '#ffffff' : '#000000'}`"],
];

let patched = 0;
let scanned = 0;

function patchFile(filePath) {
  if (extname(filePath) !== '.tsx' && extname(filePath) !== '.ts') return;
  let content;
  try { content = readFileSync(filePath, 'utf-8'); } catch { return; }

  let out = content;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }

  scanned++;
  if (out !== content) {
    writeFileSync(filePath, out, 'utf-8');
    patched++;
    console.log(`  ✓ ${filePath.replace(ROOT, '.')}`);
  }
}

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    if (['node_modules', 'dist', '.git'].includes(e)) continue;
    const full = join(dir, e);
    let s; try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) walk(full);
    else patchFile(full);
  }
}

console.log('\n🎨 Patching brand color references...\n');
walk(SRC);
console.log(`\n✅ Done. Patched ${patched} / ${scanned} files.\n`);
