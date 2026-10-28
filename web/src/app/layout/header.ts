import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { I18n } from '../core/i18n';
import { Seo } from '../core/seo';
import { type Locale, localePath } from '../core/locale';
import { SITE } from '../content/site';

/** Sticky header from the prototype: brand, nav, language switch (real links to the same page), call button, menu. */
@Component({
  selector: 'lp-header',
  template: `
    <header class="top"><div class="wrap top-row">
      <a class="brand" [href]="i18n.href('/')"><img src="/brand/monogram-gold.png" width="202" height="188" alt=""><span translate="no">{{ site.name }}<small>Notary Public</small></span></a>
      <nav class="nav" id="nav" [class.open]="open()" [attr.aria-label]="t().nav.services" (click)="onNavClick($event)">
        <a [href]="home + '#services'">{{ t().nav.services }}</a>
        <a [href]="i18n.href('/service-area/')">{{ t().nav.area }}</a>
        <a [href]="home + '#fees'">{{ t().nav.fees }}</a>
        <a [href]="i18n.href('/reviews/')">{{ t().nav.reviews }}</a>
        <a [href]="home + '#about'">{{ t().nav.about }}</a>
        <a [href]="home + '#contact'">{{ t().nav.contact }}</a>
        <div class="nav-more"><ng-container *ngTemplateOutlet="lang" /></div>
      </nav>
      <div class="top-cta">
        <ng-container *ngTemplateOutlet="lang" />
        <a class="btn btn-call" [href]="'tel:' + site.tel"><span class="long">{{ site.phone }}</span><span class="short">{{ t().common.call }}</span></a>
        <button class="menu-btn" type="button" aria-controls="nav" [attr.aria-expanded]="open()" (click)="toggle()"><span class="menu-label">{{ open() ? t().common.close : t().common.menu }}</span></button>
      </div>
    </div></header>
    <ng-template #lang>
      <div class="lang"><span class="sr-only">{{ t().common.language }}</span>
        @for (l of i18n.locales; track l.code) {
          <a [href]="langHref(l.code)" [attr.lang]="l.code" [attr.hreflang]="l.code" [attr.aria-current]="l.code === i18n.locale() ? 'true' : null">{{ l.label }}</a>
        }
      </div>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
})
export class Header {
  protected readonly i18n = inject(I18n);
  private readonly seo = inject(Seo);
  private readonly doc = inject(DOCUMENT);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly home = this.i18n.href('/');
  protected readonly open = signal(false);

  protected langHref(l: Locale) {
    return localePath(l, this.seo.path());
  }

  protected toggle() {
    this.open.update((o) => !o);
    this.doc.body.classList.toggle('menu-open', this.open());
  }

  protected close() {
    if (!this.open()) return;
    this.open.set(false);
    this.doc.body.classList.remove('menu-open');
  }

  protected onNavClick(e: Event) {
    if ((e.target as HTMLElement).closest('a[href]')) this.close();
  }
}

