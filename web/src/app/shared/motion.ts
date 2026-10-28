import { Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

export const EASE = 'cubic-bezier(.2,.7,.2,1)';
export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Section reveal (prototype [data-reveal]): children rise in once when the block enters the viewport.
 * Content is fully visible in the prerendered HTML; the animation only starts after hydration and uses fill
 * 'backwards', so nothing stays hidden if it is interrupted. Reduced motion: no animation.
 */
@Directive({ selector: '[lpReveal]' })
export class Reveal {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    afterNextRender(() => {
      if (reducedMotion()) return;
      const host = this.el.nativeElement;
      // Already on screen at hydration: leave it alone rather than flash it.
      if (host.getBoundingClientRect().top < innerHeight * 0.9) return;
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        [...host.children].forEach((c, i) => c.animate(
          [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }],
          { duration: 700, delay: i * 80, easing: EASE, fill: 'backwards' }));
      }), { rootMargin: '0px 0px -10% 0px' });
      io.observe(host);
    });
  }
}

/** Hero entrance (prototype [data-enter]): headline lines and the portrait. CTA buttons are never animated. */
@Directive({ selector: '[lpEnter]' })
export class Enter {
  readonly lpEnter = input<'up' | 'rise' | ''>('up');
  readonly order = input(0);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    afterNextRender(() => {
      if (reducedMotion() || scrollY > 200) return;
      const from = this.lpEnter() === 'rise' ? 'translateY(40px) scale(.98)' : 'translateY(28px)';
      this.el.nativeElement.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }],
        { duration: 900, delay: 80 + this.order() * 90, easing: EASE, fill: 'backwards' });
    });
  }
}
