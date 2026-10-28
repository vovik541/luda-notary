import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../core/i18n';
import { Seo } from '../core/seo';
import { SITE } from '../content/site';
import { Reveal } from '../shared/motion';
import { FaqChat } from '../shared/faq-chat';
import { LdaForm } from '../shared/lda-form';

/**
 * Document assistance (LDA). Only routed when LDA_PUBLISHED is true. In draft builds it carries the
 * "Internal draft" bar and the owner-provided registration line; production shows neither until verified.
 */
@Component({
  selector: 'lp-lda',
  imports: [Reveal, FaqChat, LdaForm],
  template: `
    @if (draft) { <div class="proto-bar" role="note"><span>{{ t().common.draftBar }}</span></div> }
    <main id="main">
      <section class="page-head"><div class="wrap">
        <p class="crumb"><a [href]="i18n.href('/')">{{ t().common.home }}</a> / {{ t().ldaPage.h1 }}</p>
        <h1>{{ t().ldaPage.h1 }}</h1>
        <p class="lede">{{ t().ldaPage.lede }}</p>
      </div></section>
      <section class="page-sec" aria-labelledby="can-h"><div class="wrap split">
        <h2 id="can-h">{{ t().ldaPage.canH2 }}</h2>
        <div class="two-col" lpReveal>
          <ul class="plain-list">@for (c of t().ldaPage.can; track c) { <li>{{ c }}</li> }</ul>
          <ul class="plain-list no">@for (c of t().ldaPage.cannot; track c) { <li>{{ c }}</li> }</ul>
        </div>
      </div></section>
      <section class="page-sec" aria-labelledby="pr-h"><div class="wrap split">
        <h2 id="pr-h">{{ t().ldaPage.pricingH2 }}</h2>
        <p lpReveal>{{ t().ldaPage.pricing }}</p>
      </div></section>
      <section class="page-sec" aria-labelledby="ds-h"><div class="wrap split">
        <h2 id="ds-h">{{ t().ldaPage.disclosureH2 }}</h2>
        <div class="disclosure">
          <p>{{ t().ldaPage.disclosure }}</p>
          @if (draft) { <p class="lda-note">{{ registration }}</p> }
        </div>
      </div></section>
      <section class="faq" aria-labelledby="lfq-h"><div class="wrap">
        <h2 id="lfq-h">{{ t().ldaPage.faqH2 }}</h2>
        @defer (on viewport; hydrate on viewport) { <lp-faq-chat [items]="t().ldaPage.faq" [note]="t().ldaPage.disclosure" /> } @placeholder { <div style="min-height: 440px"></div> }
      </div></section>
      @defer (on viewport; hydrate on viewport) { <lp-lda-form /> } @placeholder { <div style="min-height: 560px"></div> }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LdaPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly draft = SITE_ENV !== 'production';
  protected readonly registration = this.i18n.fmt(this.t().ldaPage.registration, { county: SITE.lda.county, number: SITE.lda.number });
  constructor() {
    const t = this.t();
    // Draft LDA pages are never indexed, even if a preview build is crawled.
    inject(Seo).set({ title: t.meta.lda.title, description: t.meta.lda.description, path: '/document-assistance/', noindex: this.draft, breadcrumb: [{ name: t.common.home, path: '/' }, { name: t.ldaPage.h1, path: '/document-assistance/' }] });
  }
}
