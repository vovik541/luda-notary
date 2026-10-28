// Site checks against a running Worker (npx wrangler dev). No dependencies; Chrome over CDP for the browser part.
// Usage: node scripts/check-site.mjs [baseUrl=http://127.0.0.1:8790]
//
// HTTP (plan §7): every legacy URL → one 301 → 200; every built page → 200 with a self-referencing canonical and a
// reciprocal hreflang set; unknown paths → real 404 per locale; sitemap entries → 200 + indexable (production builds).
// Browser (plan §8): no console errors, no horizontal overflow at 320 px, the signature line never crosses text,
// it draws with scroll and keeps the pen tip on screen, reduced motion shows it complete; screenshots for review.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'site', 'browser');
const shots = join(root, 'dist', 'check');
const BASE = process.argv[2] ?? 'http://127.0.0.1:8790';
const problems = [];
const ok = (m) => console.log(`  ok  ${m}`);
const bad = (m) => problems.push(m);
const get = (path, init) => fetch(BASE + path, { redirect: 'manual', ...init });

// ---------- HTTP ----------
const redirects = readFileSync(join(out, '_redirects'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(' '));
for (const [from, to, code] of redirects) {
  const r = await get(from);
  const loc = (r.headers.get('location') ?? '').replace(BASE, '');
  if (String(r.status) !== code || loc !== to) { bad(`redirect ${from} → ${r.status} ${loc} (expected ${code} ${to})`); continue; }
  const t = await get(to);
  if (t.status !== 200) bad(`redirect target ${to} → ${t.status}`);
}
ok(`${redirects.length} redirects: one 301 hop each, every target 200`);

const pages = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : f === 'index.html' && pages.push('/' + relative(out, d).replaceAll('\\', '/') + (relative(out, d) ? '/' : '')); });
walk(out);
const SITE_URL = (readFileSync(join(out, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+?)\/"/) ?? [])[1] ?? '';
const heads = new Map();
for (const p of pages.map((x) => x.replace('//', '/'))) {
  const r = await get(p);
  if (r.status !== 200) { bad(`${p} → ${r.status}`); continue; }
  const html = await r.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
  const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2].replace(SITE_URL, '')]));
  heads.set(p, { canonical: canonical?.replace(SITE_URL, ''), robots, alts, lang: html.match(/<html lang="([^"]+)"/)?.[1] });
  if (!canonical) { if (!/noindex/.test(robots)) bad(`${p} has no canonical but is indexable`); continue; }
  if (canonical?.replace(SITE_URL, '') !== p) bad(`${p} canonical ${canonical}`);
  if (!alts['x-default']) bad(`${p} has no x-default`);
}
for (const [p, h] of heads) for (const [lang, href] of Object.entries(h.alts)) {
  const other = heads.get(href);
  if (!other) { bad(`${p} hreflang ${lang} → ${href} is not a built page`); continue; }
  if (!Object.values(other.alts).includes(p)) bad(`hreflang not reciprocal: ${href} does not point back to ${p}`);
  if (lang !== 'x-default' && other.lang !== lang) bad(`${href} has lang=${other.lang}, expected ${lang}`);
}
ok(`${heads.size} pages: 200, self-canonical, reciprocal hreflang with x-default, <html lang> matches`);

for (const p of ['/not-a-page/', '/uk/not-a-page/', '/ru/not-a-page/', '/nope.html', '/uk/mobile-notary/nowhere/']) {
  const r = await get(p);
  const html = await r.text();
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  const want = p.startsWith('/uk/') ? 'uk' : p.startsWith('/ru/') ? 'ru' : 'en';
  if (r.status !== 404 || lang !== want) bad(`${p} → ${r.status} lang=${lang} (expected 404 ${want})`);
}
ok('unknown paths return a real 404 with the right language');

const sm = await get('/sitemap.xml');
if (sm.status === 200) {
  const locs = [...(await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE_URL, ''));
  for (const l of locs) { const h = heads.get(l); if (!h || /noindex/.test(h.robots) || h.canonical !== l) bad(`sitemap entry ${l} is not an indexable self-canonical page`); }
  const indexable = [...heads].filter(([, h]) => !/noindex/.test(h.robots) && h.canonical).map(([p]) => p);
  for (const p of indexable) if (!locs.includes(p)) bad(`indexable page missing from sitemap: ${p}`);
  ok(`sitemap: ${locs.length} URLs, all indexable and self-canonical, none missing`);
} else {
  const robots = await (await get('/robots.txt')).text();
  if (!/Disallow: \/\s*$/m.test(robots)) bad('preview build without sitemap must disallow all in robots.txt');
  if ([...heads.values()].some((h) => !/noindex/.test(h.robots))) bad('preview build has an indexable page');
  ok('preview build: no sitemap, robots.txt disallows all, every page noindex');
}

// ---------- Browser ----------
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const port = 9351, profile = join(tmpdir(), 'lp-check-' + Date.now());
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) { try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = t.find((x) => x.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch { await sleep(200); } }
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }).then((m) => { if (m.error) throw new Error(method + ': ' + m.error.message); return m.result; });
const evalJS = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
await send('Page.enable'); await send('Runtime.enable');
const motion = (v) => send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: v }] });
async function open(path, w, h = 900) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: BASE + path });
  await sleep(1800);
}
async function shot(name, full = false) {
  mkdirSync(shots, { recursive: true });
  let params = { format: 'jpeg', quality: 76 };
  if (full) {
    await evalJS(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0);await new Promise(r=>setTimeout(r,600))})()`);
    const { cssContentSize: s } = await send('Page.getLayoutMetrics');
    params = { ...params, captureBeyondViewport: true, clip: { x: 0, y: 0, width: s.width, height: Math.min(s.height, 16000), scale: 1 } };
  }
  const { data } = await send('Page.captureScreenshot', params);
  writeFileSync(join(shots, name), Buffer.from(data, 'base64'));
}

// Signature line: sample the drawn path, never inside a text/control/image box; draws with scroll; tip on screen.
const SIG_CHECK = `(async () => {
  const sleep = (t) => new Promise((r) => setTimeout(r, t));
  const svg = document.querySelector('.sigline'); if (!svg) return { missing: true };
  const guide = svg.querySelector('path'); const L = guide.getTotalLength(); const main = svg.closest('main'); const mr = main.getBoundingClientRect();
  const sel = 'h1,h2,h3,p,li,dt,dd,label,input,select,textarea,button,a,img,blockquote,figcaption,.bubble';
  const boxes = [...main.querySelectorAll(sel)].filter((e) => !e.closest('.sigline') && e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return { l: r.left - mr.left, t: r.top - mr.top, r: r.right - mr.left, b: r.bottom - mr.top, tag: e.tagName + '.' + e.className, text: e.textContent.trim().slice(0, 30) }; });
  // Written words are expected to sit in empty bands; sample only the connecting strokes and margins (the guide path).
  const hits = [];
  for (let i = 0; i <= 600; i++) { const p = guide.getPointAtLength((L * i) / 600); const b = boxes.find((x) => p.x > x.l + 2 && p.x < x.r - 2 && p.y > x.t + 2 && p.y < x.b - 2); if (b) hits.push((b.tag + ':' + (b.text||'')).slice(0,60) + '@' + Math.round(p.y)); }
  const drawn = () => { let v = 0, t = 0; svg.querySelectorAll('g path').forEach((q) => { const l = q.getTotalLength(); t += l; v += Math.max(0, l + 1 - parseFloat(q.style.strokeDashoffset || '0')); }); return t ? v / t : 0; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seq = []; let tipOk = true; const tips = [];
  for (let y = 0; y <= document.body.scrollHeight - innerHeight; y += Math.round(innerHeight / 2)) {
    scrollTo(0, y); await sleep(140);
    const d = drawn(); seq.push(+d.toFixed(3));
    const nib = svg.querySelector('circle'); const r = nib.getBoundingClientRect();
    if (!reduce && d > 0.02 && d < 0.98 && (r.top < innerHeight * 0.4 || r.top > innerHeight * 1.0)) { tipOk = false; tips.push(Math.round(r.top / innerHeight * 100) + '%@' + y); }
  }
  scrollTo(0, document.body.scrollHeight); await sleep(200); seq.push(+drawn().toFixed(3));
  const monotonic = seq.every((v, i) => !i || v >= seq[i - 1] - 0.001);
  return { tips: tips.slice(0, 6), hits: [...new Set(hits)].slice(0, 4), hitCount: hits.length, first: seq[0], last: seq[seq.length - 1], monotonic, tipOk, reduce };
})()`;

const viewports = [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 640]];
for (const locale of ['', '/uk']) {
  for (const [w, h] of viewports) {
    await motion('no-preference');
    await open(`${locale}/`, w, h);
    const s = await evalJS(SIG_CHECK);
    if (s.missing) { bad(`signature line missing at ${locale || '/'} ${w}`); continue; }
    if (s.hitCount) bad(`signature line crosses content at ${locale || '/'} ${w}px: ${s.hitCount} samples, e.g. ${s.hits.join(', ')}`);
    if (!s.monotonic || s.first > 0.05 || s.last < 0.99) bad(`signature line does not draw with scroll at ${locale || '/'} ${w}px (first ${s.first}, last ${s.last}, monotonic ${s.monotonic})`);
    if (!s.tipOk) bad(`signature pen tip leaves the viewport at ${locale || '/'} ${w}px: ${s.tips.join(', ')}`);
    const overflow = await evalJS('document.documentElement.scrollWidth - innerWidth');
    if (overflow > 0) bad(`horizontal overflow ${overflow}px at ${locale || '/'} ${w}px`);
  }
}
ok(`signature line at ${viewports.length} widths × EN/UK: checked for content overlap, scroll drawing and pen tip`);
await motion('reduce');
await open('/', 1440);
const still = await evalJS(SIG_CHECK);
if (still.first < 0.99) bad(`reduced motion: line should be complete from the start (got ${still.first})`);
ok('reduced motion: signature line complete and static');

await motion('no-preference');
for (const [path, name] of [['/', 'home'], ['/uk/', 'home-uk'], ['/notary/', 'notary'], ['/reviews/', 'reviews'], ['/uk/reviews/', 'reviews-uk'], ['/service-area/', 'area'], ['/document-assistance/', 'lda'], ['/mobile-notary/citrus-heights/', 'city'], ['/ru/not-a-page/', '404-ru']]) {
  await open(path, 1440); await shot(`${name}-1440-full.jpg`, true);
  await open(path, 390, 844); await shot(`${name}-390-full.jpg`, true);
  const overflow = await evalJS('document.documentElement.scrollWidth - innerWidth');
  if (overflow > 0) bad(`horizontal overflow ${overflow}px at ${path} 390px`);
}
ok(`screenshots in ${relative(root, shots)}`);
if (errors.length) bad(`browser console errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
else ok('no console errors or exceptions');

ws.close(); chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
if (problems.length) { console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log('\ncheck passed');
