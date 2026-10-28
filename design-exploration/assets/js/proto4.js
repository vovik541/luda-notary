// Experiments A–C: menu, language switch, branch switch, reveals and line drawing.
// Web Animations API + CSS only. Content is visible without JS; reduced motion skips every movement.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(.2,.7,.2,1)';

  // Menu
  $$('[data-nav-toggle]').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      const l = btn.querySelector('.menu-label'); if (l) l.textContent = open ? 'Close' : 'Menu';
      if (open && !still) $$('a', panel).forEach((a, i) => a.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 40 * i, easing: ease, fill: 'backwards' }));
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); } });
    panel.addEventListener('click', (e) => { if (e.target.closest('a[href]')) set(false); });
  });

  // Language switch: sliding indicator + planned-route notice
  const note = { en: '', uk: 'Українська версія (/uk/) — у підготовці.', ru: 'Русская версия (/ru/) — в подготовке.' };
  $$('[data-lang]').forEach((sw) => {
    const out = sw.querySelector('.lang-note');
    const ind = sw.querySelector('.lang-ind');
    const place = (a) => { if (ind) ind.style.transform = `translateX(${a.offsetLeft}px) scaleX(${a.offsetWidth})`; };
    const cur = sw.querySelector('[aria-current]'); if (cur) requestAnimationFrame(() => place(cur));
    sw.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-l]'); if (!a) return;
      e.preventDefault();
      place(a);
      if (out) { out.textContent = note[a.dataset.l] ? `${note[a.dataset.l]} Planned route; not yet translated.` : ''; clearTimeout(out._t); out._t = setTimeout(() => { out.textContent = ''; place(sw.querySelector('[aria-current]')); }, 5000); }
    });
  });

  // Branch switch (Notary / Document assistance). Without JS both panels show.
  $$('[data-branches]').forEach((box) => {
    const btns = $$('[data-branch-btn]', box), panels = $$('[data-branch]', box);
    box.classList.add('is-js');
    const show = (id, animate) => {
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.branchBtn === id)));
      panels.forEach((p) => {
        const on = p.dataset.branch === id;
        p.hidden = !on;
        if (on && animate && !still) p.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: ease });
      });
    };
    // State lives in the URL (?service=…) so a chosen branch can be shared or reloaded.
    btns.forEach((b) => b.addEventListener('click', () => { show(b.dataset.branchBtn, true); const u = new URL(location.href); u.searchParams.set('service', b.dataset.branchBtn); history.replaceState(null, '', u); }));
    const fromUrl = new URLSearchParams(location.search).get('service');
    show(btns.some((b) => b.dataset.branchBtn === fromUrl) ? fromUrl : btns[0].dataset.branchBtn, false);
  });

  // Signature line (A2): a single path built from the page's own sections. It stays in the side margins
  // inside each section and crosses over only in the empty band between sections, so it never runs over text.
  // Some crossings write her name, the Lp monogram or the phone number in a single-stroke script (sig-glyphs.js).
  // Scroll only advances how much of the path is drawn, mapped so the pen tip stays inside the viewport.
  $$('[data-sigline]').forEach((svg) => {
    const host = svg.parentElement, path = svg.querySelector('path'), nib = svg.querySelector('circle');
    const G = window.SIG_GLYPHS || {};
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Chrome restarts the dash pattern at every subpath (each pen lift in a word), so the visible stroke is
    // split into one path per subpath, each revealed by its own offset. The original path stays as the guide.
    const ink = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.insertBefore(ink, nib); path.style.visibility = 'hidden';
    let L = 0, raf = 0, marks = [], parts = [];
    // glyph paths are in font units (baseline 0): scale and move every x y pair
    const place = (w, s, ox, oy) => w.d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${(ox + x * s).toFixed(1)} ${(oy + y * s).toFixed(1)}`);
    const ends = (d) => { const n = d.match(/-?[\d.]+/g).map(Number); return [n[0], n[1], n[n.length - 2], n[n.length - 1]]; };
    const build = () => {
      const W = host.clientWidth, top = host.getBoundingClientRect().top + scrollY, vh = innerHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${host.scrollHeight}`);
      const gutter = W < 700 ? 9 : Math.max(22, Math.min(64, (W - 1320) / 2 + 30));
      const xs = [W - gutter, gutter];
      // Content bounds of a section: from its first visible block to its last one (ignores empty padding/margins).
      const bounds = (sec) => {
        const kids = $$('.wrap > *, .wrap > * > *', sec).filter((e) => e.offsetHeight > 0 && getComputedStyle(e).position !== 'absolute');
        const rs = (kids.length ? kids : [sec]).map((e) => e.getBoundingClientRect());
        return { top: Math.min(...rs.map((r) => r.top)) + scrollY - top, bottom: Math.max(...rs.map((r) => r.bottom)) + scrollY - top };
      };
      // a section with its own background (beige, navy) keeps written words out of its area
      const tinted = (sec) => { const c = getComputedStyle(sec).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'; };
      const stops = $$('[data-sig-stop]', host).map((h) => {
        const sec = h.closest('section') || h, b = bounds(sec), r = sec.getBoundingClientRect();
        return { contentTop: b.top, contentBottom: b.bottom, secTop: r.top + scrollY - top, secBottom: r.bottom + scrollY - top, tinted: tinted(sec) };
      });
      if (!stops.length) return;
      const hero = host.querySelector('.hero');
      // start just below the hero so the first swoop never crosses the credential plate
      let y = hero ? bounds(hero).bottom + 12 : 0;
      // words are written only on left-to-right crossings; pick the start side so the last one (the phone) is one
      let side = (stops.length - 1) % 2 ? 0 : 1, d = `M ${xs[side]} ${y}`;
      // marks: path length reached when the 70% line of the viewport is at page offset k
      marks = [{ len: 0, k: y - vh * 0.3 }];
      const mark = (k) => { probe.setAttribute('d', d); marks.push({ len: probe.getTotalLength(), k: Math.max(k, marks[marks.length - 1].k + 1) }); };
      const words = ['Liudmyla', 'Petruk', 'Lp', 'Notary']; let wi = 0;
      stops.forEach((s, i) => {
        const prevEnd = i ? stops[i - 1].contentBottom : y;
        const crossTop = Math.max(y + 20, prevEnd + 16);
        const crossEnd = Math.max(crossTop + 60, s.contentTop - 16);
        const xa = xs[side], ns = 1 - side, xb = xs[ns], dir = Math.sign(xb - xa);
        const mid = (crossTop + crossEnd) / 2, mx = (xa + xb) / 2;
        if (crossTop > y + 1) d += ` C ${xa} ${(y + crossTop) / 2 - 30}, ${xa + (side ? 10 : -10)} ${(y + crossTop) / 2 + 30}, ${xa} ${crossTop}`;
        mark(crossTop - vh * 0.25);
        const name = dir < 0 ? '' : i === stops.length - 1 ? 'phone' : words[wi++ % words.length];
        const w = G[name];
        // the word stays inside the plain band: off tinted sections, between the gutters
        const prev = stops[i - 1], wTop = prev && prev.tinted ? Math.max(crossTop, prev.secBottom + 10) : crossTop;
        const wBot = s.tinted ? Math.min(crossEnd, s.secTop - 10) : crossEnd;
        const s2 = w ? Math.min(W < 700 ? 0.045 : 0.07, (W - 2 * gutter - 60) / w.w, (wBot - wTop - 16) / 950) : 0;
        if (s2 >= 0.025) {
          const ox = (W - w.w * s2) / 2, oy = (wTop + wBot) / 2 + 260 * s2, word = place(w, s2, ox, oy);
          const [sx, sy, ex, ey] = ends(word);
          // lead in from the left margin, write, then run out to the right margin
          d += ` C ${xa} ${mid}, ${sx - 90} ${sy}, ${sx} ${sy} ${word} C ${ex + 90} ${ey}, ${xb} ${mid}, ${xb} ${crossEnd}`;
          mark(Math.max(crossEnd + vh * 0.1, marks[marks.length - 1].k + vh * 0.35));
        } else {
          // a small cursive loop in the middle of the crossing
          d += ` C ${xa} ${mid}, ${mx - dir * 120} ${mid}, ${mx} ${mid}`;
          d += ` C ${mx + dir * 40} ${mid}, ${mx + dir * 40} ${mid - 34}, ${mx + dir * 18} ${mid - 34} C ${mx - dir * 4} ${mid - 34}, ${mx - dir * 2} ${mid}, ${mx + dir * 30} ${mid + 4}`;
          d += ` C ${mx + dir * 120} ${mid + 8}, ${xb} ${mid}, ${xb} ${crossEnd}`;
          mark(Math.max(crossEnd + vh * 0.1, marks[marks.length - 1].k + vh * 0.15));
        }
        side = ns; y = crossEnd;
      });
      // finish in the gutter beside the last section's content, never across it
      const endY = Math.max(y + 40, stops[stops.length - 1].contentBottom);
      d += ` C ${xs[side]} ${(y + endY) / 2}, ${xs[side] + (side ? 4 : -4)} ${endY - 20}, ${xs[side]} ${endY}`;
      mark(endY - vh * 0.25);
      path.setAttribute('d', d);
      L = path.getTotalLength();
      ink.replaceChildren(); parts = []; let at = 0;
      for (const sub of d.split(/(?=M)/)) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', sub); el.setAttribute('class', 'sig-path'); ink.append(el);
        const len = el.getTotalLength();
        el.style.strokeDasharray = `${len + 1} ${len + 1}`;
        parts.push({ el, start: at, len }); at += len;
      }
      draw();
    };
    const draw = () => {
      raf = 0;
      if (still) { parts.forEach((q) => { q.el.style.strokeDashoffset = 0; }); nib.style.display = 'none'; return; }
      if (!marks.length) return;
      const t = innerHeight * 0.7 - host.getBoundingClientRect().top;
      let len = L;
      for (let i = 1; i < marks.length; i++) {
        const a = marks[i - 1], b = marks[i];
        if (t < b.k) { len = t <= a.k ? a.len : a.len + (b.len - a.len) * (t - a.k) / (b.k - a.k); break; }
      }
      parts.forEach((q) => { q.el.style.strokeDashoffset = q.len + 1 - Math.min(q.len + 1, Math.max(0, len - q.start)); });
      const pt = path.getPointAtLength(len);
      nib.setAttribute('cx', pt.x); nib.setAttribute('cy', pt.y);
      svg.classList.toggle('is-drawing', len > 1 && len < L - 1);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(draw); }, { passive: true });
    // rebuild when the layout changes: window size, or content that grows and shrinks (form steps, chat)
    let t, lastH = 0; const later = () => { clearTimeout(t); t = setTimeout(build, 150); };
    addEventListener('resize', later);
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (Math.abs(host.scrollHeight - lastH) > 2) { lastH = host.scrollHeight; later(); } }).observe(host);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build); else build();
    addEventListener('load', build);
  });

  // Reviews carousel (A3): native horizontal scroll with snap; the arrows move by one card.
  // Cards in view come up to full strength; without JS it is a plain scrollable row.
  $$('[data-carousel]').forEach((car) => {
    const track = car.querySelector('.car-track'), items = [...track.children];
    const sec = car.closest('section') || document;
    const prev = sec.querySelector('[data-car-prev]'), next = sec.querySelector('[data-car-next]'), idx = sec.querySelector('[data-car-index]');
    car.classList.add('is-js');
    const step = () => items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth;
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      if (idx) idx.textContent = String(Math.min(items.length, Math.round(track.scrollLeft / step()) + 1)).padStart(2, '0');
    };
    const go = (dir) => track.scrollBy({ left: dir * step(), behavior: still ? 'auto' : 'smooth' });
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); } });
    let r = 0; track.addEventListener('scroll', () => { if (!r) r = requestAnimationFrame(() => { r = 0; sync(); }); }, { passive: true });
    const seen = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-in', e.intersectionRatio > 0.6)), { root: track, threshold: [0, 0.6, 1] });
    items.forEach((li) => seen.observe(li));
    addEventListener('resize', sync); sync();
  });

  // FAQ chat (A3): a question becomes your bubble, a short typing pause, then Liudmyla's answer.
  // The answers come from the plain list that shows when JavaScript is off.
  $$('[data-chat]').forEach((chat) => {
    const log = chat.querySelector('.chat-log'), answers = [...chat.querySelectorAll('.chat-answers dd')];
    chat.classList.add('is-js');
    let busy = 0;
    const bubble = (html, who) => {
      const p = document.createElement('p'); p.className = `bubble from-${who}`; p.innerHTML = html; log.append(p);
      if (!still) p.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: ease });
      log.scrollTo({ top: log.scrollHeight, behavior: still ? 'auto' : 'smooth' });
      return p;
    };
    $$('.chat-q', chat).forEach((btn) => btn.addEventListener('click', () => {
      $$('.chat-q', chat).forEach((b) => b.classList.toggle('is-current', b === btn));
      btn.classList.add('is-asked');
      clearTimeout(busy);
      log.querySelector('.typing')?.remove();
      bubble(btn.textContent, 'you');
      const answer = answers[+btn.dataset.q].innerHTML;
      if (still) { bubble(answer, 'her'); return; }
      const t = bubble('<i></i><i></i><i></i>', 'her'); t.classList.add('typing'); t.setAttribute('aria-hidden', 'true');
      busy = setTimeout(() => { t.remove(); bubble(answer, 'her'); }, 700);
    }));
  });

  // Appointment request in three steps (A3): a design preview, so nothing is sent.
  // Each step is checked before moving on; steps slide sideways (transform/opacity). Without JS all steps show.
  $$('[data-steps]').forEach((form) => {
    const steps = $$('[data-step]', form), dots = $$('[data-step-dot]', form), bar = form.querySelector('.steps-bar');
    const done = form.querySelector('[data-step-done]'), sum = form.querySelector('[data-step-summary]'), out = form.querySelector('.form-status');
    const city = form.elements.city, date = form.elements.date;
    form.classList.add('is-js');
    if (date) date.min = new Date().toISOString().slice(0, 10);
    let cur = 1;
    const syncCity = () => { if (city) city.required = form.elements.where.value === 'She comes to me'; };
    const swap = (from, to, dir) => {
      const show = () => { from.hidden = true; to.hidden = false; (to.querySelector('legend') || to).focus({ preventScroll: true }); };
      if (still) { show(); return; }
      from.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 28}px)` }], { duration: 180, easing: 'ease-in' }).onfinish = () => {
        show();
        to.animate([{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: ease });
      };
      const top = form.getBoundingClientRect().top;
      if (top < 0) form.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    const mark = (n) => {
      dots.forEach((d) => { const k = +d.dataset.stepDot; d.toggleAttribute('aria-current', k === n); if (k === n) d.setAttribute('aria-current', 'step'); d.classList.toggle('is-done', k < n || n > 3); });
      if (bar) bar.style.transform = `scaleX(${Math.min(n, 3) / 3})`;
    };
    const invalid = (step) => $$('input, select, textarea', step).filter((el) => el.willValidate && !el.checkValidity());
    const go = (n) => { const dir = n > cur ? 1 : -1; swap(steps[cur - 1], steps[n - 1], dir); cur = n; mark(n); out.textContent = ''; };
    steps.forEach((s, i) => { s.hidden = i > 0; });
    form.addEventListener('change', (e) => { syncCity(); if (e.target.checkValidity && e.target.checkValidity()) e.target.classList.remove('is-invalid'); });
    form.addEventListener('click', (e) => {
      if (e.target.closest('[data-step-next]')) {
        const bad = invalid(steps[cur - 1]);
        $$('input, select, textarea', steps[cur - 1]).forEach((el) => el.classList.toggle('is-invalid', bad.includes(el)));
        if (bad.length) { out.textContent = 'Please fill in the highlighted fields.'; bad[0].focus(); return; }
        go(cur + 1);
      } else if (e.target.closest('[data-step-back]')) go(cur - 1);
      else if (e.target.closest('[data-step-reset]')) { form.reset(); syncCity(); done.hidden = true; steps.forEach((s, i) => { s.hidden = i > 0; }); cur = 1; mark(1); steps[0].querySelector('legend').focus(); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = steps.flatMap(invalid);
      $$('input, select, textarea', form).forEach((el) => el.classList.toggle('is-invalid', bad.includes(el)));
      if (bad.length) { out.textContent = 'Please fill in the highlighted fields.'; const s = steps.find((x) => x.contains(bad[0])); if (s && !form.classList.contains('is-js')) bad[0].focus(); else { if (+s.dataset.step !== cur) go(+s.dataset.step); bad[0].focus(); } return; }
      const f = form.elements, when = f.date.value ? new Date(f.date.value + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
      sum.textContent = [f.service.value, f.where.value === 'She comes to me' ? `at your place in ${f.city.value}` : 'in Citrus Heights', `${when}, ${f.time.value.toLowerCase()}`, f.name.value].join(' · ');
      swap(steps[cur - 1], done, 1); mark(4); out.textContent = '';
    });
    syncCity(); mark(1);
  });

  if (still) return;

  // Hero entrance: headline lines and portrait. CTA buttons are never hidden or delayed.
  $$('[data-enter]').forEach((el, i) => el.animate(
    [{ opacity: 0, transform: el.dataset.enter === 'up' ? 'translateY(28px)' : el.dataset.enter === 'rise' ? 'translateY(40px) scale(.98)' : 'translateX(-24px)' }, { opacity: 1, transform: 'none' }],
    { duration: 900, delay: 80 + i * 90, easing: ease, fill: 'backwards' }));
  $$('[data-curtain]').forEach((c) => c.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 1100, delay: 250, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'both' }));

  // Section reveals (once) and line drawing
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    if (el.matches('[data-draw]')) {
      $$('path', el).forEach((p, i) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: +(el.dataset.draw || 1600), delay: i * 120, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'backwards' }); });
    } else {
      [...el.children].forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: i * 80, easing: ease, fill: 'backwards' }));
    }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal], [data-draw]').forEach((el) => io.observe(el));
})();
