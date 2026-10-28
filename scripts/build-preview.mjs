// Builds the public design-preview site for Cloudflare Workers Static Assets.
// Usage: npm run build:preview   (Node 20+, no dependencies)
//
// Output: dist/design-preview/
//   index.html, reviews.html, styles.css            ← the final design, from design-exploration/experiment-a3-complete/
//   404.html, robots.txt, _headers                  ← from preview/
//   assets/…  only the files the pages actually reference ← from design-exploration/assets/
// Generators, reports, screenshots, validation logs, source images and earlier design rounds are never copied.
import { rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'design-exploration');
const site = join(src, 'experiment-a3-complete');
const shell = join(root, 'preview');
const out = join(root, 'dist', 'design-preview');

const PAGES = ['index.html', 'reviews.html', 'styles.css'];
const NOINDEX = /<meta name="robots" content="noindex, nofollow">/;

const fail = (msg) => { console.error(`build:preview failed: ${msg}`); process.exit(1); };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. Shell: error page and indexing rules
for (const f of ['404.html', 'robots.txt', '_headers']) copyFileSync(join(shell, f), join(out, f));

// 2. The final design at the site root. Asset paths move up one level; the link back to the
//    local design gallery is dropped; forms get a no-op action so they can never submit, even without JavaScript.
const pages = [];
for (const f of PAGES) {
  if (!existsSync(join(site, f))) fail(`missing experiment-a3-complete/${f}`);
  let text = readFileSync(join(site, f), 'utf8').replaceAll('../assets/', 'assets/');
  if (f.endsWith('.html')) {
    if (!NOINDEX.test(text)) fail(`${f} has no noindex meta`);
    text = text.replace(/<a href="\.\.\/index\.html">[^<]*<\/a>/g, '')
      .replace(/<form(?![^>]*\saction=)([^>]*)>/g, '<form action="javascript:void(0)"$1>');
    pages.push(join(out, f));
  }
  writeFileSync(join(out, f), text);
}

// 3. Assets: copy only what HTML/CSS reference (follows CSS @import and url()).
const assetRoot = join(src, 'assets');
const copied = new Set();
const refsIn = (file) => {
  const text = readFileSync(file, 'utf8');
  const refs = [];
  for (const m of text.matchAll(/(?:href|src|content)="([^"]+)"/g)) refs.push(m[1]);
  for (const m of text.matchAll(/srcset="([^"]+)"/g)) m[1].split(',').forEach((s) => refs.push(s.trim().split(/\s+/)[0]));
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.push(m[1]);
  return refs.filter((r) => !/^(https?:|mailto:|tel:|sms:|data:|javascript:|#)/.test(r)).map((r) => r.split(/[?#]/)[0]).filter(Boolean);
};
const queue = [join(out, '404.html'), ...pages, join(out, 'styles.css')];
while (queue.length) {
  const file = queue.shift();
  for (const ref of refsIn(file)) {
    const target = ref.startsWith('/') ? join(out, ref) : resolve(dirname(file), ref);
    const rel = relative(out, target);
    if (!rel.startsWith(`assets${sep}`) || copied.has(rel)) continue;
    const from = join(assetRoot, rel.slice('assets'.length + 1));
    if (!existsSync(from) || !statSync(from).isFile()) fail(`referenced asset not found: ${rel} (from ${relative(out, file)})`);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(from, target);
    copied.add(rel);
    if (target.endsWith('.css')) queue.push(target);
  }
}

const bytes = (p) => readdirSync(p, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? bytes(join(p, e.name)) : statSync(join(p, e.name)).size), 0);
console.log(`design preview built: ${relative(root, out)}`);
console.log(`  pages: ${pages.length + 1} · assets: ${copied.size} · size: ${(bytes(out) / 1024 / 1024).toFixed(2)} MB`);
