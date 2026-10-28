import { biz, hours, cities, groups, countyName, services, drafts, faqs } from './content.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const PAGES = [
  ['index.html', 'Home'], ['services.html', 'Services'], ['pricing.html', 'Pricing'],
  ['service-area.html', 'Service Areas'], ['about.html', 'About'], ['contact.html', 'Contact'],
];

const planned = {
  'index.html': '/', 'services.html': '/services/', 'pricing.html': '/pricing/', 'service-area.html': '/service-area/',
  'about.html': '/about/', 'contact.html': '/contact/', 'service-detail.html': '/services/power-of-attorney/',
  'location-detail.html': '/service-area/citrus-heights/', 'lda.html': '/services/legal-document-preparation/ (draft)',
  'privacy.html': '/privacy/',
};

export function head({ file, title, desc, css, concept }) {
  const url = planned[file] || '/';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow">
<!-- Production plan: canonical https://mobilenotary-sacramento.com/en${url.split(' ')[0]} · hreflang en / uk / ru + x-default · prerendered HTML -->
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="../assets/brand/og-image.jpg">
<link rel="icon" href="../assets/brand/favicon.ico" sizes="48x48">
<link rel="icon" href="../assets/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../assets/brand/apple-touch-icon.png">
<link rel="stylesheet" href="styles.css">
<script>document.documentElement.classList.add('js')</script>
<script src="../assets/js/proto.js" defer></script>
</head>
<body class="${concept}">
<a class="skip" href="#main">Skip to content</a>
<div class="proto-bar" role="note"><span>Design prototype · not for publication</span> <a href="../index.html">All concepts</a></div>
`;
}

export const foot = () => `</body>\n</html>\n`;

export function nav(file, cls = 'nav') {
  return PAGES.map(([f, label]) => `<a href="${f}"${f === file ? ' aria-current="page"' : ''}>${label}</a>`).join('');
}

export function langSwitch(cls = 'lang') {
  return `<div class="${cls}" data-lang-switch>
  <span class="sr-only">Language</span>
  <a href="#" aria-current="true" lang="en" data-lang="en">EN</a>
  <button type="button" lang="uk" data-lang="uk" aria-describedby="lang-status">UK</button>
  <button type="button" lang="ru" data-lang="ru" aria-describedby="lang-status">RU</button>
  <span class="lang-status" id="lang-status" role="status" aria-live="polite"></span>
</div>`;
}

export const tag = (kind = 'draft', text) => {
  const t = text || { draft: 'Draft · needs owner confirmation', owner: 'Owner-provided · not yet verified', confirmed: 'Confirmed' }[kind];
  return `<span class="tag tag-${kind}">${esc(t)}</span>`;
};

export const telLink = (cls = '', label = biz.phone) => `<a class="${cls}" href="tel:${biz.tel}">${label}</a>`;

export function hoursTable(cls = 'hours') {
  return `<table class="${cls}"><caption class="sr-only">Business hours</caption><tbody>${hours
    .map(([d, h]) => `<tr${h === 'Closed' ? ' class="closed"' : ''}><th scope="row">${d}</th><td>${h}</td></tr>`).join('')}</tbody></table>`;
}

export function cityGroups({ cls = 'city-groups', link = true } = {}) {
  return `<div class="${cls}">${groups.map(([g, label]) => `<div class="cg">
  <h3>${label}</h3>
  <ul>${cities.filter((c) => c.group === g).map((c) => `<li>${c.slug && link ? `<a href="location-detail.html">${c.name}</a>` : c.name}${c.pending ? ' <span class="pend">(pending confirmation)</span>' : ''}${c.base ? ' <span class="base">— home base</span>' : ''}</li>`).join('')}</ul>
</div>`).join('')}</div>`;
}

export function cityChecker(id = 'cc') {
  const opts = cities.map((c) => `<option value="${c.name}" data-county="${countyName[c.county]}"${c.pending ? ' data-pending' : ''}${c.base ? ' data-base' : ''}>${c.name}</option>`).join('');
  return `<form class="checker" data-checker onsubmit="return false">
  <label for="${id}">Check your city</label>
  <div class="checker-row"><select id="${id}" name="city"><option value="">Choose a city…</option>${opts}<option value="__other">My city is not listed</option></select></div>
  <p class="checker-out" role="status" aria-live="polite">All listed cities are in Sacramento and Placer counties. Travel is quoted individually.</p>
</form>`;
}

// Schematic coverage map drawn from approximate city coordinates.
export function areaMap(cls = 'map') {
  const LON0 = -121.55, LAT1 = 38.95, W = 470, H = 640;
  const P = (c) => [((c.lon - LON0) / 0.55) * W, ((LAT1 - c.lat) / 0.58) * H];
  const pts = cities.filter((c) => !c.pending).map(P);
  // convex hull (monotone chain)
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of s) { while (lo.length >= 2 && cross(lo.at(-2), lo.at(-1), p) <= 0) lo.pop(); lo.push(p); }
  for (const p of [...s].reverse()) { while (up.length >= 2 && cross(up.at(-2), up.at(-1), p) <= 0) up.pop(); up.push(p); }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1));
  const cx = hull.reduce((a, p) => a + p[0], 0) / hull.length, cy = hull.reduce((a, p) => a + p[1], 0) / hull.length;
  const poly = hull.map(([x, y]) => { const d = Math.hypot(x - cx, y - cy); return [x + ((x - cx) / d) * 26, y + ((y - cy) / d) * 26]; })
    .map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  const dots = cities.map((c) => {
    const [x, y] = P(c); const [dx, dy, a] = c.lab;
    return `<g class="pt${c.base ? ' is-base' : ''}${c.pending ? ' is-pending' : ''}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${c.base ? 7 : 4.5}"/><text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${a}">${c.name}${c.pending ? ' ?' : ''}</text></g>`;
  }).join('');
  return `<figure class="${cls}"><svg viewBox="-60 20 600 620" role="img" aria-labelledby="map-t map-d"><title id="map-t">Schematic service area map</title><desc id="map-d">Approximate positions of the 16 listed cities in Sacramento and Placer counties, with Citrus Heights as the home base. Loomis is shown as pending confirmation.</desc>
<polygon class="area" points="${poly}"/>${dots}</svg>
<figcaption>Schematic, not to scale for travel. The searchable city list is the reference.</figcaption></figure>`;
}

export function requestForm({ id = 'rf', cls = 'request', compact = false } = {}) {
  const svc = [...services.map((s) => s.name), drafts.apostille.name + ' (draft)', drafts.hospital.name + ' (draft)', drafts.lda.name + ' (draft)', 'Not sure yet'];
  return `<form class="${cls}" data-proto-form novalidate>
  <div class="f-row">
    <label for="${id}-name">Name</label><input id="${id}-name" name="name" autocomplete="name" required>
  </div>
  <div class="f-two">
    <div class="f-row"><label for="${id}-phone">Phone</label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel"></div>
    <div class="f-row"><label for="${id}-email">Email <span class="opt">(optional if phone given)</span></label><input id="${id}-email" name="email" type="email" autocomplete="email"></div>
  </div>
  <div class="f-two">
    <div class="f-row"><label for="${id}-city">City or location</label><select id="${id}-city" name="city"><option value="">Choose…</option>${cities.map((c) => `<option>${c.name}${c.pending ? ' (pending)' : ''}</option>`).join('')}<option>Other / not listed</option></select></div>
    <div class="f-row"><label for="${id}-svc">Service</label><select id="${id}-svc" name="service"><option value="">Choose…</option>${svc.map((s) => `<option>${esc(s)}</option>`).join('')}</select></div>
  </div>
  ${compact ? '' : `<div class="f-two">
    <div class="f-row"><label for="${id}-date">Preferred date</label><input id="${id}-date" name="date" type="date"></div>
    <div class="f-row"><label for="${id}-time">Preferred time</label><select id="${id}-time" name="time"><option value="">Any time</option><option>Morning</option><option>Afternoon</option><option>Evening (Mon–Thu)</option></select></div>
  </div>
  <div class="f-row"><label for="${id}-msg">Message</label><textarea id="${id}-msg" name="message" rows="4" placeholder="Document type, number of signers, where you would like to meet"></textarea></div>`}
  <div class="f-check"><input id="${id}-ok" name="contact_ok" type="checkbox"><label for="${id}-ok">Optional: Liudmyla may call or text me about this request.</label></div>
  <p class="f-note">Your details are used only to reply to this request. Appointments are confirmed only after the time, place and fee are agreed. <a href="privacy.html">Privacy</a></p>
  <button type="submit" class="btn btn-primary">Send request</button>
  <p class="f-status" role="status" aria-live="polite"></p>
</form>`;
}

export function faqList(items = faqs, cls = 'faq') {
  return `<div class="${cls}">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
}

export const img = (name, alt, { w, h, cls = '', eager = false, sizes } = {}) =>
  `<img class="${cls}" src="../assets/images/${name}" alt="${esc(alt)}"${w ? ` width="${w}" height="${h}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

export const PORTRAIT_ALT = 'Liudmyla Petruk at her desk in her office';

export const CREDITS = `Regional photographs: <a href="https://commons.wikimedia.org/wiki/File:Tower_Bridge_Sacramento_edit.jpg">“Tower Bridge Sacramento edit”</a> by Michael Grindstaff, edited by Fir0002, public domain; <a href="https://commons.wikimedia.org/wiki/File:California_State_Capitol_(top),_NW_view_up.jpg">“California State Capitol (top), NW view up”</a> by Radomianin, public domain; <a href="https://commons.wikimedia.org/wiki/File:Citrus_Heights_-_City_Hall.jpg">“Citrus Heights - City Hall”</a> by J.smith, <a href="https://creativecommons.org/licenses/by-sa/2.5">CC BY-SA 2.5</a>; all via Wikimedia Commons. Portrait: Liudmyla Petruk, from the current website.`;
