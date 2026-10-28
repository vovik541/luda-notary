// Experiments A–C (creative personal brand). Writes only experiment-* folders.
// Run: node design-exploration/_build/exp.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { biz, cities, countyName } from './content.mjs';
import { areaMap, esc } from './shared.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tel = biz.tel, phone = biz.phone, email = biz.email;
const hours = 'Mon–Thu 10&nbsp;AM–8&nbsp;PM · Fri 10&nbsp;AM–6&nbsp;PM';

const notary = [
  ['Mobile notarization', 'At your home, office or an agreed place in the service area.'],
  ['Acknowledgments', 'Deeds, agreements, trusts and forms that say “acknowledged before me”.'],
  ['Jurats', 'Affidavits and sworn statements: you take an oath, then sign.'],
  ['Power of attorney', 'Notarizing a power of attorney you have already prepared.'],
  ['Real estate documents', 'Grant, quitclaim and trust deeds, with the journal thumbprint California requires.'],
  ['General documents', 'Consent letters, business, school and vehicle paperwork.'],
];
const notaryPending = ['Hospital & care-facility visits', 'Apostille assistance'];
const lda = [
  ['Document preparation', 'Prepared at your specific direction, from the information you give.'],
  ['Form completion', 'Completing forms you have chosen, with your answers.'],
  ['Filing assistance', 'Where the law allows; scope still to be confirmed.'],
];
const byCounty = () => ['S', 'P'].map((k) => ({ county: countyName[k], list: cities.filter((c) => c.county === k).sort((a, b) => a.name.localeCompare(b.name)) }));

const FONTS = { xa: ['literata-latin', 'inter-latin'], xb: ['cormorant-garamond-latin', 'manrope-latin'], xc: ['manrope-latin', 'onest-latin'] };
const THEME = { xa: '#faf8f4', xb: '#fdfcfa', xc: '#ffffff' };
const head = (title, cls, desc) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${THEME[cls]}">
${FONTS[cls].map((f) => `<link rel="preload" href="../assets/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join(String.fromCharCode(10))}
<link rel="icon" href="../assets/brand/favicon.ico" sizes="48x48">
<link rel="icon" href="../assets/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../assets/fonts/fonts.css">
<link rel="stylesheet" href="styles.css">
<script src="../assets/js/proto4.js" defer></script>
</head>
<body class="${cls}">
<a class="skip" href="#main">Skip to content</a>
<div class="proto-bar" role="note"><span>Design experiment · not for publication · forms and links are demonstrations</span><a href="../index.html">All concepts</a></div>
`;
const lang = () => `<div class="lang" data-lang><span class="sr-only">Language:</span><span class="lang-ind" aria-hidden="true"></span><a href="#" data-l="en" lang="en" aria-current="true">EN</a><a href="#" data-l="uk" lang="uk">УКР</a><a href="#" data-l="ru" lang="ru">РУС</a><span class="lang-note" role="status" aria-live="polite"></span></div>`;
const navLinks = `<a href="#services">Services</a><a href="#area">Service area</a><a href="#fees">Fees</a><a href="#about">About</a><a href="#contact">Contact</a>`;
const header = (brand) => `<header class="top"><div class="wrap top-row">
  ${brand}
  <nav class="nav" id="nav" aria-label="Main">${navLinks}<div class="nav-more">${lang()}</div></nav>
  <div class="top-cta">${lang()}<a class="btn btn-call" href="tel:${tel}"><span class="long">${phone}</span><span class="short">Call</span></a><button class="menu-btn" type="button" data-nav-toggle aria-controls="nav" aria-expanded="false"><span class="menu-label">Menu</span></button></div>
</div></header>`;
const draft = (t = 'Internal draft') => `<span class="draft">${t}</span>`;
const ldaNote = `Legal Document Assistant · Sacramento County No. ${biz.lda.number}, owner-provided · expiration not yet confirmed · not for publication until verified`;
const credit = `Portrait: Liudmyla Petruk. Fonts: Literata, Inter, Cormorant Garamond, Manrope, Onest (SIL Open Font License).`;
const legal = `${esc(biz.notary.title)} · Commission No. ${biz.notary.number} · Expires ${biz.notary.expires}. I am not an attorney and, therefore, cannot give legal advice about immigration or any other legal matters. California limits the notarial fee to $15 per signature (acknowledgment) or per person (jurat); travel and other fees are quoted and agreed in advance.`;
const cityText = () => byCounty().map(({ county, list }) => `<div class="county"><h3>${county}</h3><p>${list.map((c) => `<span${c.base ? ' class="base"' : ''}>${c.name}${c.pending ? '*' : ''}</span>`).join('<span class="sep" aria-hidden="true"> · </span>')}</p></div>`).join('') + `<p class="small">* Loomis pending confirmation. Citrus Heights is the home base.</p>`;

/* ======================== A · Portrait Beyond the Frame ======================== */
const expA = () => head('Liudmyla Petruk — Notary Public · Experiment A', 'xa', 'Experiment A: portrait beyond the frame.') + header(`<a class="brand" href="#main"><img src="../assets/brand/monogram-gold.png" width="202" height="188" alt=""><span translate="no">Liudmyla Petruk<small>Notary Public</small></span></a>`) + `
<main id="main">
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <h1><span data-enter="up">Notarized properly,</span> <span data-enter="up">in person.</span></h1>
      <p class="lede" data-enter="up">Liudmyla Petruk is a California Notary Public in Citrus Heights. She comes to your home or office across Sacramento and Placer counties, or you meet her by appointment.</p>
      <div class="actions"><a class="btn btn-primary" href="tel:${tel}">Call ${phone}</a><a class="link" href="#contact">Request an appointment</a></div>
      <ul class="facts"><li><strong>Mobile &amp; in person</strong>Your place or hers</li><li><strong>EN · УКР · РУС</strong>Ask in your language</li><li><strong>Mon–Thu 10–8 · Fri 10–6</strong>Weekends by arrangement</li></ul>
    </div>
    <figure class="hero-fig">
      <span class="ghost" aria-hidden="true">Petruk</span>
      <span class="block" aria-hidden="true"></span>
      <span class="corner" aria-hidden="true"></span>
      <img class="cut" data-enter="rise" src="../assets/images/liudmyla-cutout-desk.webp" width="1089" height="1364" alt="Liudmyla Petruk at her desk" fetchpriority="high">
      <figcaption class="cred"><strong>California Notary Public</strong><span>Commission No. ${biz.notary.number}</span><span>Expires ${biz.notary.expires}</span></figcaption>
    </figure>
  </div>
</section>

<section class="branches" id="services" aria-labelledby="sv-h"><div class="wrap">
  <h2 id="sv-h">Two kinds of help, one professional</h2>
  <div class="br-grid">
    <article class="br br-notary" data-reveal>
      <p class="br-tag">Notary Public · primary</p>
      <h3>Getting a document notarized</h3>
      <ul class="svc">${notary.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ul>
      <p class="pending">Being confirmed: ${notaryPending.join(' · ')}</p>
      <p class="br-foot"><strong>Up to $15</strong> per signature · travel quoted first · <a href="tel:${tel}">Book a notary</a></p>
    </article>
    <article class="br br-lda" data-reveal>
      <p class="br-tag">Document assistance ${draft()}</p>
      <h3>Help preparing your own documents</h3>
      <ul class="svc">${lda.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ul>
      <p class="br-foot">By appointment only · quote in a written contract · not legal advice</p>
      <p class="lda-note">${ldaNote}</p>
    </article>
  </div>
</div></section>

<section class="ways" aria-labelledby="w-h"><div class="wrap ways-grid">
  <h2 id="w-h">Your place, or hers.</h2>
  <div class="way" data-reveal><h3>She comes to you</h3><p>Home, office, or another agreed place in 16 cities and communities. The travel fee is quoted and agreed before booking. Same-day visits may be possible by prior agreement.</p></div>
  <div class="way" data-reveal><h3>You visit her</h3><p>In Citrus Heights, by appointment. The address is shared when your appointment is confirmed. Document assistance is offered this way only.</p></div>
</div></section>

<section class="trust" aria-labelledby="t-h"><div class="wrap trust-grid">
  <img class="trust-pic" src="../assets/images/liudmyla-cutout-head.webp" width="480" height="584" alt="Liudmyla Petruk" loading="lazy">
  <div>
    <h2 id="t-h">Credentials you can check</h2>
    <dl class="ledger" data-reveal>
      <div><dt>Role</dt><dd>California Notary Public</dd></div>
      <div><dt>Commission No.</dt><dd>${biz.notary.number}</dd></div>
      <div><dt>Expires</dt><dd>${biz.notary.expires}</dd></div>
      <div><dt>Commissioned by</dt><dd>California Secretary of State</dd></div>
    </dl>
    <p class="small">Document-assistance registration is shown only after county verification.</p>
  </div>
</div></section>

<section class="area" id="area" aria-labelledby="a-h"><div class="wrap area-grid">
  <div><h2 id="a-h">Sacramento &amp; Placer counties</h2>${cityText()}</div>
  ${areaMap('map')}
</div></section>

<section class="fees" id="fees" aria-labelledby="f-h"><div class="wrap fees-grid">
  <h2 id="f-h">How fees work</h2>
  <div class="fee-big" data-reveal><span class="num">$15</span><p>The most California law allows per notarized signature (acknowledgment) or per person sworn (jurat).</p></div>
  <dl class="fee-list" data-reveal>
    <div><dt>Mobile travel</dt><dd>Quoted individually, agreed before booking</dd></div>
    <div><dt>Weekend or special appointment</dt><dd>By prior arrangement, fee agreed in advance</dd></div>
    <div><dt>Document assistance ${draft()}</dt><dd>Quote in a written contract, separate from notary fees</dd></div>
    <div><dt>Payment</dt><dd>Zelle, cash or check, at the appointment</dd></div>
  </dl>
</div></section>

<section class="about" id="about" aria-labelledby="ab-h"><div class="wrap about-grid">
  <h2 id="ab-h">Meet Liudmyla</h2>
  <p class="about-lead" data-reveal>Calm, careful and clear. Liudmyla checks every detail, explains each step before you sign, and speaks English, Ukrainian and Russian.</p>
  <p data-reveal>Every appointment follows the same order: identity first, then the signature or oath, the journal entry and the certificate. She does not give legal advice, and she will tell you when a question belongs with an attorney.</p>
</div></section>

<section class="contact" id="contact" aria-labelledby="c-h"><div class="wrap contact-grid">
  <h2 id="c-h">Ready when you are.</h2>
  <div><a class="phone" href="tel:${tel}">${phone}</a><p>Call or text. Time, place and fee are confirmed before anything is booked.<br>${hours} · <a href="mailto:${email}">${email}</a></p></div>
</div></section>
</main>
<footer class="foot"><div class="wrap"><p class="foot-name" translate="no">Liudmyla Petruk</p><p>${legal}</p><p class="small">${credit}</p></div></footer>
</body></html>
`;


/* ======================== A2 · Portrait + scroll-drawn signature line ======================== */
// Same first two screens as A. Oversized numbers/names removed; one fine signature line draws as you scroll.
const expA2 = () => {
  let h = expA()
    .replace('Liudmyla Petruk — Notary Public · Experiment A', 'Liudmyla Petruk — Notary Public · Experiment A2')
    .replace('Experiment A: portrait beyond the frame.', 'Experiment A2: portrait with a scroll-drawn signature line.')
    .replace('<main id="main">', '<main id="main" class="has-sig">\n<svg class="sigline" data-sigline aria-hidden="true" focusable="false"><path class="sig-path"/><circle class="sig-nib" r="3.5"/></svg>')
    .replace(/<h2 id="/g, '<h2 data-sig-stop id="')
    .replace(/<div class="fee-big" data-reveal>[\s\S]*?<\/div>\n  <dl class="fee-list" data-reveal>/, '<dl class="fee-list" data-reveal>\n    <div><dt>Notarial fee</dt><dd>Up to $15 per signature (acknowledgment) or per person sworn (jurat), the California maximum</dd></div>')
    .replace('<script src="../assets/js/proto4.js" defer></script>', '<script src="../assets/js/sig-glyphs.js" defer></script>\n<script src="../assets/js/proto4.js" defer></script>')
    .replace('Onest (SIL Open Font License).', 'Onest; the scroll line is written in EMS Allure (all SIL Open Font License).')
    .replace('<p class="foot-name" translate="no">Liudmyla Petruk</p>', '<p class="foot-name" translate="no">Liudmyla Petruk <span>Notary Public · Citrus Heights</span></p>');
  return h;
};

/* ======================== B · Signature Identity ======================== */
const thread = (d, cls = '') => `<svg class="thread ${cls}" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" data-draw="1800"><path d="${d}"/></svg>`;
const expB = () => head('Liudmyla Petruk — Notary Public · Experiment B', 'xb', 'Experiment B: signature identity.') + header(`<a class="brand" href="#main"><img src="../assets/brand/monogram-dark.png" width="202" height="188" alt=""><span translate="no">Liudmyla Petruk</span></a>`) + `
<main id="main">
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="role" data-enter="up">California Notary Public · Citrus Heights</p>
      <h1 data-enter="up">Every signature, handled with care.</h1>
      <p class="lede" data-enter="up">Mobile and in-person notarization across Sacramento and Placer counties, from Liudmyla Petruk, in English, Ukrainian or Russian.</p>
      <div class="actions"><a class="btn btn-primary" href="tel:${tel}">Call ${phone}</a><a class="link" href="#contact">Request an appointment</a></div>
    </div>
    <figure class="hero-fig">
      <svg class="flourish" viewBox="0 0 640 640" aria-hidden="true" data-draw="2600"><path d="M30 470 C 120 300, 260 600, 330 380 S 520 120, 600 260 S 470 560, 340 520 S 180 380, 250 250"/><path d="M60 560 C 220 520, 420 610, 610 540"/></svg>
      <img class="cut" data-enter="rise" src="../assets/images/liudmyla-cutout-bust.webp" width="800" height="838" alt="Liudmyla Petruk" fetchpriority="high">
      <figcaption>Liudmyla Petruk<span>Commission No. ${biz.notary.number} · Expires ${biz.notary.expires}</span></figcaption>
    </figure>
  </div>
</section>
${thread('M0 60 C 200 10, 380 110, 600 60 S 1000 10, 1200 60')}
<section class="services" id="services" aria-labelledby="sv-h"><div class="wrap">
  <h2 id="sv-h">Two disciplines</h2>
  <div class="branches" data-branches>
    <div class="br-switch" role="group" aria-label="Choose a service"><button type="button" data-branch-btn="n" aria-pressed="true">Notary Public</button><button type="button" data-branch-btn="l" aria-pressed="false">Document assistance <span class="draft">draft</span></button></div>
    <div class="br-panel" data-branch="n">
      <p class="br-lead">Identity checked, oath or acknowledgment taken, journal and certificate completed, at your place or hers.</p>
      <ul class="svc">${notary.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ul>
      <p class="pending">Being confirmed: ${notaryPending.join(' · ')}</p>
    </div>
    <div class="br-panel br-lda" data-branch="l">
      <p class="br-lead">Help preparing your own documents, at your specific direction. Not an attorney; no legal advice; by appointment only.</p>
      <ul class="svc">${lda.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ul>
      <p class="lda-note">${draft()} ${ldaNote}</p>
    </div>
  </div>
</div></section>
${thread('M0 70 C 300 120, 500 0, 760 50 S 1100 110, 1200 40', 'flip')}
<section class="ways" aria-labelledby="w-h"><div class="wrap">
  <h2 id="w-h">Two ways to meet</h2>
  <div class="ways-grid">
    <div class="way" data-reveal><h3>At your door</h3><p>Home, office or an agreed place in 16 cities and communities. Travel quoted and agreed first; same-day by prior agreement.</p></div>
    <svg class="divider" viewBox="0 0 40 300" aria-hidden="true" data-draw="1400"><path d="M20 0 C 5 80, 35 150, 20 300"/></svg>
    <div class="way" data-reveal><h3>At her desk</h3><p>In Citrus Heights by appointment; the address is shared on confirmation. Document assistance is offered this way only.</p></div>
  </div>
</div></section>
${thread('M0 50 C 250 0, 450 120, 700 70 S 1050 20, 1200 80')}
<section class="creds" aria-labelledby="cr-h"><div class="wrap creds-grid">
  <h2 id="cr-h">The commission</h2>
  <div class="commission" data-reveal><span class="no">${biz.notary.number}</span><p>California Notary Public commission, issued by the Secretary of State. Expires ${biz.notary.expires}.</p></div>
  <p class="small">Document-assistance registration details appear only once verified with Sacramento County.</p>
</div></section>
${thread('M0 60 C 220 110, 520 10, 720 60 S 1040 110, 1200 50', 'flip')}
<section class="area" id="area" aria-labelledby="a-h"><div class="wrap area-grid">
  <div><h2 id="a-h">Where she travels</h2>${cityText()}</div>
  ${areaMap('map')}
</div></section>
<section class="fees" id="fees" aria-labelledby="f-h"><div class="wrap">
  <h2 id="f-h">Fees, written plainly</h2>
  <div class="fees-grid">
    <div data-reveal><h3>Notary</h3><p><span class="num">Up to $15</span> per signature (acknowledgment) or per person sworn (jurat), the California maximum. Travel and weekend appointments are quoted and agreed first.</p></div>
    <div class="fee-lda" data-reveal><h3>Document assistance ${draft()}</h3><p>Quoted per job in a written contract before work begins. Never combined with notary fees.</p></div>
  </div>
  <p class="small">Payment at the appointment: Zelle, cash or check.</p>
</div></section>
<section class="about" id="about" aria-labelledby="ab-h"><div class="wrap about-grid">
  <img src="../assets/images/liudmyla-cutout-head.webp" width="480" height="584" alt="Liudmyla Petruk" loading="lazy">
  <div><h2 id="ab-h">Liudmyla Petruk</h2><svg class="underline" viewBox="0 0 300 24" aria-hidden="true" data-draw="1200"><path d="M2 16 C 60 4, 120 22, 180 12 S 270 6, 298 14"/></svg>
  <p>A California Notary Public based in Citrus Heights. She explains each step before you sign, checks identity carefully and records every act in her journal, in English, Ukrainian or Russian. She does not give legal advice.</p></div>
</div></section>
<section class="contact" id="contact" aria-labelledby="c-h"><div class="wrap">
  <h2 id="c-h">Let's find a time.</h2>
  <a class="phone" href="tel:${tel}">${phone}</a>
  <svg class="end" viewBox="0 0 600 60" aria-hidden="true" data-draw="1800"><path d="M2 40 C 100 10, 180 55, 260 30 S 420 5, 480 35 C 520 55, 560 20, 598 28"/></svg>
  <p>${hours} · weekends by arrangement · <a href="mailto:${email}">${email}</a></p>
</div></section>
</main>
<footer class="foot"><div class="wrap"><p>${legal}</p><p class="small">${credit} The line motif is decorative and is not a signature or an official mark.</p></div></footer>
</body></html>
`;

/* ======================== C · Modern Personal Studio ======================== */
const expC = () => head('Liudmyla Petruk — Notary Public · Experiment C', 'xc', 'Experiment C: modern personal studio.') + header(`<a class="brand" href="#main"><span class="mark" aria-hidden="true">LP</span><span translate="no">Liudmyla Petruk</span></a>`) + `
<main id="main">
<section class="hero">
  <div class="hero-grid">
    <div class="hero-text">
      <h1><span data-enter="up">The notary</span> <span data-enter="up">who comes</span> <span data-enter="up">to you.</span></h1>
      <p class="lede" data-enter="up">Liudmyla Petruk, California Notary Public. Mobile notarization across Sacramento and Placer counties, or an appointment in Citrus Heights.</p>
      <div class="actions"><a class="btn btn-primary" href="tel:${tel}">Call ${phone}</a><a class="link" href="#contact">Request an appointment</a></div>
    </div>
    <div class="hero-field">
      <span class="curtain" data-curtain aria-hidden="true"></span>
      <img class="cut" src="../assets/images/liudmyla-cutout-desk.webp" width="1089" height="1364" alt="Liudmyla Petruk at her desk" fetchpriority="high">
      <p class="tag"><strong>No. ${biz.notary.number}</strong>California Notary Public · expires ${biz.notary.expires}</p>
    </div>
  </div>
  <p class="strip"><span>Mobile notarization</span><span>In-person appointments</span><span>English</span><span>Українська</span><span>Русский</span></p>
</section>

<section class="index" id="services" aria-labelledby="sv-h">
  <div class="wrap"><h2 id="sv-h">What she does</h2></div>
  <div class="band band-n"><div class="wrap band-grid">
    <div class="band-head"><p class="band-tag">Notary Public</p><p class="band-sub">Primary · confirmed · mobile or in person</p><a class="btn btn-light" href="tel:${tel}">Book a notary</a></div>
    <ul class="rows">${notary.map(([t, d]) => `<li><span class="r-t">${t}</span><span class="r-d">${d}</span></li>`).join('')}<li class="r-pend"><span class="r-t">${notaryPending.join(' · ')}</span><span class="r-d">Being confirmed</span></li></ul>
  </div></div>
  <div class="band band-l"><div class="wrap band-grid">
    <div class="band-head"><p class="band-tag">Document assistance</p><p class="band-sub">${draft()} By appointment only · not legal advice</p></div>
    <ul class="rows">${lda.map(([t, d]) => `<li><span class="r-t">${t}</span><span class="r-d">${d}</span></li>`).join('')}</ul>
    <p class="lda-note">${ldaNote}</p>
  </div></div>
</section>

<section class="ways" aria-labelledby="w-h"><div class="wrap">
  <h2 id="w-h" class="sr-only">Mobile or in person</h2>
  <div class="ways-grid">
    <div class="way" data-reveal><p class="big">Mobile</p><p>She comes to your home, office or an agreed place in 16 cities. Travel quoted first; same day by prior agreement.</p></div>
    <div class="way" data-reveal><p class="big">In person</p><p>Meet in Citrus Heights by appointment; address shared on confirmation. The only option for document assistance.</p></div>
  </div>
</div></section>

<section class="numbers" aria-labelledby="n-h"><div class="wrap num-grid">
  <h2 id="n-h">Credentials and fees, in numbers</h2>
  <dl data-reveal>
    <div><dt>${biz.notary.number}</dt><dd>California Notary Public commission, Secretary of State</dd></div>
    <div><dt>2029</dt><dd>Commission valid until ${biz.notary.expires}</dd></div>
    <div><dt>$15</dt><dd>Maximum per notarized signature or per person sworn, by California law</dd></div>
    <div><dt>3</dt><dd>Languages: English, Ukrainian, Russian</dd></div>
  </dl>
</div></section>

<section class="area" id="area" aria-labelledby="a-h"><div class="wrap area-grid">
  <div><h2 id="a-h">Sixteen places, two counties</h2>${cityText()}</div>
  ${areaMap('map')}
</div></section>

<section class="fees" id="fees" aria-labelledby="f-h"><div class="wrap fees-grid">
  <h2 id="f-h">Fees, before you book</h2>
  <ul class="fee-rows" data-reveal>
    <li><span>Notarial fee</span><strong>Up to $15</strong><em>per signature or per person sworn</em></li>
    <li><span>Mobile travel</span><strong>Quoted</strong><em>agreed before booking</em></li>
    <li><span>Weekend / special</span><strong>Quoted</strong><em>by prior arrangement</em></li>
    <li class="fr-lda"><span>Document assistance ${draft()}</span><strong>Quote</strong><em>written contract, separate from notary fees</em></li>
  </ul>
  <p class="small">Payment at the appointment: Zelle, cash or check.</p>
</div></section>

<section class="about" id="about" aria-labelledby="ab-h"><div class="wrap about-grid">
  <img src="../assets/images/liudmyla-cutout-head.webp" width="480" height="584" alt="Liudmyla Petruk" loading="lazy">
  <div><h2 id="ab-h">Hello, this is Liudmyla.</h2><p class="about-lead">California Notary Public in Citrus Heights.</p><p>She explains each step before you sign, checks identity carefully and records every act in her journal, in English, Ukrainian or Russian. She does not give legal advice.</p></div>
</div></section>

<section class="contact" id="contact" aria-labelledby="c-h"><div class="wrap">
  <h2 id="c-h">Call to book.</h2>
  <a class="phone" href="tel:${tel}">${phone}</a>
  <p>${hours} · weekends by arrangement · <a href="mailto:${email}">${email}</a></p>
</div></section>
</main>
<footer class="foot"><div class="wrap foot-grid"><p class="foot-name" translate="no">Liudmyla Petruk</p><p>${legal}</p><p class="small">${credit}</p></div></footer>
</body></html>
`;

for (const [dir, fn] of [['experiment-a-portrait', expA], ['experiment-a2-signature-scroll', expA2], ['experiment-b-signature', expB], ['experiment-c-studio', expC]]) {
  mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, dir, 'index.html'), fn());
  console.log(dir);
}
// A2 stylesheet = A's stylesheet + A2 overrides, so A2 stays a self-contained folder.
writeFileSync(join(root, 'experiment-a2-signature-scroll', 'styles.css'), readFileSync(join(root, 'experiment-a-portrait', 'styles.css'), 'utf8') + String.fromCharCode(10) + readFileSync(join(root, '_build', 'a2.css'), 'utf8'));
