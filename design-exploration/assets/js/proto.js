// Prototype behaviour shared by all three concepts. No dependencies, nothing is sent anywhere.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Mobile menu
  $$('[data-nav-toggle]').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      if (open) panel.querySelector('a, button')?.focus();
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); } });
  });

  // Language switcher: shows the planned route instead of navigating to pages that do not exist yet
  const names = { uk: 'Українська версія — /uk/ — у підготовці', ru: 'Русская версия — /ru/ — в подготовке' };
  $$('[data-lang-switch]').forEach((sw) => {
    const out = sw.querySelector('.lang-status');
    sw.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lang]');
      if (!b) return;
      e.preventDefault();
      out.textContent = b.dataset.lang === 'en' ? '' : `${names[b.dataset.lang]}. Planned route; translation not yet written.`;
      clearTimeout(out._t); out._t = setTimeout(() => (out.textContent = ''), 6000);
    });
  });

  // City checker
  $$('[data-checker]').forEach((f) => {
    const sel = f.querySelector('select'), out = f.querySelector('.checker-out');
    sel.addEventListener('change', () => {
      const o = sel.selectedOptions[0];
      if (!sel.value) return;
      if (sel.value === '__other') { out.textContent = 'Not on the list yet. Call or text to ask; travel outside the listed cities is not guaranteed.'; return; }
      if ('pending' in o.dataset) { out.textContent = `${o.value} (${o.dataset.county}) is inside the area Liudmyla described but is still pending confirmation. Please ask first.`; return; }
      out.textContent = 'base' in o.dataset
        ? `${o.value} is Liudmyla's home base. Visit her by appointment, or she can come to you. Travel is quoted before the appointment.`
        : `Yes, ${o.value} (${o.dataset.county}) is on the service list. The travel fee is quoted individually and confirmed before the appointment.`;
    });
  });

  // Prototype forms: never submitted
  $$('[data-proto-form]').forEach((f) => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = f.querySelector('.f-status');
      const name = f.elements.name?.value.trim(), phone = f.elements.phone?.value.trim(), email = f.elements.email?.value.trim();
      if (!name || (!phone && !email)) { s.textContent = 'Please add your name and a phone number or email.'; s.dataset.state = 'error'; return; }
      s.dataset.state = 'ok';
      s.textContent = 'Prototype only: nothing was sent or stored. In the live site this request would reach Liudmyla, who confirms the time, place and fee before booking.';
    });
  });

  // Tabs (without JS every panel stays visible as a plain list)
  $$('[data-tabs]').forEach((box) => {
    const tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    const select = (t, focus) => {
      tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
      panels.forEach((p) => (p.hidden = p.id !== t.getAttribute('aria-controls')));
      if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    select(tabs[0]);
  });

  // Appointment checklist (stays a plain list of checkboxes without JS)
  $$('[data-checklist]').forEach((list) => {
    const boxes = $$('input[type="checkbox"]', list), out = list.querySelector('.cl-out');
    const upd = () => {
      const n = boxes.filter((b) => b.checked).length;
      out.textContent = n === boxes.length ? 'All set. You are ready for your appointment.' : `${n} of ${boxes.length} ready`;
      list.style.setProperty('--done', n / boxes.length);
    };
    boxes.forEach((b) => b.addEventListener('change', upd)); upd();
  });

  // Section entrances (content stays visible without JS or with reduced motion)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('[data-rv]').forEach((el) => { el.classList.add('rv'); io.observe(el); });
  }
})();
