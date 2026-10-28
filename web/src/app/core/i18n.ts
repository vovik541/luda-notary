import { Injectable, computed, signal } from '@angular/core';
import type { Dict } from '../content/en';
import { type Locale, LOCALES, LOCALE_LABEL, localePath } from './locale';

/** Loads one language's copy; each dictionary is its own chunk, so a page ships only its language. */
export const loadDict = (l: Locale): Promise<Dict> =>
  l === 'uk' ? import('../content/uk').then((m) => m.uk) : l === 'ru' ? import('../content/ru').then((m) => m.ru) : import('../content/en').then((m) => m.en);

/** Current page language and its copy, set once per page by the Shell from its route (locale + resolved dictionary). */
@Injectable({ providedIn: 'root' })
export class I18n {
  readonly locale = signal<Locale>('en');
  private readonly dict = signal<Dict | null>(null);
  readonly t = computed(() => this.dict()!);
  readonly locales = LOCALES.map((l) => ({ code: l, label: LOCALE_LABEL[l] }));

  use(locale: Locale, dict: Dict) {
    this.locale.set(locale);
    this.dict.set(dict);
  }

  /** Link to a page in the current language, e.g. href('/notary/') → '/uk/notary/'. */
  href(path = '/', locale: Locale = this.locale()) {
    return localePath(locale, path);
  }

  /** Replace {name} placeholders. */
  fmt(text: string, values: Record<string, string | number>) {
    return text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
  }
}
