import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { I18n } from '../core/i18n';
import { REVIEWS } from '../content/reviews';
import { SITE } from '../content/site';
import { ReviewCard } from './review-card';
import { reducedMotion } from './motion';

/**
 * Home reviews: one row, native horizontal scroll with snap. The arrows move one card, the counter follows,
 * arrow keys work when the row is focused. Without JS it is a plain scrollable row.
 */
@Component({
  selector: 'lp-reviews-carousel',
  imports: [ReviewCard],
  template: `
    <section class="reviews" id="reviews" aria-labelledby="rv-h"><div class="wrap">
      <div class="reviews-top">
        <div><h2 data-sig-stop id="rv-h">{{ t().reviews.h2 }}</h2><p class="small">{{ summary }}</p></div>
        <div class="car-controls">
          <span class="car-count" aria-hidden="true"><b>{{ index() }}</b> / {{ total }}</span>
          <button class="car-btn" type="button" [attr.aria-label]="t().reviews.prev" [disabled]="atStart()" (click)="go(-1)"><span aria-hidden="true">←</span></button>
          <button class="car-btn" type="button" [attr.aria-label]="t().reviews.next" [disabled]="atEnd()" (click)="go(1)"><span aria-hidden="true">→</span></button>
        </div>
      </div>
      <div class="carousel">
        <ul class="car-track" #track tabindex="0" [attr.aria-label]="t().reviews.trackLabel" (keydown)="key($event)" (scroll)="onScroll()">
          @for (r of reviews; track r.id) {
            <li><lp-review-card [review]="r" [card]="true" /></li>
          }
        </ul>
      </div>
      <p class="reviews-links"><a [href]="i18n.href('/reviews/')">{{ t().reviews.all }}</a><a [href]="site.google" rel="noopener" target="_blank">{{ t().reviews.readOnGoogle }}</a><a [href]="site.googleReview" rel="noopener" target="_blank">{{ t().reviews.leave }}</a></p>
    </div></section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsCarousel {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly reviews = REVIEWS.filter((r) => r.home);
  protected readonly total = String(this.reviews.length).padStart(2, '0');
  protected readonly summary = this.i18n.fmt(this.t().reviews.summary, { score: SITE.rating.score, count: SITE.rating.count });
  protected readonly index = signal('01');
  protected readonly atStart = signal(true);
  protected readonly atEnd = signal(false);
  private readonly track = viewChild.required<ElementRef<HTMLUListElement>>('track');
  private raf = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const track = this.track().nativeElement;
      // Cards in view lift slightly and get the gold rule (transform only).
      const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-in', e.intersectionRatio > 0.6)), { root: track, threshold: [0, 0.6, 1] });
      [...track.children].forEach((li) => io.observe(li));
      const onResize = () => this.sync();
      addEventListener('resize', onResize);
      this.sync();
      destroyRef.onDestroy(() => { io.disconnect(); removeEventListener('resize', onResize); });
    });
  }

  private step() {
    const items = this.track().nativeElement.children;
    return items[1] ? (items[1] as HTMLElement).offsetLeft - (items[0] as HTMLElement).offsetLeft : this.track().nativeElement.clientWidth;
  }

  protected go(dir: number) {
    this.track().nativeElement.scrollBy({ left: dir * this.step(), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  protected key(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    this.go(e.key === 'ArrowRight' ? 1 : -1);
  }

  protected onScroll() {
    if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.sync(); });
  }

  private sync() {
    const t = this.track().nativeElement;
    this.atStart.set(t.scrollLeft <= 2);
    this.atEnd.set(t.scrollLeft >= t.scrollWidth - t.clientWidth - 2);
    this.index.set(String(Math.min(this.reviews.length, Math.round(t.scrollLeft / this.step()) + 1)).padStart(2, '0'));
  }
}
