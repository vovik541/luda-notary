import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { I18n } from '../core/i18n';
import { SITE } from '../content/site';
import { CONTACT_PREFS, type ErrorCode, todayInCalifornia, validateRequest } from './request-schema';
import { RequestClient, newKey } from './request-client';

type State = 'form' | 'sending' | 'sent' | 'dry' | 'failed' | 'rate';

/**
 * LDA (document assistance) inquiry: a separate flow from the notary request, with its own fields,
 * acknowledgement and email subject. Rendered only where LDA pages are built (see LDA_PUBLISHED).
 */
@Component({
  selector: 'lp-lda-form',
  template: `
    <section class="book" id="inquiry" aria-labelledby="lda-h"><div class="wrap book-grid">
      <div class="book-head">
        <h2 id="lda-h">{{ t().ldaForm.h2 }}</h2>
        <p>{{ t().ldaForm.intro }}</p>
        <p class="small">{{ t().request.preferTalk }} <a [href]="'tel:' + site.tel">{{ site.phone }}</a>.</p>
      </div>
      <form class="book-form step" method="post" action="/api/request" novalidate (submit)="submit($event)" (focusin)="client.warmUp()">
        <input type="hidden" name="service" value="lda"><input type="hidden" name="locale" [value]="i18n.locale()">
        <div class="hp" aria-hidden="true"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></div>
        @if (state() === 'sent' || state() === 'dry') {
          <div class="req-state" tabindex="-1">
            <p class="done-title">{{ t().request.sentTitle }}</p>
            <p>{{ t().request.sentNext }}</p>
            @if (state() === 'dry') { <p class="small">{{ t().request.dryRun }}</p> }
          </div>
        } @else {
          <label class="field"><span>{{ t().ldaForm.docType }} <em>{{ t().request.optional }}</em></span><input name="docType" type="text" [placeholder]="t().ldaForm.docTypePlaceholder" (input)="set('docType', $any($event.target).value)"></label>
          <label class="field"><span>{{ t().ldaForm.description }}</span>
            <textarea name="description" rows="4" [placeholder]="t().ldaForm.descriptionPlaceholder" [class.is-invalid]="err('description')" (input)="set('description', $any($event.target).value)"></textarea>
            @if (err('description')) { <span class="field-error">{{ msg(err('description')) }}</span> }
          </label>
          <div class="row">
            <label class="field"><span>{{ t().request.name }}</span><input name="name" type="text" autocomplete="name" [class.is-invalid]="err('name')" (input)="set('name', $any($event.target).value)">
              @if (err('name')) { <span class="field-error">{{ msg(err('name')) }}</span> }</label>
            <label class="field"><span>{{ t().request.phone }}</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" [class.is-invalid]="err('phone')" (input)="set('phone', $any($event.target).value)">
              @if (err('phone')) { <span class="field-error">{{ msg(err('phone')) }}</span> }</label>
          </div>
          <div class="row">
            <label class="field"><span>{{ t().request.email }} <em>{{ t().request.optional }}</em></span><input name="email" type="email" autocomplete="email" [class.is-invalid]="err('email')" (input)="set('email', $any($event.target).value)">
              @if (err('email')) { <span class="field-error">{{ msg(err('email')) }}</span> }</label>
            <label class="field"><span>{{ t().ldaForm.contactPref }}</span>
              <select name="contactPref" (change)="set('contactPref', $any($event.target).value)">
                @for (p of prefs; track p; let i = $index) { <option [value]="p">{{ t().ldaForm.contactPrefs[i] }}</option> }
              </select></label>
          </div>
          <label class="ack"><input type="checkbox" name="ack" (change)="set('ack', $any($event.target).checked ? 'true' : '')"><span>{{ t().ldaForm.acknowledge }}</span></label>
          @if (err('ack')) { <span class="field-error">{{ msg('required') }}</span> }
          @if (state() === 'failed' || state() === 'rate') {
            <p class="field-error">{{ state() === 'rate' ? t().request.rateLimited : t().request.failedTitle }} · <a [href]="'tel:' + site.tel">{{ t().request.callNow }}</a></p>
          }
          <div class="step-nav"><button class="btn btn-primary" type="submit" [attr.aria-busy]="state() === 'sending'" [disabled]="state() === 'sending'">{{ state() === 'sending' ? t().request.sending : t().ldaForm.send }}</button></div>
        }
      </form>
    </div></section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LdaForm {
  protected readonly i18n = inject(I18n);
  protected readonly client = inject(RequestClient);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly prefs = CONTACT_PREFS;
  protected readonly state = signal<State>('form');
  protected readonly errors = signal<Partial<Record<string, ErrorCode>>>({});
  private readonly f: Record<string, string> = {};
  private key = '';

  constructor() {
    afterNextRender(() => (this.key = newKey()));
  }

  protected set(name: string, value: string) { this.f[name] = value; }
  protected err(name: string) { return this.errors()[name]; }
  protected msg(code: ErrorCode | undefined) { return code ? this.t().request.errors[code] : ''; }

  protected async submit(e: Event) {
    e.preventDefault();
    if (this.state() === 'sending') return;
    const { value, errors } = validateRequest({ ...this.f, service: 'lda', locale: this.i18n.locale(), lang: this.i18n.locale(), key: this.key }, todayInCalifornia());
    this.errors.set(errors);
    if (Object.keys(errors).length) return;
    this.state.set('sending');
    const res = await this.client.send(value, null);
    this.state.set(res.kind === 'sent' ? (res.dryRun ? 'dry' : 'sent') : res.kind === 'rate' ? 'rate' : res.kind === 'invalid' ? 'form' : 'failed');
    if (res.kind === 'invalid') this.errors.set(res.fields as Record<string, ErrorCode>);
  }
}
