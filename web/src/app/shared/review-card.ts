import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18n } from '../core/i18n';
import { type Review, reviewView } from '../content/reviews';

/** One Google review as written: name as published, translated text labelled, verbatim original on request. */
@Component({
  selector: 'lp-review-card',
  template: `
    @let v = view();
    <figure class="review" [class.rcard]="card()">
      <span class="stars" role="img" [attr.aria-label]="t().common.stars">★★★★★</span>
      <blockquote [attr.lang]="textLang()"><p>{{ v.text }}{{ review().excerpt ? ' …' : '' }}</p></blockquote>
      <figcaption>
        <span class="rv-name" translate="no">{{ review().name }}</span>
        <span class="rv-src">{{ t().common.googleReview }}{{ review().excerpt ? ' · ' + t().common.excerpt : '' }}</span>
        @if (v.label?.key === 'from') {
          <span class="rv-label">{{ t().common.translatedFrom[review().lang] }}</span>
        } @else if (v.label?.key === 'google') {
          <span class="rv-label">{{ t().common.translatedByGoogle }}</span>
        }
      </figcaption>
      @if (v.original) {
        <details class="rv-orig"><summary>{{ t().common.showOriginal }}</summary><p [attr.lang]="review().lang">{{ v.original }}</p></details>
      }
    </figure>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
})
export class ReviewCard {
  readonly review = input.required<Review>();
  readonly card = input(false);
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly view = computed(() => reviewView(this.review(), this.i18n.locale()));
  protected readonly textLang = computed(() => {
    const v = this.view();
    return v.label?.key === 'google' ? 'en' : v.original ? this.i18n.locale() : this.review().lang;
  });
}
