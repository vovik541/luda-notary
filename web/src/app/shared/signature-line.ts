import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { SIG_GLYPHS } from './sig-glyphs';
import { reducedMotion } from './motion';

/**
 * The scroll-drawn signature line from the approved A2/A3 prototype, ported 1:1.
 * One path built from the page's own sections: it stays in the side margins beside each section and crosses
 * only in the empty band between sections, never over text. Left-to-right crossings write words in a
 * single-stroke script; the last one writes the phone number before the contact block (approved A3 ending).
 * Scroll only advances how much is drawn, mapped so the pen tip stays inside the viewport.
 * Browser only; decorative (aria-hidden). Reduced motion: the line is drawn complete and static.
 */
@Component({
  selector: 'lp-signature-line',
  template: `<svg class="sigline" aria-hidden="true" focusable="false"><path class="sig-guide"/><g></g><circle class="sig-nib" r="3.5"/></svg>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
})
export class SignatureLine {
  /** Words written on left-to-right crossings, in order; the phone number always ends the line. */
  readonly words = input<string[]>(['Liudmyla', 'Petruk', 'Lp', 'Notary']);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const svg = this.el.nativeElement.querySelector('svg') as SVGSVGElement;
      const cleanup = drawSignature(svg, () => this.words());
      destroyRef.onDestroy(cleanup);
    });
  }
}

type Mark = { len: number; k: number };
type Part = { el: SVGPathElement; start: number; len: number };
const NS = 'http://www.w3.org/2000/svg';

function drawSignature(svg: SVGSVGElement, words: () => string[]) {
  const still = reducedMotion();
  const host = svg.closest('main') as HTMLElement;
  const guide = svg.querySelector('path') as SVGPathElement;
  const ink = svg.querySelector('g') as SVGGElement;
  const nib = svg.querySelector('circle') as SVGCircleElement;
  const probe = document.createElementNS(NS, 'path');
  guide.style.visibility = 'hidden';
  let L = 0, raf = 0, marks: Mark[] = [], parts: Part[] = [];

  const place = (d: string, s: number, ox: number, oy: number) =>
    d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${(ox + +x * s).toFixed(1)} ${(oy + +y * s).toFixed(1)}`);
  const ends = (d: string) => { const n = (d.match(/-?[\d.]+/g) ?? []).map(Number); return [n[0], n[1], n[n.length - 2], n[n.length - 1]]; };

  const build = () => {
    const W = host.clientWidth, top = host.getBoundingClientRect().top + scrollY, vh = innerHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${host.scrollHeight}`);
    const gutter = W < 700 ? 9 : Math.max(22, Math.min(64, (W - 1320) / 2 + 30));
    const xs = [W - gutter, gutter];
    // Content bounds of a section: from its first visible block to its last one (ignores padding).
    const bounds = (sec: Element) => {
      const kids = [...sec.querySelectorAll('.wrap > *, .wrap > * > *')].filter((e) => (e as HTMLElement).offsetHeight > 0 && getComputedStyle(e).position !== 'absolute');
      const rs = (kids.length ? kids : [sec]).map((e) => e.getBoundingClientRect());
      return { top: Math.min(...rs.map((r) => r.top)) + scrollY - top, bottom: Math.max(...rs.map((r) => r.bottom)) + scrollY - top };
    };
    const tinted = (sec: Element) => { const c = getComputedStyle(sec).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'; };
    const stops = [...host.querySelectorAll('[data-sig-stop]')].map((h) => {
      const sec = h.closest('section') ?? h, b = bounds(sec), r = sec.getBoundingClientRect();
      return { contentTop: b.top, contentBottom: b.bottom, secTop: r.top + scrollY - top, secBottom: r.bottom + scrollY - top, tinted: tinted(sec) };
    });
    if (!stops.length) return;
    const hero = host.querySelector('.hero');
    let y = hero ? bounds(hero).bottom + 12 : 0;
    // Words are written on left-to-right crossings only; start on the side that makes the last one (the phone) one.
    let side = (stops.length - 1) % 2 ? 0 : 1;
    let d = `M ${xs[side]} ${y}`;
    marks = [{ len: 0, k: y - vh * 0.3 }];
    // Each mark: path length reached when the viewport's 70% line is at page offset k. k is clamped so the pen tip
    // stays between 40% and 100% of the viewport height there (it never lags off the top or runs ahead off the bottom).
    const mark = (k: number) => {
      probe.setAttribute('d', d);
      const len = probe.getTotalLength(), tipY = probe.getPointAtLength(len).y;
      const clamped = Math.min(tipY + vh * 0.28, Math.max(tipY - vh * 0.28, k));
      marks.push({ len, k: Math.max(clamped, marks[marks.length - 1].k + 1) });
    };
    const list = words().filter((w) => SIG_GLYPHS[w]);
    let wi = 0;
    stops.forEach((s, i) => {
      const prevEnd = i ? stops[i - 1].contentBottom : y;
      // The crossing always fits the real gap between two sections' content, however small it is on a phone.
      const crossTop = Math.max(y + 12, prevEnd + 10);
      const crossEnd = Math.max(crossTop + 14, s.contentTop - 10);
      const xa = xs[side], ns = 1 - side, xb = xs[ns], dir = Math.sign(xb - xa);
      const mid = (crossTop + crossEnd) / 2, mx = (xa + xb) / 2;
      if (crossTop > y + 1) d += ` C ${xa} ${(y + crossTop) / 2 - 30}, ${xa + (side ? 10 : -10)} ${(y + crossTop) / 2 + 30}, ${xa} ${crossTop}`;
      mark(crossTop - vh * 0.25);
      const name = dir < 0 ? '' : i === stops.length - 1 ? 'phone' : list.length ? list[wi++ % list.length] : '';
      const w = SIG_GLYPHS[name];
      const prev = stops[i - 1];
      const wTop = prev && prev.tinted ? Math.max(crossTop, prev.secBottom + 10) : crossTop;
      const wBot = s.tinted ? Math.min(crossEnd, s.secTop - 10) : crossEnd;
      const s2 = w ? Math.min(W < 700 ? 0.045 : 0.07, (W - 2 * gutter - 60) / w.w, (wBot - wTop - 16) / 950) : 0;
      if (w && s2 >= 0.025) {
        const ox = (W - w.w * s2) / 2, oy = (wTop + wBot) / 2 + 260 * s2, word = place(w.d, s2, ox, oy);
        const [sx, sy, ex, ey] = ends(word);
        d += ` C ${xa} ${mid}, ${sx - 90} ${sy}, ${sx} ${sy} ${word} C ${ex + 90} ${ey}, ${xb} ${mid}, ${xb} ${crossEnd}`;
        mark(Math.max(crossEnd + vh * 0.1, marks[marks.length - 1].k + vh * 0.3));
      } else if (crossEnd - crossTop < 70) {
        // too little room for a loop: a plain S-curve inside the gap
        d += ` C ${xa} ${mid}, ${xb} ${mid}, ${xb} ${crossEnd}`;
        mark(Math.max(crossEnd + vh * 0.1, marks[marks.length - 1].k + vh * 0.1));
      } else {
        // a small cursive loop in the middle of the crossing
        d += ` C ${xa} ${mid}, ${mx - dir * 120} ${mid}, ${mx} ${mid}`;
        d += ` C ${mx + dir * 40} ${mid}, ${mx + dir * 40} ${mid - 34}, ${mx + dir * 18} ${mid - 34} C ${mx - dir * 4} ${mid - 34}, ${mx - dir * 2} ${mid}, ${mx + dir * 30} ${mid + 4}`;
        d += ` C ${mx + dir * 120} ${mid + 8}, ${xb} ${mid}, ${xb} ${crossEnd}`;
        mark(Math.max(crossEnd + vh * 0.1, marks[marks.length - 1].k + vh * 0.15));
      }
      side = ns; y = crossEnd;
    });
    const endY = Math.max(y + 40, stops[stops.length - 1].contentBottom);
    d += ` C ${xs[side]} ${(y + endY) / 2}, ${xs[side] + (side ? 4 : -4)} ${endY - 20}, ${xs[side]} ${endY}`;
    mark(endY - vh * 0.25);
    guide.setAttribute('d', d);
    L = guide.getTotalLength();
    // Chrome restarts dashing at every subpath (each pen lift), so each subpath is its own path with its own offset.
    ink.replaceChildren(); parts = []; let at = 0;
    for (const sub of d.split(/(?=M)/)) {
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('d', sub); el.setAttribute('class', 'sig-path'); ink.append(el);
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len + 1} ${len + 1}`;
      parts.push({ el, start: at, len }); at += len;
    }
    draw();
  };

  const draw = () => {
    raf = 0;
    if (still) { parts.forEach((q) => { q.el.style.strokeDashoffset = '0'; }); nib.style.display = 'none'; return; }
    if (!marks.length) return;
    const t = innerHeight * 0.7 - host.getBoundingClientRect().top;
    let len = L;
    // At the very bottom of the page the signature is always complete.
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    for (let i = 1; i < marks.length && !atBottom; i++) {
      const a = marks[i - 1], b = marks[i];
      if (t < b.k) { len = t <= a.k ? a.len : a.len + (b.len - a.len) * (t - a.k) / (b.k - a.k); break; }
    }
    parts.forEach((q) => { q.el.style.strokeDashoffset = String(q.len + 1 - Math.min(q.len + 1, Math.max(0, len - q.start))); });
    const pt = guide.getPointAtLength(len);
    nib.setAttribute('cx', String(pt.x)); nib.setAttribute('cy', String(pt.y));
    svg.classList.toggle('is-drawing', len > 1 && len < L - 1);
  };

  const onScroll = () => { if (!raf) raf = requestAnimationFrame(draw); };
  let timer = 0, lastH = 0;
  const later = () => { clearTimeout(timer); timer = window.setTimeout(build, 80); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', later);
  // Rebuild when content grows or shrinks (form steps, chat answers), so the line never crosses text afterwards.
  const ro = new ResizeObserver(() => { if (Math.abs(host.scrollHeight - lastH) > 2) { lastH = host.scrollHeight; later(); } });
  ro.observe(host);
  document.fonts?.ready.then(build);
  addEventListener('load', build);
  build();
  return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', later); removeEventListener('load', build); ro.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf); };
}
