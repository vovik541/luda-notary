// Focused local checks for dist/design-preview. Usage: npm run check:preview (after build:preview)
// Static checks + a tiny local static server that mimics Workers asset handling (directory index, 404 page).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'design-preview');
const PAGES = ['index.html', 'reviews.html'];
const problems = [];
const ok = (msg) => console.log(`  ok  ${msg}`);
const bad = (msg) => problems.push(msg);

if (!existsSync(out)) { console.error('Run npm run build:preview first.'); process.exit(1); }
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const files = walk(out);
const rel = (f) => relative(out, f).replaceAll('\\', '/');
const html = files.filter((f) => f.endsWith('.html'));
const text = files.filter((f) => /\.(html|css|js|txt)$/.test(f) || f.endsWith('_headers'));

// The final design: home and reviews pages, linked to each other
for (const p of PAGES) if (!existsSync(join(out, p))) bad(`missing ${p}`);
const home = readFileSync(join(out, 'index.html'), 'utf8');
if (!home.includes('href="reviews.html"')) bad('home does not link the reviews page');
if (/concept-0|experiment-|\.\.\//.test(home)) bad('home still points at earlier design rounds or parent folders');
ok(`${PAGES.length} pages present, home links the reviews page`);

// Sensitive or development files
const forbidden = /(\.env|\.dev\.vars|\.md$|\.py$|\.mjs$|\.json$|\.pem$|\.key$|\.map$|Branding Board|qr-code|portrait-original|region-originals|screenshots|_build|validation)/i;
for (const f of files) if (forbidden.test(rel(f))) bad(`should not be published: ${rel(f)}`);
ok(`no sensitive or development files among ${files.length} files`);

// Internal links and assets
let refCount = 0;
for (const f of text.filter((x) => /\.(html|css)$/.test(x))) {
  const t = readFileSync(f, 'utf8');
  const refs = [...t.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1])
    .concat([...t.matchAll(/srcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])))
    .concat([...t.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]));
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|sms:|data:|javascript:|#)/.test(r)) continue;
    const p = r.split(/[?#]/)[0];
    if (!p) continue;
    let target = p.startsWith('/') ? join(out, p) : resolve(dirname(f), p);
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    refCount++;
    if (!existsSync(target)) bad(`broken reference in ${rel(f)}: ${r}`);
  }
}
ok(`${refCount} internal links, images, stylesheets and scripts resolve`);

// Paths, endpoints, indexing
for (const f of text) {
  const t = readFileSync(f, 'utf8');
  if (/file:\/\/|localhost|127\.0\.0\.1|[A-Z]:[\\/](Users|Private)/i.test(t)) bad(`local path or localhost in ${rel(f)}`);
  if (/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|n8n|webhook/i.test(t)) bad(`network call or endpoint in ${rel(f)}`);
}
for (const f of html) {
  const t = readFileSync(f, 'utf8');
  if (!/<meta name="robots" content="noindex, nofollow">/.test(t)) bad(`no noindex in ${rel(f)}`);
  for (const m of t.matchAll(/<form\b[^>]*>/g)) if (!/action="javascript:void\(0\)"/.test(m[0]) || /method="post"/i.test(m[0])) bad(`form may submit in ${rel(f)}: ${m[0]}`);
  if (/application\/ld\+json|rel="canonical"|hreflang=/.test(t)) bad(`production SEO markup in ${rel(f)}`);
}
ok('no local paths, no network calls or endpoints, all forms are no-op, no production SEO markup');
ok(`noindex, nofollow meta on all ${html.length} HTML pages`);
if (!/Disallow: \/\s*$/m.test(readFileSync(join(out, 'robots.txt'), 'utf8'))) bad('robots.txt does not disallow /');
if (!/X-Robots-Tag: noindex, nofollow/.test(readFileSync(join(out, '_headers'), 'utf8'))) bad('_headers missing X-Robots-Tag');
if (files.some((f) => /sitemap/i.test(f))) bad('sitemap present');
ok('robots.txt Disallow: /, X-Robots-Tag header, no sitemap');

// Preview status and LDA draft markers
let ldaPages = 0;
for (const f of html.filter((x) => !x.endsWith('404.html'))) {
  const t = readFileSync(f, 'utf8');
  if (!/Design experiment · not for publication/.test(t)) bad(`preview bar missing in ${rel(f)}`);
  if (t.includes('2026-004')) {
    ldaPages++;
    if (!/Internal draft|not yet verified|Owner-provided|owner-provided|not for publication/.test(t)) bad(`LDA number without draft notice in ${rel(f)}`);
  }
}
for (const f of html.filter((x) => /(lda|document-assistance)[^/]*\.html$/.test(x))) {
  const t = readFileSync(f, 'utf8');
  if (!/not for publication/i.test(t)) bad(`LDA page lacks prominent internal-draft notice: ${rel(f)}`);
}
ok(`preview bar on every page; ${ldaPages} pages mention the LDA number, all with draft notices`);

// Serve locally like Workers static assets (directory index + 404 page)
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let p = join(out, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!p.startsWith(out) || !existsSync(p)) { res.writeHead(404, { 'content-type': types['.html'] }); return res.end(readFileSync(join(out, '404.html'))); }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const expect = [['/', 200], ['/reviews.html', 200], ['/styles.css', 200], ['/robots.txt', 200], ['/assets/js/proto4.js', 200],
  ['/assets/js/sig-glyphs.js', 200], ['/assets/images/liudmyla-cutout-desk.webp', 200], ['/not-a-page/', 404]];
for (const [path, status] of expect) {
  const r = await fetch(base + path);
  if (r.status !== status) bad(`local server ${path} → ${r.status}, expected ${status}`);
}
server.close();
ok(`served locally: ${expect.length} requests returned the expected status (home, reviews page, assets, 404)`);

if (problems.length) { console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log('\ncheck:preview passed');
