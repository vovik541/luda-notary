// Builds the public design-preview site for Cloudflare Workers Static Assets.
// Usage: npm run build:preview   (Node 20+, no dependencies)
//
// Output: dist/design-preview/
//   index.html, 404.html, robots.txt, _headers, thumbs/   ← from preview/
//   concept-0X-*/  (*.html, *.css only)                  ← from design-exploration/
//   assets/…  only the files the pages actually reference ← from design-exploration/assets/
// Generators, reports, screenshots, validation logs and source images are never copied.
import { rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'design-exploration');
const shell = join(root, 'preview');
const out = join(root, 'dist', 'design-preview');

const CONCEPTS = [
  'concept-01-editorial', 'concept-02-modern', 'concept-03-warm', 'concept-04-modern-premium',
  'concept-05-clarity-first', 'concept-06-contemporary-editorial', 'concept-07-dual-expertise', 'concept-08-service-first',
];
const NOINDEX = /<meta name="robots" content="noindex, nofollow">/;

const fail = (msg) => { console.error(`build:preview failed: ${msg}`); process.exit(1); };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. Gallery shell
for (const f of ['index.html', '404.html', 'robots.txt', '_headers']) copyFileSync(join(shell, f), join(out, f));
mkdirSync(join(out, 'thumbs'));
for (const f of readdirSync(join(shell, 'thumbs'))) copyFileSync(join(shell, 'thumbs', f), join(out, 'thumbs', f));

// 2. Concepts: HTML and CSS only. Forms get a no-op action so they can never submit, even without JavaScript.
const pages = [];
for (const c of CONCEPTS) {
  const dir = join(src, c);
  if (!existsSync(join(dir, 'index.html'))) fail(`missing ${c}/index.html`);
  mkdirSync(join(out, c));
  for (const f of readdirSync(dir)) {
    if (!/\.(html|css)$/.test(f)) continue;
    let text = readFileSync(join(dir, f), 'utf8');
    if (f.endsWith('.html')) {
      if (!NOINDEX.test(text)) fail(`${c}/${f} has no noindex meta`);
      text = text.replace(/<form(?![^>]*\saction=)([^>]*)>/g, '<form action="javascript:void(0)"$1>');
      // Drop production-planning comments and social metadata: this is a review preview, not the production site.
      text = text.replace(/<!-- (Production plan|Planned route):[^>]*-->\n?/g, '').replace(/<meta property="og:[^"]+" content="[^"]*">\n?/g, '');
      pages.push(join(out, c, f));
    }
    writeFileSync(join(out, c, f), text);
  }
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
const queue = [join(out, 'index.html'), join(out, '404.html'), ...pages, ...CONCEPTS.flatMap((c) => readdirSync(join(out, c)).filter((f) => f.endsWith('.css')).map((f) => join(out, c, f)))];
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
console.log(`  concepts: ${CONCEPTS.length} · pages: ${pages.length + 2} · assets: ${copied.size} · size: ${(bytes(out) / 1024 / 1024).toFixed(2)} MB`);
