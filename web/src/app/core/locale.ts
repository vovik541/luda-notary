// Languages are path-based: EN at the root (also x-default), UK under /uk/, RU under /ru/.
export const LOCALES = ['en', 'uk', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_PREFIX: Record<Locale, string> = { en: '', uk: '/uk', ru: '/ru' };
export const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', uk: 'УКР', ru: 'РУС' };
export const LOCALE_OG: Record<Locale, string> = { en: 'en_US', uk: 'uk_UA', ru: 'ru_RU' };

/** Site path for a locale, always with a trailing slash: localePath('uk', '/notary/') → '/uk/notary/'. */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${LOCALE_PREFIX[locale]}${clean}`.replace(/\/{2,}/g, '/');
}

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;
