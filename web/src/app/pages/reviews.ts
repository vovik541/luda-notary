import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../core/i18n';
import { Seo } from '../core/seo';
import { REVIEWS } from '../content/reviews';
import { SITE } from '../content/site';
import { ReviewCard } from '../shared/review-card';

/** All reviews (prototype A3 reviews page): names as published, translations labelled, originals on request. */
@Component({
  selector: 'lp-reviews',
  imports: [ReviewCard],
  template: `
    <main id="main" class="rv-page">
      <section class="rv-hero"><div class="wrap">
        <p class="rv-crumb"><a [href]="i18n.href('/')">{{ t().common.home }}</a> / {{ t().nav.reviews }}</p>
        <h1>{{ t().reviewsPage.h1 }}</h1>
        <p class="rv-score"><span class="stars" role="img" [attr.aria-label]="t().common.stars">★★★★★</span><span>{{ score }}</span></p>
        <p class="small">{{ note }}</p>
        <p class="reviews-links"><a [href]="site.google" rel="noopener" target="_blank">{{ t().reviews.readOnGoogle }}</a><a [href]="site.googleReview" rel="noopener" target="_blank">{{ t().reviews.leave }}</a></p>
      </div></section>
      <section class="rv-list" aria-labelledby="rl-h"><div class="wrap"><h2 class="sr-only" id="rl-h">{{ t().reviewsPage.listLabel }}</h2>
        <div class="rv-grid">@for (r of reviews; track r.id) { <lp-review-card [review]="r" /> }</div>
      </div></section>
      <section class="rv-cta"><div class="wrap"><p>{{ t().reviewsPage.ctaTitle }}</p>
        <div class="rv-cta-actions"><a class="btn btn-primary" [href]="i18n.href('/') + '#request'">{{ t().nav.request }}</a><a class="link" [href]="'tel:' + site.tel">{{ t().common.call }} {{ site.phone }}</a></div>
      </div></section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly reviews = REVIEWS;
  protected readonly score = this.i18n.fmt(this.t().reviewsPage.score, { score: SITE.rating.score, count: SITE.rating.count });
  protected readonly note = this.i18n.fmt(this.t().reviewsPage.note, { n: REVIEWS.length });
  constructor() {
    const t = this.t();
    inject(Seo).set({ title: t.meta.reviews.title, description: t.meta.reviews.description, path: '/reviews/', breadcrumb: [{ name: t.common.home, path: '/' }, { name: t.nav.reviews, path: '/reviews/' }] });
  }
}
