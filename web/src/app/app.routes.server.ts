import { RenderMode, type ServerRoute } from '@angular/ssr';
import { INDEXED_CITIES } from './content/site';

// Every public page is prerendered (outputMode: static); nothing renders on a server at request time.
// City pages exist only for cities that pass the indexing rules (plan §3).
const cityParams = async () => INDEXED_CITIES.map((c) => ({ city: c.slug }));

export const serverRoutes: ServerRoute[] = [
  { path: 'mobile-notary/:city', renderMode: RenderMode.Prerender, getPrerenderParams: cityParams },
  { path: 'uk/mobile-notary/:city', renderMode: RenderMode.Prerender, getPrerenderParams: cityParams },
  { path: 'ru/mobile-notary/:city', renderMode: RenderMode.Prerender, getPrerenderParams: cityParams },
  { path: '**', renderMode: RenderMode.Prerender },
];
