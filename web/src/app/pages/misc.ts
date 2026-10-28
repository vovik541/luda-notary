import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18n } from '../core/i18n';
import { Seo } from '../core/seo';
import { SITE } from '../content/site';

/** Privacy and terms (route data `kind`). Draft text pending legal review. */
@Component({
  selector: 'lp-legal',
  template: `
    <main id="main">
      <section class="page-head"><div class="wrap">
        <p class="crumb"><a [href]="i18n.href('/')">{{ t().common.home }}</a> / {{ title }}</p>
        <h1>{{ title }}</h1>
        <p class="lede">{{ t().legal.updated }}</p>
      </div></section>
      <section><div class="wrap split">
        <div><span class="draft note-draft">{{ t().legal.reviewNote }}</span></div>
        <div class="prose">@for (s of sections; track s.h) { <h2>{{ s.h }}</h2><p>{{ s.p }}</p> }</div>
      </div></section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly kind = inject(ActivatedRoute).snapshot.data['kind'] as 'privacy' | 'terms';
  protected readonly title = this.kind === 'privacy' ? this.t().footer.privacy : this.t().footer.terms;
  protected readonly sections = this.t().legal[this.kind];
  constructor() {
    const m = this.t().meta[this.kind];
    inject(Seo).set({ title: m.title, description: m.description, path: `/${this.kind}/` });
  }
}

/** Result pages for the no-JavaScript form path (/request/sent/, /request/error/). Never indexed. */
@Component({
  selector: 'lp-result',
  template: `
    <main id="main"><section class="result"><div class="wrap">
      <h1>{{ ok ? t().result.sentH1 : t().result.errorH1 }}</h1>
      <p>{{ ok ? t().result.sentP : t().result.errorP }}</p>
      <div class="result-actions">
        <a class="btn btn-primary" [href]="'tel:' + site.tel">{{ t().request.callNow }} {{ site.phone }}</a>
        <a [href]="'sms:' + site.tel">{{ t().request.text }}</a>
        <a class="link" [href]="i18n.href('/')">{{ t().result.back }}</a>
      </div>
    </div></section></main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly ok = inject(ActivatedRoute).snapshot.data['ok'] as boolean;
  constructor() {
    const m = this.ok ? this.t().meta.sent : this.t().meta.error;
    inject(Seo).set({ title: m.title, description: m.description, path: this.ok ? '/request/sent/' : '/request/error/', noindex: true });
  }
}

/** Per-locale 404 page; postbuild copies it to {locale}/404.html so Workers serve it with a real 404 status. */
@Component({
  selector: 'lp-not-found',
  template: `
    <main id="main"><section class="result"><div class="wrap">
      <h1>{{ t().notFound.h1 }}</h1>
      <p>{{ t().notFound.p }}</p>
      <div class="result-actions">
        <a class="link" [href]="i18n.href('/')">{{ t().common.home }}</a>
        <a class="link" [href]="i18n.href('/notary/')">{{ t().nav.notary }}</a>
        <a class="link" [href]="i18n.href('/reviews/')">{{ t().nav.reviews }}</a>
        <a class="link" [href]="i18n.href('/') + '#request'">{{ t().nav.request }}</a>
      </div>
    </div></section></main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  constructor() {
    const m = this.t().meta.notFound;
    inject(Seo).set({ title: m.title, description: m.description, path: '/', noindex: true });
  }
}
