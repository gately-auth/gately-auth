/**
 * patch-primary-color-props.mjs
 *
 * Replaces primaryColor prop pass-throughs with the theme-aware expression.
 * Components that receive isDark already have the correct value from the
 * previous patch. This script fixes the remaining prop callsites.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src', 'components');

// Replace prop callsites where isDark IS in scope (component level)
// We wrap the value so the child gets the right color
const REPLACEMENTS = [
  // primaryColor={config.primary_color}  →  primaryColor={isDark ? '#ffffff' : '#000000'}
  [/primaryColor=\{config\.primary_color\}/g, "primaryColor={isDark ? '#ffffff' : '#000000'}"],
];

let patched = 0, scanned = 0;

function patchFile(fp) {
  if (extname(fp) !== '.tsx') return;
  let content; try { content = readFileSync(fp, 'utf-8'); } catch { return; }
  let out = content;
  for (const [p, r] of REPLACEMENTS) out = out.replace(p, r);
  scanned++;
  if (out !== content) {
    writeFileSync(fp, out, 'utf-8');
    patched++;
    console.log(`  ✓ ${fp.replace(ROOT, '.')}`);
  }
}

function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (['node_modules','dist','.git'].includes(e)) continue;
    const full = join(dir, e);
    let s; try { s = statSync(full); } catch { continue; }
    s.isDirectory() ? walk(full) : patchFile(full);
  }
}

console.log('\n🎨 Patching primaryColor prop callsites...\n');
walk(SRC);
console.log(`\n✅ Done. Patched ${patched} / ${scanned} files.\n`);
