import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { I18n } from '../core/i18n';
import type { Locale } from '../core/locale';
import type { Dict } from '../content/en';
import { Header } from './header';
import { Footer } from './footer';

/** One per locale (route data `locale`): sets the page language before any page renders. */
@Component({
  selector: 'lp-shell',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <a class="skip" href="#main">{{ t().common.skip }}</a>
    @if (preview) { <div class="proto-bar" role="note"><span>{{ t().common.previewBar }}</span></div> }
    <lp-header />
    <router-outlet />
    <lp-footer />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly preview = SITE_ENV !== 'production';

  constructor() {
    const data = inject(ActivatedRoute).snapshot.data;
    this.i18n.use(data['locale'] as Locale, data['dict'] as Dict);
  }
}
