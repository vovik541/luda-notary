import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../core/i18n';
import { SITE } from '../content/site';

/** Full footer from prototype A3, with the ReIskra credit. */
@Component({
  selector: 'lp-footer',
  template: `
    <footer class="foot"><div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand"><img src="/brand/monogram-gold.png" width="202" height="188" alt="" loading="lazy"><p class="foot-name" translate="no">{{ site.name }} <span>Notary Public · Citrus Heights</span></p><p>{{ t().footer.tagline }}</p></div>
        <nav [attr.aria-label]="t().footer.explore"><p class="foot-h">{{ t().footer.explore }}</p><ul>
          <li><a [href]="i18n.href('/notary/')">{{ t().nav.notary }}</a></li>
          @if (lda) { <li><a [href]="i18n.href('/document-assistance/')">{{ t().nav.lda }}</a></li> }
          <li><a [href]="i18n.href('/service-area/')">{{ t().nav.area }}</a></li>
          <li><a [href]="home + '#fees'">{{ t().nav.fees }}</a></li>
          <li><a [href]="i18n.href('/reviews/')">{{ t().nav.reviews }}</a></li>
          <li><a [href]="home + '#faq'">{{ t().nav.faq }}</a></li>
          <li><a [href]="home + '#request'">{{ t().nav.request }}</a></li>
        </ul></nav>
        <div><p class="foot-h">{{ t().footer.contact }}</p><ul>
          <li><a [href]="'tel:' + site.tel">{{ site.phone }}</a></li>
          <li><a [href]="'sms:' + site.tel">{{ t().footer.textFirst }}</a></li>
          <li><a [href]="'mailto:' + site.email">{{ site.email }}</a></li>
          <li><a [href]="site.google" rel="noopener" target="_blank">{{ t().footer.google }}</a></li>
        </ul></div>
        <div><p class="foot-h">{{ t().footer.hours }}</p><p>{{ t().common.hours }}<br>{{ t().common.weekends }}</p></div>
      </div>
      <p class="foot-legal">{{ t().footer.legal }}</p>
      @if (i18n.locale() !== 'en') {
        <!-- California notaries advertising in another language also state the notice in English (plan §11, to verify). -->
        <p class="foot-legal" lang="en">{{ enLegal }}</p>
      }
      <div class="foot-bar">
        <p>{{ t().footer.rights }} · <span class="foot-links"><a [href]="i18n.href('/privacy/')">{{ t().footer.privacy }}</a><a [href]="i18n.href('/terms/')">{{ t().footer.terms }}</a></span></p>
        <p>{{ t().footer.credit }} <span translate="no">ReIskra</span> · <span translate="no">Volodymyr Khymych</span></p>
      </div>
      <p class="foot-credit">Portrait: Liudmyla Petruk. Fonts: Literata, Inter; the scroll line is written in EMS Allure (SIL Open Font License).</p>
    </div></footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly home = this.i18n.href('/');
  protected readonly lda = LDA_PUBLISHED;
  protected readonly enLegal = 'I am not an attorney and, therefore, cannot give legal advice about immigration or any other legal matters. California limits the notarial fee to $15 per signature (acknowledgment) or per person (jurat).';
}
