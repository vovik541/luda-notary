// Round 3 prototype behaviour (concepts 07–08): menu, language notice, two-category contact form, entrances.
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
    panel.addEventListener('click', (e) => { if (e.target.closest('a[href$=".html"], a[href*=".html?"], a[href^="tel:"]')) set(false); });
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

  // Contact form: choose the service category first, then only that category's fields are shown and enabled.
  $$('[data-dual-form]').forEach((form) => {
    const radios = $$('input[name="category"]', form);
    const groups = $$('[data-for]', form);
    const status = form.querySelector('.f-status');
    const submit = form.querySelector('[type="submit"]');
    const apply = () => {
      const val = (radios.find((r) => r.checked) || {}).value || '';
      groups.forEach((g) => { const on = g.dataset.for === val; g.hidden = !on; g.disabled = !on; });
      form.dataset.category = val;
      submit.textContent = val === 'lda' ? 'Send inquiry (draft preview)' : 'Send request';
      submit.disabled = !val;
    };
    const fromUrl = new URLSearchParams(location.search).get('type');
    if (fromUrl) { const r = radios.find((x) => x.value === fromUrl); if (r) r.checked = true; }
    radios.forEach((r) => r.addEventListener('change', apply));
    apply();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = form.elements.name.value.trim() && (form.elements.phone.value.trim() || form.elements.email.value.trim());
      status.dataset.state = ok ? 'ok' : 'error';
      status.textContent = !ok ? 'Please add your name and a phone number or email.'
        : form.dataset.category === 'lda'
          ? 'Prototype only: nothing was sent. Document-assistance inquiries are an internal draft until LDA registration is verified.'
          : 'Prototype only: nothing was sent. On the live site Liudmyla would reply to confirm the time, place and fee.';
    });
  });

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('[data-rv]').forEach((el) => { el.classList.add('rv'); io.observe(el); });
  }
})();
