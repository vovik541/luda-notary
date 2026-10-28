import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18n } from './i18n';
import { type Locale, LOCALES, LOCALE_OG, absoluteUrl, localePath } from './locale';
import { CITIES, SITE } from '../content/site';

export type PageSeo = {
  title: string;
  description: string;
  /** Locale-neutral path with trailing slash, e.g. '/notary/'. */
  path: string;
  /** Locales this page exists in (default: all). */
  locales?: readonly Locale[];
  noindex?: boolean;
  breadcrumb?: { name: string; path: string }[];
};

/**
 * Writes the per-page head: title, description, robots, canonical, hreflang alternates, Open Graph and JSON-LD.
 * Runs during prerender, so every static HTML file ships with its final head.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly i18n = inject(I18n);
  /** Locale-neutral path of the current page (the language switch links to the same page in each locale). */
  readonly path = signal('/');

  set(page: PageSeo) {
    this.path.set(page.path);
    const locale = this.i18n.locale();
    const locales = page.locales ?? LOCALES;
    const url = absoluteUrl(localePath(locale, page.path));
    const noindex = SITE_ENV !== 'production' || page.noindex;

    this.doc.documentElement.lang = locale;
    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: absoluteUrl('/brand/og-image.jpg') });
    this.meta.updateTag({ property: 'og:locale', content: LOCALE_OG[locale] });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang], link[data-font], script[data-ld]').forEach((n) => n.remove());
    // Preload only the two font files this language needs on first view.
    for (const f of locale === 'en' ? ['literata-latin', 'inter-latin'] : ['literata-cyrillic', 'inter-cyrillic']) {
      this.link({ rel: 'preload', href: `/fonts/${f}.woff2`, as: 'font', type: 'font/woff2', crossorigin: '', 'data-font': '' });
    }
    if (!page.noindex) {
      this.link({ rel: 'canonical', href: url });
      for (const l of locales) this.link({ rel: 'alternate', hreflang: l, href: absoluteUrl(localePath(l, page.path)) });
      if (locales.includes('en')) this.link({ rel: 'alternate', hreflang: 'x-default', href: absoluteUrl(localePath('en', page.path)) });
    }
    this.jsonLd(this.business(locale));
    if (page.breadcrumb?.length) {
      this.jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: page.breadcrumb.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: absoluteUrl(localePath(locale, b.path)) })),
      });
    }
  }

  private get head() {
    return this.doc.head;
  }

  private link(attrs: Record<string, string>) {
    const el = this.doc.createElement('link');
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    this.head.appendChild(el);
  }

  private jsonLd(data: object) {
    const s = this.doc.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-ld', '');
    s.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.head.appendChild(s);
  }

  // No Review/AggregateRating markup: self-serving reviews are not eligible (plan §4).
  private business(locale: Locale) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Notary',
      '@id': `${absoluteUrl('/')}#business`,
      name: 'Liudmyla Petruk, Notary Public',
      url: absoluteUrl(localePath(locale, '/')),
      telephone: SITE.tel,
      email: SITE.email,
      image: absoluteUrl('/img/liudmyla-cutout-desk.webp'),
      priceRange: '$',
      knowsLanguage: ['en', 'uk', 'ru'],
      address: { '@type': 'PostalAddress', addressLocality: 'Citrus Heights', addressRegion: 'CA', addressCountry: 'US' },
      areaServed: CITIES.filter((c) => !c.pending).map((c) => ({ '@type': 'City', name: `${c.name}, CA` })),
      openingHoursSpecification: SITE.hours.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.days.map((d) => `https://schema.org/${{ Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday' }[d]}`),
        opens: h.opens,
        closes: h.closes,
      })),
      sameAs: [SITE.google],
    };
  }
}
