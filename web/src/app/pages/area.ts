import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18n } from '../core/i18n';
import { Seo } from '../core/seo';
import { CITIES } from '../content/site';
import type { Dict } from '../content/en';
import { Reveal } from '../shared/motion';
import { AreaMap } from '../shared/area-map';
import { RequestForm } from '../shared/request-form';

/** Service-area hub: every city by name; only cities that qualify (plan §3) get their own page and link. */
@Component({
  selector: 'lp-area',
  imports: [Reveal, AreaMap],
  template: `
    <main id="main">
      <section class="page-head"><div class="wrap">
        <p class="crumb"><a [href]="i18n.href('/')">{{ t().common.home }}</a> / {{ t().areaPage.h1 }}</p>
        <h1>{{ t().areaPage.h1 }}</h1>
        <p class="lede">{{ t().areaPage.lede }}</p>
      </div></section>
      <section class="area" aria-labelledby="c-h"><div class="wrap area-grid">
        <div>
          <h2 id="c-h">{{ t().areaPage.citiesH2 }}</h2>
          @for (county of counties; track county.key) {
            <div class="county"><h3>{{ county.label }}</h3>
              <ul class="city-list" lpReveal>
                @for (c of county.cities; track c.slug) {
                  <li [class.base]="c.base" translate="no">
                    @if (c.indexed) { <a [href]="i18n.href('/mobile-notary/' + c.slug + '/')">{{ c.name }}</a> } @else { {{ c.name }}{{ c.pending ? '*' : '' }} }
                  </li>
                }
              </ul>
            </div>
          }
          <p class="small">{{ t().area.note }}</p>
        </div>
        <lp-area-map />
      </div></section>
      <section class="page-sec" aria-labelledby="o-h"><div class="wrap split">
        <h2 id="o-h">{{ t().areaPage.outsideH2 }}</h2>
        <p>{{ t().areaPage.outside }} <a class="link" [href]="i18n.href('/') + '#request'">{{ t().nav.request }}</a></p>
      </div></section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly counties = [
    { key: 'sacramento', label: this.t().area.sacramento, cities: CITIES.filter((c) => c.county === 'sacramento') },
    { key: 'placer', label: this.t().area.placer, cities: CITIES.filter((c) => c.county === 'placer') },
  ];
  constructor() {
    const t = this.t();
    inject(Seo).set({ title: t.meta.area.title, description: t.meta.area.description, path: '/service-area/', breadcrumb: [{ name: t.common.home, path: '/' }, { name: t.areaPage.h1, path: '/service-area/' }] });
  }
}

/** City page (only for cities with indexed: true and written content in every locale). */
@Component({
  selector: 'lp-city',
  imports: [Reveal, RequestForm],
  template: `
    <main id="main">
      <section class="page-head"><div class="wrap">
        <p class="crumb"><a [href]="i18n.href('/')">{{ t().common.home }}</a> / <a [href]="i18n.href('/service-area/')">{{ t().areaPage.h1 }}</a> / <span translate="no">{{ city.name }}</span></p>
        <h1>{{ copy.h1 }}</h1>
        <p class="lede">{{ copy.lede }}</p>
      </div></section>
      @for (s of copy.sections; track s.h) {
        <section class="page-sec"><div class="wrap split"><h2>{{ s.h }}</h2><p lpReveal>{{ s.p }}</p></div></section>
      }
      @defer (on viewport; hydrate on viewport) { <lp-request-form /> } @placeholder { <div style="min-height: 720px"></div> }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CityPage {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('city') as keyof Dict['city'];
  protected readonly city = CITIES.find((c) => c.slug === this.slug)!;
  protected readonly copy = this.t().city[this.slug];
  constructor() {
    const t = this.t(), path = `/mobile-notary/${this.slug}/`;
    inject(Seo).set({
      title: `${this.copy.h1} · Liudmyla Petruk`, description: this.copy.lede, path,
      breadcrumb: [{ name: t.common.home, path: '/' }, { name: t.areaPage.h1, path: '/service-area/' }, { name: this.city.name, path }],
    });
  }
}
