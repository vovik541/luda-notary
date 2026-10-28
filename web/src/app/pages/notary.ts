import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../core/i18n';
import { Seo } from '../core/seo';
import { Reveal } from '../shared/motion';
import { FaqChat } from '../shared/faq-chat';
import { RequestForm } from '../shared/request-form';

/** Notary services: kept separate from document assistance (own services, fees, FAQ and request flow). */
@Component({
  selector: 'lp-notary',
  imports: [Reveal, FaqChat, RequestForm],
  template: `
    <main id="main">
      <section class="page-head"><div class="wrap">
        <p class="crumb"><a [href]="i18n.href('/')">{{ t().common.home }}</a> / {{ t().notaryPage.h1 }}</p>
        <h1>{{ t().notaryPage.h1 }}</h1>
        <p class="lede">{{ t().notaryPage.lede }}</p>
      </div></section>
      <section class="branches" aria-labelledby="svc-h"><div class="wrap split">
        <h2 id="svc-h">{{ t().branches.notary.h3 }}</h2>
        <div lpReveal>
          <ul class="svc">@for (s of t().branches.notary.items; track s.t) { <li><strong>{{ s.t }}</strong><span>{{ s.d }}</span></li> }</ul>
          <p class="pending">{{ t().branches.notary.pending }}</p>
        </div>
      </div></section>
      <section class="page-sec" aria-labelledby="how-h"><div class="wrap split">
        <h2 id="how-h">{{ t().notaryPage.howH2 }}</h2>
        <ol class="steps-list" lpReveal>@for (s of t().notaryPage.how; track s.t) { <li><strong>{{ s.t }}</strong><span>{{ s.d }}</span></li> }</ol>
      </div></section>
      <section class="fees" id="fees" aria-labelledby="f-h"><div class="wrap fees-grid">
        <h2 id="f-h">{{ t().fees.h2 }}</h2>
        <dl class="fee-list" lpReveal>@for (r of t().fees.notary; track r.dt) { <div><dt>{{ r.dt }}</dt><dd>{{ r.dd }}</dd></div> }</dl>
      </div></section>
      <section class="faq" aria-labelledby="nfq-h"><div class="wrap">
        <h2 id="nfq-h">{{ t().notaryPage.faqH2 }}</h2>
        @defer (on viewport; hydrate on viewport) { <lp-faq-chat [items]="t().faq.items" [note]="t().faq.headNote" /> } @placeholder { <div style="min-height: 440px"></div> }
      </div></section>
      @defer (on viewport; hydrate on viewport) { <lp-request-form /> } @placeholder { <div style="min-height: 720px"></div> }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotaryPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  constructor() {
    const t = this.t();
    inject(Seo).set({ title: t.meta.notary.title, description: t.meta.notary.description, path: '/notary/', breadcrumb: [{ name: t.common.home, path: '/' }, { name: t.notaryPage.h1, path: '/notary/' }] });
  }
}
