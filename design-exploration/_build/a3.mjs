// Experiment A3: the approved A2 page, unchanged, plus a reviews carousel, a FAQ chat with Liudmyla,
// a three-step appointment request, a full footer and a separate reviews page (reviews.html).
// Reads the built A2 (run exp.mjs first) so the A2 design itself stays the single source.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVIEWS, RATING, GOOGLE } from './reviews.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const NL = String.fromCharCode(10);
const a2 = readFileSync(join(root, 'experiment-a2-signature-scroll', 'index.html'), 'utf8');
const TEL = '+19163013829', PHONE = '+1 (916) 301-3829', MAIL = 'mila.petruk.ca@gmail.com';

// ---------- Reviews ----------
const stars = '<span class="stars" role="img" aria-label="Rated 5 out of 5">★★★★★</span>';
const card = (r, cls = 'review') => `<figure class="${cls}">${stars}<blockquote><p>${r.text}${r.excerpt ? ' …' : ''}</p></blockquote><figcaption><span class="rv-name" translate="no">${r.name}</span><span class="rv-src">Google review${r.from ? ` · translated from ${r.from} by Google` : ''}${r.excerpt ? ' · excerpt' : ''}</span></figcaption></figure>`;
const homeReviews = REVIEWS.filter((r) => r.home);

const reviewsSection = `<section class="reviews" id="reviews" aria-labelledby="rv-h"><div class="wrap">
  <div class="reviews-top">
    <div><h2 data-sig-stop id="rv-h">In clients’ words</h2><p class="small">${RATING.score} on Google from ${RATING.count} reviews. Shown as written.</p></div>
    <div class="car-controls"><span class="car-count" aria-hidden="true"><b data-car-index>01</b> / ${String(homeReviews.length).padStart(2, '0')}</span><button class="car-btn" type="button" data-car-prev aria-label="Previous reviews" disabled><span aria-hidden="true">←</span></button><button class="car-btn" type="button" data-car-next aria-label="Next reviews"><span aria-hidden="true">→</span></button></div>
  </div>
  <div class="carousel" data-carousel>
    <ul class="car-track" tabindex="0" aria-label="Client reviews, scroll sideways for more">
${homeReviews.map((r) => `      <li>${card(r, 'review rcard')}</li>`).join(NL)}
    </ul>
  </div>
  <p class="reviews-links"><a href="reviews.html">All reviews</a><a href="${GOOGLE}" rel="noopener" target="_blank">Read on Google</a><a href="${GOOGLE}/review" rel="noopener" target="_blank">Leave a review</a></p>
</div></section>`;

// ---------- FAQ as a chat with Liudmyla (answers in her voice, facts only) ----------
const faq = [
  ['What should I bring?', 'A current government-issued photo ID for every signer (driver’s license, state ID or passport) and the complete document. Please leave the signature lines blank unless I tell you otherwise: a jurat must be signed in front of me.'],
  ['How much does it cost?', 'The notarial fee is up to $15 per signature for an acknowledgment, or per person sworn for a jurat, the California maximum. I quote travel before booking, and you pay at the appointment by Zelle, cash or check.'],
  ['Do you come to me?', 'Yes. I travel to homes, offices and other agreed places across Sacramento and Placer counties. You can also meet me in Citrus Heights by appointment.'],
  ['Can you give legal advice?', 'No. As a California notary I can’t give legal advice or decide which document you need. For that, please speak with an attorney.'],
  ['Can you help prepare my documents?', 'Document assistance is a separate service, prepared at your direction and quoted in a written contract. <span class="draft">Internal draft</span> Details are being confirmed before publication.'],
  ['Which languages do you speak?', 'English, Ukrainian or Russian, whichever is easiest for you.'],
  ['Can I text you first?', `Of course. Text me at <a href="sms:${TEL}">${PHONE}</a> with your city and the type of document.`],
];
const faqSection = `<section class="faq" id="faq" aria-labelledby="fq-h"><div class="wrap">
  <h2 data-sig-stop id="fq-h">Questions, answered</h2>
  <div class="faq-chat" data-chat>
    <div class="chat-qs" role="group" aria-label="Questions">
${faq.map(([q], i) => `      <button type="button" class="chat-q" data-q="${i}">${q}</button>`).join(NL)}
    </div>
    <div class="chat-window">
      <div class="chat-head"><img src="../assets/images/liudmyla-cutout-head.webp" width="480" height="584" alt=""><p><b translate="no">Liudmyla</b><span>Notary Public · general information, not legal advice</span></p></div>
      <div class="chat-log" role="log" aria-live="polite" aria-label="Answers"><p class="bubble from-her">Hi, I’m Liudmyla. Pick a question and I’ll answer here.</p></div>
    </div>
    <dl class="chat-answers">
${faq.map(([q, a]) => `      <div><dt>${q}</dt><dd>${a}</dd></div>`).join(NL)}
    </dl>
  </div>
</div></section>`;

// ---------- Appointment request in three steps ----------
const cities = ['Antelope', 'Arden-Arcade', 'Auburn', 'Carmichael', 'Citrus Heights', 'Elk Grove', 'Fair Oaks', 'Folsom', 'Lincoln', 'Loomis', 'North Highlands', 'Orangevale', 'Rancho Cordova', 'Rio Linda', 'Rocklin', 'Roseville', 'Sacramento', 'Other / not sure'];
const stepNav = (n) => `<div class="step-nav">${n > 1 ? '<button type="button" class="step-back" data-step-back>← Back</button>' : ''}${n < 3 ? '<button type="button" class="btn btn-primary" data-step-next>Continue</button>' : '<button class="btn btn-primary" type="submit">Send request</button>'}</div>`;
const bookSection = `<section class="book" id="book" aria-labelledby="bk-h"><div class="wrap book-grid">
  <div class="book-head"><h2 data-sig-stop id="bk-h">Request an appointment</h2><p>Three short steps. Liudmyla replies to confirm the time, place and fee; nothing is booked until she confirms.</p><p class="small">Prefer to talk? Call or text <a href="tel:${TEL}">${PHONE}</a>.</p></div>
  <form class="book-form" data-steps novalidate>
    <ol class="steps" aria-label="Steps"><li data-step-dot="1" aria-current="step"><span>1</span>Service</li><li data-step-dot="2"><span>2</span>Date &amp; time</li><li data-step-dot="3"><span>3</span>Your details</li><i class="steps-bar" aria-hidden="true"></i></ol>
    <div class="step-viewport">
    <fieldset class="step" data-step="1"><legend tabindex="-1">What do you need?</legend>
      <div class="choice" role="radiogroup" aria-label="Service">
        <label><input type="radio" name="service" value="Notarization" checked> Notarization</label>
        <label><input type="radio" name="service" value="Document assistance"> Document assistance <span class="draft">Internal draft</span></label>
      </div>
      <div class="choice" role="radiogroup" aria-label="Where">
        <label><input type="radio" name="where" value="She comes to me" checked> She comes to me</label>
        <label><input type="radio" name="where" value="I visit her in Citrus Heights" data-office> I visit her in Citrus Heights</label>
      </div>
      <div class="row">
        <label class="field"><span>City</span><select name="city" autocomplete="address-level2" required><option value="">Select a city</option>${cities.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <label class="field"><span>Signers</span><input name="signers" type="number" inputmode="numeric" min="1" max="20" value="1" required></label>
      </div>
      <label class="field"><span>Document <em>optional</em></span><input name="document" type="text" autocomplete="off" placeholder="e.g. power of attorney, grant deed…"></label>
      ${stepNav(1)}
    </fieldset>
    <fieldset class="step" data-step="2"><legend tabindex="-1">When suits you?</legend>
      <div class="row">
        <label class="field"><span>Preferred date</span><input name="date" type="date" required></label>
        <label class="field"><span>Time of day</span><select name="time"><option>Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
      </div>
      <label class="field"><span>Language</span><select name="lang"><option>English</option><option>Українська</option><option>Русский</option></select></label>
      <p class="small">Mon–Thu 10&nbsp;AM–8&nbsp;PM · Fri 10&nbsp;AM–6&nbsp;PM · weekends by arrangement.</p>
      ${stepNav(2)}
    </fieldset>
    <fieldset class="step" data-step="3"><legend tabindex="-1">How can she reach you?</legend>
      <div class="row">
        <label class="field"><span>Your name</span><input name="name" type="text" autocomplete="name" required></label>
        <label class="field"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" spellcheck="false" required></label>
      </div>
      <label class="field"><span>Email <em>optional</em></span><input name="email" type="email" autocomplete="email" spellcheck="false"></label>
      <label class="field"><span>Anything else <em>optional</em></span><textarea name="notes" rows="3" placeholder="Deadline, access notes, a hospital or care-facility visit…"></textarea></label>
      <p class="small">Your details are used only to reply to this request.</p>
      ${stepNav(3)}
    </fieldset>
    <div class="step-done" data-step-done hidden tabindex="-1"><p class="done-title">Request ready</p><p class="done-sum" data-step-summary></p><p class="small">Preview only: nothing was sent. On the live site this goes straight to Liudmyla, who replies to confirm.</p><button type="button" class="step-back" data-step-reset>Start over</button></div>
    </div>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
</div></section>`;

// ---------- Footer ----------
const footer = (home) => `<footer class="foot"><div class="wrap">
  <div class="foot-grid">
    <div class="foot-brand"><img src="../assets/brand/monogram-gold.png" width="202" height="188" alt=""><p class="foot-name" translate="no">Liudmyla Petruk <span>Notary Public · Citrus Heights</span></p><p>Mobile and in-person notary across Sacramento and Placer counties.</p></div>
    <nav aria-label="Footer"><p class="foot-h">Explore</p><ul><li><a href="${home}#services">Services</a></li><li><a href="${home}#area">Service area</a></li><li><a href="${home}#fees">Fees</a></li><li><a href="reviews.html">Reviews</a></li><li><a href="${home}#faq">Questions</a></li><li><a href="${home}#book">Request an appointment</a></li></ul></nav>
    <div><p class="foot-h">Contact</p><ul><li><a href="tel:${TEL}">${PHONE}</a></li><li><a href="sms:${TEL}">Text first</a></li><li><a href="mailto:${MAIL}">${MAIL}</a></li><li><a href="${GOOGLE}" rel="noopener" target="_blank">Google profile</a></li></ul></div>
    <div><p class="foot-h">Hours</p><p>Mon–Thu 10&nbsp;AM–8&nbsp;PM<br>Fri 10&nbsp;AM–6&nbsp;PM<br>Weekends by arrangement</p></div>
  </div>
  <p class="foot-legal">California Notary Public · Commission No. 2538244 · Expires November 6, 2029. I am not an attorney and, therefore, cannot give legal advice about immigration or any other legal matters. California limits the notarial fee to $15 per signature (acknowledgment) or per person (jurat); travel and other fees are quoted and agreed in advance.</p>
  <div class="foot-bar"><p>© 2026 Liudmyla Petruk</p><p>Design &amp; development: <span translate="no">ReIskra</span> · <span translate="no">Volodymyr Khymych</span></p></div>
  <p class="foot-credit">Portrait: Liudmyla Petruk. Fonts: Literata, Inter; the scroll line is written in EMS Allure (SIL Open Font License).</p>
</div></footer>`;

// ---------- Home page ----------
const swapFooter = (html, home) => html.replace(/<footer class="foot">[\s\S]*?<\/footer>/, footer(home));
let h = a2
  .replace('Liudmyla Petruk — Notary Public · Experiment A2', 'Liudmyla Petruk — Notary Public · Experiment A3')
  .replace('Experiment A2: portrait with a scroll-drawn signature line.', 'Experiment A3: the A2 page with reviews, a FAQ chat, a three-step appointment request and a full footer.')
  .replace('<a class="link" href="#contact">Request an appointment</a>', '<a class="link" href="#book">Request an appointment</a>')
  .replace('<a href="#fees">Fees</a><a href="#about">About</a>', '<a href="#fees">Fees</a><a href="reviews.html">Reviews</a><a href="#about">About</a>')
  .replace('<section class="contact" id="contact"', [reviewsSection, faqSection, bookSection, ''].join(NL + NL) + '<section class="contact" id="contact"');
h = swapFooter(h, '');
for (const s of ['class="reviews"', 'class="faq"', 'class="book"', 'href="#book"', 'href="reviews.html">Reviews', 'ReIskra']) if (!h.includes(s)) throw new Error('A3 insert failed: ' + s);

const dir = join(root, 'experiment-a3-complete');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'index.html'), h);
writeFileSync(join(dir, 'styles.css'), readFileSync(join(root, 'experiment-a2-signature-scroll', 'styles.css'), 'utf8') + NL + readFileSync(join(root, '_build', 'a3.css'), 'utf8'));

// ---------- Reviews page: same header and footer, its own main ----------
const head = h.slice(0, h.indexOf('<main id="main"'))
  .replace('<title>Liudmyla Petruk — Notary Public · Experiment A3</title>', '<title>Reviews — Liudmyla Petruk, Notary Public · Experiment A3</title>')
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="Google reviews for Liudmyla Petruk, Notary Public in Citrus Heights: ${RATING.score} from ${RATING.count} reviews.">`)
  .replace(/href="#(services|area|fees|about|contact)"/g, 'href="index.html#$1"')
  .replace('<a href="reviews.html">Reviews</a>', '<a href="reviews.html" aria-current="page">Reviews</a>');
const reviewsPage = `${head}<main id="main" class="rv-page">
<section class="rv-hero"><div class="wrap">
  <p class="rv-crumb"><a href="index.html">Home</a> / Reviews</p>
  <h1>What clients say</h1>
  <p class="rv-score">${stars}<span><b>${RATING.score}</b> on Google · ${RATING.count} reviews</span></p>
  <p class="small">Shown as written. Reviews written in Ukrainian or Russian appear in Google’s English translation; names use English spelling. ${REVIEWS.length} reviews with comments, as of ${RATING.asOf}.</p>
  <p class="reviews-links"><a href="${GOOGLE}" rel="noopener" target="_blank">Read on Google</a><a href="${GOOGLE}/review" rel="noopener" target="_blank">Leave a review</a></p>
</div></section>
<section class="rv-list" aria-labelledby="rl-h"><div class="wrap"><h2 class="sr-only" id="rl-h">All reviews</h2><div class="rv-grid">
${REVIEWS.map((r) => '  ' + card(r)).join(NL)}
</div></div></section>
<section class="rv-cta"><div class="wrap"><p>Ready when you are.</p><div class="rv-cta-actions"><a class="btn btn-primary" href="index.html#book">Request an appointment</a><a class="link" href="tel:${TEL}">Call ${PHONE}</a></div></div></section>
</main>
${footer('index.html')}
</body></html>
`;
writeFileSync(join(dir, 'reviews.html'), reviewsPage);
console.log('experiment-a3-complete (index.html, reviews.html)');
