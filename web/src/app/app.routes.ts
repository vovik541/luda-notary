import type { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { loadDict } from './core/i18n';

// The same page set under each locale: EN at the root, UK under /uk/, RU under /ru/.
// Document assistance is routed only when LDA_PUBLISHED is true (draft/preview builds); production omits it.
const pages: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  { path: 'notary', loadComponent: () => import('./pages/notary').then((m) => m.NotaryPage) },
  ...(LDA_PUBLISHED ? [{ path: 'document-assistance', loadComponent: () => import('./pages/lda').then((m) => m.LdaPage) }] : []),
  { path: 'reviews', loadComponent: () => import('./pages/reviews').then((m) => m.ReviewsPage) },
  { path: 'service-area', loadComponent: () => import('./pages/area').then((m) => m.AreaPage) },
  { path: 'mobile-notary/:city', loadComponent: () => import('./pages/area').then((m) => m.CityPage) },
  { path: 'privacy', data: { kind: 'privacy' }, loadComponent: () => import('./pages/misc').then((m) => m.LegalPage) },
  { path: 'terms', data: { kind: 'terms' }, loadComponent: () => import('./pages/misc').then((m) => m.LegalPage) },
  { path: 'request/sent', data: { ok: true }, loadComponent: () => import('./pages/misc').then((m) => m.ResultPage) },
  { path: 'request/error', data: { ok: false }, loadComponent: () => import('./pages/misc').then((m) => m.ResultPage) },
  { path: '404', loadComponent: () => import('./pages/misc').then((m) => m.NotFoundPage) },
  { path: '**', loadComponent: () => import('./pages/misc').then((m) => m.NotFoundPage) },
];

export const routes: Routes = [
  { path: 'uk', component: Shell, data: { locale: 'uk' }, resolve: { dict: () => loadDict('uk') }, children: pages },
  { path: 'ru', component: Shell, data: { locale: 'ru' }, resolve: { dict: () => loadDict('ru') }, children: pages },
  { path: '', component: Shell, data: { locale: 'en' }, resolve: { dict: () => loadDict('en') }, children: pages },
];
