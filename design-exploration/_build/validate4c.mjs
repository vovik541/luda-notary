// Validation + screenshots for the prototypes, using local Chrome over CDP. No dependencies.
// Run: node design-exploration/_build/validate.mjs
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const concepts = ['experiment-a3-complete'];
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const report = { links: [], pages: [], menus: [], shots: [], ldaLeaks: [] };

// 1. static link / asset check
const htmlFiles = [...concepts.flatMap((c) => readdirSync(join(root, c)).filter((f) => f.endsWith('.html')).map((f) => join(root, c, f)))];
for (const file of htmlFiles) {
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  for (const [, ref] of html.matchAll(/(?:href|src|srcset)="([^"]+)"/g)) {
    if (/^(https?:|tel:|mailto:|sms:|#|data:)/.test(ref)) continue;
    const target = resolve(dirname(file), ref.split('#')[0].split(' ')[0]);
    if (!existsSync(target)) report.links.push(`${file.replace(root, '')} → ${ref}`);
  }
}

// 2. browser checks
const port = 9341;
const profile = join(tmpdir(), 'ln-proto-' + Date.now());
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) { try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = t.find((x) => x.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch { await sleep(200); } }
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const waiters = [];
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) waiters.forEach((w) => w(m)); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }).then((m) => { if (m.error) throw new Error(method + ': ' + m.error.message); return m.result; });
const evalJS = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

async function open(file, w, h = 900, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  const loaded = new Promise((r) => waiters.push(function f(m) { if (m.method === 'Page.loadEventFired') { waiters.splice(waiters.indexOf(f), 1); r(); } }));
  await send('Page.navigate', { url: pathToFileURL(file).href });
  await loaded; await sleep(400);
}
async function shot(out, full = false) {
  mkdirSync(dirname(out), { recursive: true });
  let params = { format: 'jpeg', quality: 78 };
  if (full) {
    const { cssContentSize: s } = await send('Page.getLayoutMetrics');
    await evalJS(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=800){scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}scrollTo(0,0)})()`);
    await sleep(500);
    params = { ...params, captureBeyondViewport: true, clip: { x: 0, y: 0, width: s.width, height: Math.min(s.height, 16000), scale: 1 } };
  }
  const { data } = await send('Page.captureScreenshot', params);
  writeFileSync(out, Buffer.from(data, 'base64'));
  report.shots.push(out.replace(root + '\\', '').replace(root + '/', ''));
}

for (const c of concepts) {
  const dir = join(root, c);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) {
    await open(join(dir, f), 320, 700, true);
    const r = await evalJS(`(()=>({ overflow: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll('h1').length, h2: document.querySelectorAll('main h2').length,
      fixed: [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).position === 'fixed' && getComputedStyle(e).display !== 'none' && e.offsetHeight > 0).map(e => e.className || e.tagName),
      skipped: (() => { let last = 1, bad = 0; document.querySelectorAll('main h1, main h2, main h3').forEach(h => { const n = +h.tagName[1]; if (n > last + 1) bad++; last = n; }); return bad; })(),
      broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.split('/').pop()),
      noalt: [...document.images].filter(i => !i.hasAttribute('alt')).length }))()`);
    report.pages.push({ page: `${c}/${f}`, ...r });
  }
  // mobile menu
  await open(join(dir, 'index.html'), 390, 844, true);
  const menu = await evalJS(`(async()=>{const b=document.querySelector('[data-nav-toggle]');const p=document.getElementById(b.getAttribute('aria-controls'));const before=getComputedStyle(p).display;b.click();await new Promise(r=>setTimeout(r,100));const after=getComputedStyle(p).display;const links=p.querySelectorAll('a').length;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await new Promise(r=>setTimeout(r,50));return {before,after,expanded:b.getAttribute('aria-expanded'),links,closed:getComputedStyle(p).display}})()`);
  report.menus.push({ concept: c, ...menu });
  await evalJS(`document.querySelector('[data-nav-toggle]').click()`);
  await sleep(150);
  await shot(join(root, 'screenshots', c, 'mobile-390-menu-open.jpg'));
  await evalJS(`document.querySelector('[data-nav-toggle]').click()`);

  const S = (n) => join(root, 'screenshots', c, n);
  await open(join(dir, 'index.html'), 1440, 900); await shot(S('home-desktop-1440.jpg')); await shot(S('home-desktop-1440-full.jpg'), true);
  await open(join(dir, 'index.html'), 768, 1024, true); await shot(S('home-tablet-768.jpg')); await shot(S('home-tablet-768-full.jpg'), true);
  await open(join(dir, 'index.html'), 390, 844, true); await shot(S('home-mobile-390.jpg')); await shot(S('home-mobile-390-full.jpg'), true);
  // motion must never leave content hidden: run with motion allowed, wait, then check
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await open(join(dir, 'index.html'), 1440, 900);
  await sleep(2600);
  report.motion = report.motion || [];
  report.motion.push({ concept: c, ...(await evalJS(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}await new Promise(r=>setTimeout(r,1800));const hidden=[...document.querySelectorAll('main *')].filter(e=>e.offsetParent&&+getComputedStyle(e).opacity<0.95&&e.textContent.trim()).length;const cur=document.querySelector('[data-curtain]');const curtain=cur?getComputedStyle(cur).transform:'none';const ctaOk=[...document.querySelectorAll('.hero .btn')].every(b=>+getComputedStyle(b).opacity===1);const sw=document.querySelector('[data-branches]');let branch=null;if(sw){const b=sw.querySelectorAll('[data-branch-btn]')[1];b.click();await new Promise(r=>setTimeout(r,450));branch={pressed:b.getAttribute('aria-pressed'),visible:[...sw.querySelectorAll('[data-branch]')].filter(p=>!p.hidden).map(p=>p.dataset.branch),url:location.search}}return {hiddenTextEls:hidden,curtain,ctaOk,branch}})()`)) });
  await shot(S('home-desktop-1440-motion-settled.jpg'));
  for (const f of [0.18, 0.4, 0.62, 0.85]) { await evalJS(`scrollTo(0, (document.body.scrollHeight - innerHeight) * ${f}); 1`); await sleep(500); await shot(S(`scroll-${Math.round(f * 100)}.jpg`)); }
  report.sig = await evalJS(`(()=>{const p=document.querySelector('.sig-path');return {len:Math.round(p.getTotalLength()),d:p.getAttribute('d').length,offset:p.style.strokeDashoffset}})()`);
  // A3 interactions with motion on: carousel arrows, FAQ chat, three-step form
  const W = (ms) => `await new Promise(r=>setTimeout(r,${ms}));`;
  report.interact = await evalJS(`(async()=>{const f=document.querySelector('[data-steps]');const t=document.querySelector('.car-track');
    document.getElementById('reviews').scrollIntoView();${W(400)}document.querySelector('[data-car-next]').click();${W(900)}
    const car={scrollLeft:Math.round(t.scrollLeft),index:document.querySelector('[data-car-index]').textContent,prevDisabled:document.querySelector('[data-car-prev]').disabled};
    document.getElementById('faq').scrollIntoView();const qs=document.querySelectorAll('.chat-q');qs[1].click();${W(1100)}qs[3].click();${W(1100)}
    const chat=[...document.querySelectorAll('.chat-log .bubble')].map(b=>b.className.split(' ')[1]);
    document.getElementById('book').scrollIntoView();f.querySelector('[data-step-next]').click();const err=f.querySelector('.form-status').textContent;
    f.elements.city.value='Folsom';f.querySelector('[data-step-next]').click();${W(700)}const s2=[...f.querySelectorAll('[data-step]')].map(s=>!s.hidden);
    return {car,chat,err,s2}})()`);
  await shot(S('a3-chat-step2.jpg'));
  report.interact.finish = await evalJS(`(async()=>{const f=document.querySelector('[data-steps]');f.elements.date.value=f.elements.date.min;f.querySelectorAll('[data-step-next]')[1].click();${W(700)}
    f.elements.name.value='Test';f.elements.phone.value='9160000000';f.requestSubmit();${W(900)}document.getElementById('book').scrollIntoView();
    return {steps:[...f.querySelectorAll('[data-step]')].map(s=>!s.hidden),done:!f.querySelector('[data-step-done]').hidden,summary:f.querySelector('[data-step-summary]').textContent}})()`);
  await shot(S('a3-form-done.jpg'));
  await open(join(dir, 'reviews.html'), 1440, 900); await sleep(1500); await shot(S('reviews-desktop-1440.jpg'));
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
}


ws.close(); chrome.kill();
try { rmSync(profile, { recursive: true, force: true }); } catch {}
writeFileSync(join(root, 'screenshots', 'validation-experiment-a3.json'), JSON.stringify(report, null, 2));
const bad = report.pages.filter((p) => p.overflow > 0 || p.h1 !== 1 || !p.h2 || p.skipped || p.fixed.length || p.broken.length || p.noalt);
console.log('motion:', JSON.stringify(report.motion)); console.log('sig:', JSON.stringify(report.sig));
console.log('broken links/assets:', report.links.length ? report.links : 'none');
console.log('pages checked at 320px:', report.pages.length, '· problems:', bad.length ? bad : 'none');
console.log('menus:', JSON.stringify(report.menus));
console.log('interact:', JSON.stringify(report.interact));
console.log('screenshots:', report.shots.length);
