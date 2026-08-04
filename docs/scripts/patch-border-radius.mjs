/**
 * patch-border-radius.mjs
 * Replaces all border-radius Tailwind classes and inline style values
 * with 0px / rounded-none across all .tsx, .ts, .css, .astro files in src/
 * and inside node_modules/@blocknote (patched in place).
 *
 * Run: node scripts/patch-border-radius.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Tailwind rounded class replacements ───────────────────────────────────────
// Order matters — longest/most-specific first so we don't partially replace
const TAILWIND_REPLACEMENTS = [
  // Arbitrary values
  [/\brounded-\[[\w.%]+\]/g, 'rounded-none'],
  // Directional + size combos (e.g. rounded-tl-xl, rounded-b-lg)
  [/\brounded-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee)-(?:none|sm|md|lg|xl|2xl|3xl|full|\d+)/g, 'rounded-none'],
  // Size variants
  [/\brounded-(?:sm|md|lg|xl|2xl|3xl|full)/g, 'rounded-none'],
  // Plain rounded (no suffix)
  [/\brounded(?!-none)(?=[\s"'`\)])/g, 'rounded-none'],
];

// ── Inline style replacements ─────────────────────────────────────────────────
const STYLE_REPLACEMENTS = [
  // borderRadius: '...' or borderRadius: "..."
  [/borderRadius\s*:\s*['"][^'"]+['"]/g, "borderRadius: '0px'"],
  // border-radius: ...px / em / rem / % (CSS)
  [/border-radius\s*:\s*[^;{]+;/g, 'border-radius: 0px;'],
  // --radius: ...
  [/--radius\s*:\s*[^;{]+;/g, '--radius: 0rem;'],
  // --scalar-radius variants
  [/--scalar-radius[^:]*\s*:\s*[^;{]+;/g, '--scalar-radius: 0px;'],
];

// ── File glob targets ─────────────────────────────────────────────────────────
const SRC_DIRS = [
  join(ROOT, 'src'),
];

const BLOCKNOTE_DIR = join(ROOT, 'node_modules', '@blocknote');
const SCALAR_DIR = join(ROOT, 'node_modules', '@scalar');

const SRC_EXTENSIONS = new Set(['.tsx', '.ts', '.css', '.astro', '.mjs', '.js']);
const NODE_EXTENSIONS = new Set(['.css', '.js', '.mjs']);

let totalFiles = 0;
let patchedFiles = 0;

function patchFile(filePath, extensions) {
  const ext = extname(filePath);
  if (!extensions.has(ext)) return;

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }

  let patched = content;

  // Apply Tailwind class replacements (src only — not node_modules css)
  if (extensions === SRC_EXTENSIONS) {
    for (const [pattern, replacement] of TAILWIND_REPLACEMENTS) {
      patched = patched.replace(pattern, replacement);
    }
  }

  // Apply inline style replacements everywhere
  for (const [pattern, replacement] of STYLE_REPLACEMENTS) {
    patched = patched.replace(pattern, replacement);
  }

  if (patched !== content) {
    writeFileSync(filePath, patched, 'utf-8');
    patchedFiles++;
    console.log(`  ✓ ${filePath.replace(ROOT, '.')}`);
  }

  totalFiles++;
}

function walkDir(dir, extensions, maxDepth = 10, depth = 0) {
  if (depth > maxDepth) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    // Skip common large/irrelevant dirs
    if (['dist', '.git', '__pycache__', '.cache', 'test', 'tests', '__tests__', 'coverage'].includes(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      walkDir(full, extensions, maxDepth, depth + 1);
    } else {
      patchFile(full, extensions);
    }
  }
}

console.log('\n🔧 Patching border radius...\n');

console.log('── src/ (Tailwind classes + inline styles)');
for (const dir of SRC_DIRS) {
  walkDir(dir, SRC_EXTENSIONS);
}

console.log('\n── @blocknote (CSS + JS inline styles)');
if (statSync(BLOCKNOTE_DIR).isDirectory()) {
  walkDir(BLOCKNOTE_DIR, NODE_EXTENSIONS, 8);
} else {
  console.log('  (not found, skipping)');
}

console.log('\n── @scalar (CSS + JS inline styles)');
try {
  if (statSync(SCALAR_DIR).isDirectory()) {
    walkDir(SCALAR_DIR, NODE_EXTENSIONS, 8);
  }
} catch {
  console.log('  (not found, skipping)');
}

console.log(`\n✅ Done. Patched ${patchedFiles} / ${totalFiles} files scanned.\n`);
