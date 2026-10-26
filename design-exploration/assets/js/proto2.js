// Round 2 prototype behaviour (concepts 04–06): menu, language notice, demo form, gentle entrances.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $$('[data-nav-toggle]').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const label = btn.querySelector('.menu-label');
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); } });
    panel.addEventListener('click', (e) => { if (e.target.closest('a[href$=".html"], a[href^="tel:"]')) set(false); });
  });

  const msg = { uk: 'Українська версія (/uk/) — у підготовці.', ru: 'Русская версия (/ru/) — в подготовке.' };
  $$('[data-lang-switch]').forEach((sw) => {
    const out = sw.querySelector('.lang-status');
    sw.addEventListener('click', (e) => {
      const a = e.target.closest('[data-lang]');
      if (!a) return;
      e.preventDefault();
      out.textContent = msg[a.dataset.lang] ? `${msg[a.dataset.lang]} Planned route; not yet translated.` : '';
      clearTimeout(out._t); out._t = setTimeout(() => (out.textContent = ''), 6000);
    });
  });

  $$('[data-proto-form]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const s = f.querySelector('.f-status');
    const ok = f.elements.name.value.trim() && (f.elements.phone.value.trim() || f.elements.email.value.trim());
    s.dataset.state = ok ? 'ok' : 'error';
    s.textContent = ok ? 'Prototype only: nothing was sent or stored. On the live site Liudmyla would reply to confirm time, place and fee.' : 'Please add your name and a phone number or email.';
  }));

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('[data-rv]').forEach((el) => { el.classList.add('rv'); io.observe(el); });
  }
})();
