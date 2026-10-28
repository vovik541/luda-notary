import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../core/i18n';
import { Seo } from '../core/seo';
import { CITIES, SITE } from '../content/site';
import { Enter, Reveal } from '../shared/motion';
import { SignatureLine } from '../shared/signature-line';
import { ReviewsCarousel } from '../shared/reviews-carousel';
import { FaqChat } from '../shared/faq-chat';
import { RequestForm } from '../shared/request-form';
import { AreaMap } from '../shared/area-map';

/** Home: the approved A3 page, section by section. Heavy islands hydrate only when they reach the viewport. */
@Component({
  selector: 'lp-home',
  imports: [Enter, Reveal, SignatureLine, ReviewsCarousel, FaqChat, RequestForm, AreaMap],
  template: `
    <main id="main" class="has-sig">
      <lp-signature-line />
      <section class="hero">
        <div class="wrap hero-grid">
          <div class="hero-text">
            <h1><span lpEnter [order]="0">{{ t().hero.h1[0] }}</span> <span lpEnter [order]="1">{{ t().hero.h1[1] }}</span></h1>
            <p class="lede" lpEnter [order]="2">{{ t().hero.lede }}</p>
            <div class="actions"><a class="btn btn-primary" [href]="'tel:' + site.tel">{{ t().common.call }} {{ site.phone }}</a><a class="link" href="#request">{{ t().hero.request }}</a></div>
            <ul class="facts">@for (f of t().hero.facts; track f.t) { <li><strong>{{ f.t }}</strong>{{ f.d }}</li> }</ul>
          </div>
          <figure class="hero-fig">
            <span class="ghost" aria-hidden="true" translate="no">Petruk</span>
            <span class="block" aria-hidden="true"></span>
            <span class="corner" aria-hidden="true"></span>
            <img class="cut" lpEnter="rise" [order]="1" src="/img/liudmyla-cutout-desk.webp" width="1089" height="1364" [alt]="t().hero.portraitAlt" fetchpriority="high">
            <figcaption class="cred"><strong>{{ t().hero.cred[0] }}</strong><span>{{ t().hero.cred[1] }}</span><span>{{ t().hero.cred[2] }}</span></figcaption>
          </figure>
        </div>
      </section>

      <section class="branches" id="services" aria-labelledby="sv-h"><div class="wrap">
        <h2 data-sig-stop id="sv-h">{{ lda ? t().branches.h2 : t().branches.h2NotaryOnly }}</h2>
        <div class="br-grid" [class.one]="!lda">
          <article class="br br-notary" lpReveal>
            <p class="br-tag">{{ t().branches.notary.tag }}</p>
            <h3>{{ t().branches.notary.h3 }}</h3>
            <ul class="svc">@for (s of t().branches.notary.items; track s.t) { <li><strong>{{ s.t }}</strong><span>{{ s.d }}</span></li> }</ul>
            <p class="pending">{{ t().branches.notary.pending }}</p>
            <p class="br-foot"><strong>{{ t().branches.notary.fee }}</strong> {{ t().branches.notary.feeRest }} · <a [href]="i18n.href('/notary/')">{{ t().branches.notary.more }}</a></p>
          </article>
          @if (lda) {
            <article class="br br-lda" lpReveal>
              <p class="br-tag">{{ t().branches.lda.tag }} @if (draft) { <span class="draft">{{ t().common.draft }}</span> }</p>
              <h3>{{ t().branches.lda.h3 }}</h3>
              <ul class="svc">@for (s of t().branches.lda.items; track s.t) { <li><strong>{{ s.t }}</strong><span>{{ s.d }}</span></li> }</ul>
              <p class="br-foot">{{ t().branches.lda.foot }} · <a [href]="i18n.href('/document-assistance/')">{{ t().branches.lda.more }}</a></p>
            </article>
          }
        </div>
      </div></section>

      <section class="ways" aria-labelledby="w-h"><div class="wrap ways-grid">
        <h2 data-sig-stop id="w-h">{{ t().ways.h2 }}</h2>
        @for (w of t().ways.items; track w.t; let last = $last) {
          <div class="way" lpReveal><h3>{{ w.t }}</h3><p>{{ w.d }}@if (last && lda) { {{ ' ' + t().ways.ldaNote }} }</p></div>
        }
      </div></section>

      <section class="trust" aria-labelledby="t-h"><div class="wrap trust-grid">
        <img class="trust-pic" src="/img/liudmyla-cutout-head.webp" width="480" height="584" [alt]="t().trust.alt" loading="lazy">
        <div>
          <h2 data-sig-stop id="t-h">{{ t().trust.h2 }}</h2>
          <dl class="ledger" lpReveal>@for (r of t().trust.rows; track r.dt) { <div><dt>{{ r.dt }}</dt><dd>{{ r.dd }}</dd></div> }</dl>
          @if (lda) { <p class="small">{{ t().trust.note }}</p> }
        </div>
      </div></section>

      <section class="area" id="area" aria-labelledby="a-h"><div class="wrap area-grid">
        <div>
          <h2 data-sig-stop id="a-h">{{ t().area.h2 }}</h2>
          <div class="county"><h3>{{ t().area.sacramento }}</h3><p>@for (c of sac; track c.slug; let last = $last) { <span [class.base]="c.base" translate="no">{{ c.name }}</span>@if (!last) { <span class="sep" aria-hidden="true"> · </span> } }</p></div>
          <div class="county"><h3>{{ t().area.placer }}</h3><p>@for (c of placer; track c.slug; let last = $last) { <span translate="no">{{ c.name }}{{ c.pending ? '*' : '' }}</span>@if (!last) { <span class="sep" aria-hidden="true"> · </span> } }</p></div>
          <p class="small">{{ t().area.note }} <a [href]="i18n.href('/service-area/')">{{ t().area.more }}</a></p>
        </div>
        <lp-area-map />
      </div></section>

      <section class="fees" id="fees" aria-labelledby="f-h"><div class="wrap fees-grid">
        <h2 data-sig-stop id="f-h">{{ t().fees.h2 }}</h2>
        <dl class="fee-list" lpReveal>
          @for (r of t().fees.notary.slice(0, 3); track r.dt) { <div><dt>{{ r.dt }}</dt><dd>{{ r.dd }}</dd></div> }
          @if (lda) { <div><dt>{{ t().fees.lda.dt }} @if (draft) { <span class="draft">{{ t().common.draft }}</span> }</dt><dd>{{ t().fees.lda.dd }}</dd></div> }
          @for (r of t().fees.notary.slice(3); track r.dt) { <div><dt>{{ r.dt }}</dt><dd>{{ r.dd }}</dd></div> }
        </dl>
      </div></section>

      <section class="about" id="about" aria-labelledby="ab-h"><div class="wrap about-grid">
        <h2 data-sig-stop id="ab-h">{{ t().about.h2 }}</h2>
        <p class="about-lead" lpReveal>{{ t().about.lead }}</p>
        <p lpReveal>{{ t().about.body }}</p>
      </div></section>

      @defer (on viewport; hydrate on viewport) { <lp-reviews-carousel /> } @placeholder { <div style="min-height: 520px"></div> }

      <section class="faq" id="faq" aria-labelledby="fq-h"><div class="wrap">
        <h2 data-sig-stop id="fq-h">{{ t().faq.h2 }}</h2>
        @defer (on viewport; hydrate on viewport) { <lp-faq-chat [items]="faq" [note]="t().faq.headNote" /> } @placeholder { <div style="min-height: 440px"></div> }
      </div></section>

      @defer (on viewport; hydrate on viewport) { <lp-request-form /> } @placeholder { <div style="min-height: 720px"></div> }

      <section class="contact" id="contact" aria-labelledby="c-h"><div class="wrap contact-grid">
        <h2 data-sig-stop id="c-h">{{ t().contact.h2 }}</h2>
        <div><a class="phone" [href]="'tel:' + site.tel">{{ site.phone }}</a><p>{{ t().contact.body }}<br>{{ t().common.hours }} · <a [href]="'mailto:' + site.email">{{ site.email }}</a></p></div>
      </div></section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly lda = LDA_PUBLISHED;
  protected readonly draft = SITE_ENV !== 'production';
  protected readonly sac = CITIES.filter((c) => c.county === 'sacramento');
  protected readonly placer = CITIES.filter((c) => c.county === 'placer');
  protected readonly faq = [...this.t().faq.items.slice(0, 4), ...(this.lda ? [this.t().faq.ldaItem] : []), ...this.t().faq.items.slice(4)];

  constructor() {
    const m = this.t().meta.home;
    inject(Seo).set({ title: m.title, description: m.description, path: '/' });
  }
}
