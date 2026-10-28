import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { I18n } from '../core/i18n';
import { CITIES, SITE } from '../content/site';
import { type ErrorCode, NOTARY_STEPS, type RequestInput, TIMES, todayInCalifornia, validateRequest } from './request-schema';
import { RequestClient, newKey } from './request-client';
import { EASE, reducedMotion } from './motion';

type State = { kind: 'form' } | { kind: 'sending' } | { kind: 'sent'; dryRun: boolean } | { kind: 'failed'; reason: 'offline' | 'server' | 'rate' };
type FieldName = 'where' | 'city' | 'signers' | 'document' | 'date' | 'time' | 'lang' | 'name' | 'phone' | 'email' | 'notes';
type Fields = Partial<Record<FieldName, string>>;
const STORE = 'lp-request-notary';

/**
 * Notary appointment request in three steps (prototype A3). Each step is checked before moving on; steps slide
 * sideways (transform/opacity). Sending, sent, offline, server error, rate limit and Turnstile states follow plan §6.
 * The draft and its idempotency key live in sessionStorage, so a retry or refresh never loses data or double-sends.
 * Without JavaScript all steps show and the form posts to the Worker, which redirects to a result page.
 */
@Component({
  selector: 'lp-request-form',
  template: `
    <section class="book" id="request" aria-labelledby="bk-h"><div class="wrap book-grid">
      <div class="book-head">
        <h2 data-sig-stop id="bk-h">{{ t().request.h2 }}</h2>
        <p>{{ t().request.intro }}</p>
        <p class="small">{{ t().request.preferTalk }} <a [href]="'tel:' + site.tel">{{ site.phone }}</a>.</p>
      </div>
      <form class="book-form" method="post" action="/api/request" novalidate (submit)="submit($event)" (focusin)="client.warmUp()" #form>
        <input type="hidden" name="service" value="notary"><input type="hidden" name="locale" [value]="i18n.locale()">
        <div class="hp" aria-hidden="true"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></div>
        <ol class="steps" [attr.aria-label]="t().request.steps.join(', ')">
          @for (label of t().request.steps; track $index; let i = $index) {
            <li [attr.aria-current]="isFinal() ? null : step() === i + 1 ? 'step' : null" [class.is-done]="isFinal() || step() > i + 1"><span>{{ i + 1 }}</span>{{ label }}</li>
          }
          <i class="steps-bar" aria-hidden="true" [style.transform]="'scaleX(' + (isFinal() ? 1 : step() / 3) + ')'"></i>
        </ol>
        <div class="step-viewport">
          <fieldset class="step" [class.is-current]="!isFinal() && step() === 1" #s1><legend tabindex="-1">{{ t().request.legends[0] }}</legend>
            <div class="choice" role="radiogroup" [attr.aria-label]="t().request.steps[0]">
              <label><input type="radio" name="where" value="mobile" [checked]="f().where !== 'office'" (change)="set('where', 'mobile')"> {{ t().request.whereMobile }}</label>
              <label><input type="radio" name="where" value="office" [checked]="f().where === 'office'" (change)="set('where', 'office')"> {{ t().request.whereOffice }}</label>
            </div>
            <div class="row">
              <label class="field"><span>{{ t().request.city }}@if (f().where === 'office') { <em>{{ t().request.optional }}</em>}</span>
                <select name="city" autocomplete="address-level2" [class.is-invalid]="err('city')" [attr.aria-invalid]="!!err('city')" (change)="set('city', $any($event.target).value)">
                  <option value="">{{ t().request.cityPlaceholder }}</option>
                  @for (c of cities; track c.slug) { <option [value]="c.slug" [selected]="f().city === c.slug">{{ c.name }}</option> }
                  <option value="other" [selected]="f().city === 'other'">{{ t().request.cityOther }}</option>
                </select>
                @if (err('city')) { <span class="field-error">{{ msg(err('city')) }}</span> }
              </label>
              <label class="field"><span>{{ t().request.signers }}</span>
                <input name="signers" type="number" inputmode="numeric" min="1" max="20" [value]="f().signers ?? '1'" [class.is-invalid]="err('signers')" (input)="set('signers', $any($event.target).value)">
                @if (err('signers')) { <span class="field-error">{{ msg(err('signers')) }}</span> }
              </label>
            </div>
            <label class="field"><span>{{ t().request.document }} <em>{{ t().request.optional }}</em></span><input name="document" type="text" autocomplete="off" [placeholder]="t().request.documentPlaceholder" [value]="f().document ?? ''" (input)="set('document', $any($event.target).value)"></label>
            <div class="step-nav"><button type="button" class="btn btn-primary" (click)="next()">{{ t().request.next }}</button></div>
          </fieldset>
          <fieldset class="step" [class.is-current]="!isFinal() && step() === 2" #s2><legend tabindex="-1">{{ t().request.legends[1] }}</legend>
            <div class="row">
              <label class="field"><span>{{ t().request.date }}</span>
                <input name="date" type="date" [min]="today()" [value]="f().date ?? ''" [class.is-invalid]="err('date')" (change)="set('date', $any($event.target).value)">
                @if (err('date')) { <span class="field-error">{{ msg(err('date')) }}</span> }
              </label>
              <label class="field"><span>{{ t().request.time }}</span>
                <select name="time" (change)="set('time', $any($event.target).value)">
                  @for (v of times; track v; let i = $index) { <option [value]="v" [selected]="(f().time ?? 'any') === v">{{ t().request.times[i] }}</option> }
                </select>
              </label>
            </div>
            <label class="field"><span>{{ t().request.language }}</span>
              <select name="lang" (change)="set('lang', $any($event.target).value)">
                @for (l of langs; track l.code) { <option [value]="l.code" [selected]="(f().lang ?? i18n.locale()) === l.code">{{ l.name }}</option> }
              </select>
            </label>
            <p class="small">{{ t().common.hours }} · {{ t().common.weekends }}.</p>
            <div class="step-nav"><button type="button" class="step-back" (click)="go(1)">{{ t().request.back }}</button><button type="button" class="btn btn-primary" (click)="next()">{{ t().request.next }}</button></div>
          </fieldset>
          <fieldset class="step" [class.is-current]="!isFinal() && step() === 3" #s3><legend tabindex="-1">{{ t().request.legends[2] }}</legend>
            <div class="row">
              <label class="field"><span>{{ t().request.name }}</span>
                <input name="name" type="text" autocomplete="name" [value]="f().name ?? ''" [class.is-invalid]="err('name')" (input)="set('name', $any($event.target).value)">
                @if (err('name')) { <span class="field-error">{{ msg(err('name')) }}</span> }
              </label>
              <label class="field"><span>{{ t().request.phone }}</span>
                <input name="phone" type="tel" autocomplete="tel" inputmode="tel" spellcheck="false" [value]="f().phone ?? ''" [class.is-invalid]="err('phone')" (input)="set('phone', $any($event.target).value)">
                @if (err('phone')) { <span class="field-error">{{ msg(err('phone')) }}</span> }
              </label>
            </div>
            <label class="field"><span>{{ t().request.email }} <em>{{ t().request.optional }}</em></span>
              <input name="email" type="email" autocomplete="email" spellcheck="false" [value]="f().email ?? ''" [class.is-invalid]="err('email')" (input)="set('email', $any($event.target).value)">
              @if (err('email')) { <span class="field-error">{{ msg(err('email')) }}</span> }
            </label>
            <label class="field"><span>{{ t().request.notes }} <em>{{ t().request.optional }}</em></span><textarea name="notes" rows="3" [placeholder]="t().request.notesPlaceholder" [value]="f().notes ?? ''" (input)="set('notes', $any($event.target).value)"></textarea></label>
            <div class="turnstile-slot" #turnstile></div>
            <p class="small">{{ t().request.privacy }}</p>
            <div class="step-nav"><button type="button" class="step-back" (click)="go(2)">{{ t().request.back }}</button>
              <button class="btn btn-primary" type="submit" [attr.aria-busy]="state().kind === 'sending'" [disabled]="state().kind === 'sending'">{{ state().kind === 'sending' ? t().request.sending : t().request.send }}</button></div>
          </fieldset>
          @if (state(); as s) {
            @if (s.kind === 'sent') {
              <div class="req-state step-done" tabindex="-1" #result>
                <p class="done-title">{{ t().request.sentTitle }}</p>
                <p class="done-sum">{{ summary() }}</p>
                <p>{{ t().request.sentNext }}</p>
                @if (s.dryRun) { <p class="small">{{ t().request.dryRun }}</p> }
                <div class="req-fallback"><a class="link" [href]="'tel:' + site.tel">{{ t().request.callNow }}</a><button type="button" class="step-back" (click)="reset()">{{ t().request.again }}</button></div>
              </div>
            } @else if (s.kind === 'failed') {
              <div class="req-state step-done is-error" tabindex="-1" #result>
                <p class="done-title">{{ t().request.failedTitle }}</p>
                @if (s.reason === 'rate') { <p>{{ t().request.rateLimited }}</p> } @else {
                  @if (s.reason === 'offline') { <p>{{ t().request.offline }}</p> }
                  <p>{{ t().request.failedBody }}</p>
                }
                <div class="req-fallback">
                  <button type="button" class="btn btn-primary" (click)="retry()">{{ t().request.retry }}</button>
                  <a [href]="'tel:' + site.tel">{{ t().request.callNow }}</a>
                  <a [href]="smsHref()">{{ t().request.text }}</a>
                  <a [href]="mailHref()">{{ t().request.emailLink }}</a>
                </div>
              </div>
            }
          }
        </div>
        <p class="form-status" role="status" aria-live="polite">{{ status() }}</p>
      </form>
    </div></section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestForm {
  protected readonly i18n = inject(I18n);
  protected readonly client = inject(RequestClient);
  protected readonly t = this.i18n.t;
  protected readonly site = SITE;
  protected readonly cities = CITIES.filter((c) => !c.pending);
  protected readonly times = TIMES;
  protected readonly langs = [{ code: 'en', name: 'English' }, { code: 'uk', name: 'Українська' }, { code: 'ru', name: 'Русский' }];
  protected readonly step = signal(1);
  protected readonly state = signal<State>({ kind: 'form' });
  protected readonly f = signal<Fields>({});
  protected readonly errors = signal<Partial<Record<string, ErrorCode>>>({});
  protected readonly status = signal('');
  protected readonly today = signal('');
  protected readonly isFinal = computed(() => this.state().kind === 'sent' || this.state().kind === 'failed');
  private key = '';
  private turnstileToken: string | null = null;
  private readonly s1 = viewChild.required<ElementRef<HTMLElement>>('s1');
  private readonly s2 = viewChild.required<ElementRef<HTMLElement>>('s2');
  private readonly s3 = viewChild.required<ElementRef<HTMLElement>>('s3');
  private readonly steps = [this.s1, this.s2, this.s3];
  private readonly turnstileEl = viewChild.required<ElementRef<HTMLElement>>('turnstile');
  private readonly resultEl = viewChild<ElementRef<HTMLElement>>('result');

  constructor() {
    afterNextRender(() => {
      this.today.set(todayInCalifornia());
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as { f: Fields; key: string } | null;
        if (saved) { this.f.set(saved.f); this.key = saved.key; }
      } catch { /* storage unavailable: keep an in-memory draft */ }
      this.key ||= newKey();
      this.client.renderTurnstile(this.turnstileEl().nativeElement, (tok) => (this.turnstileToken = tok));
    });
  }

  protected set(name: FieldName, value: string) {
    this.f.update((f) => ({ ...f, [name]: value }));
    if (this.errors()[name]) this.errors.update((e) => ({ ...e, [name]: undefined }));
    this.persist();
  }

  protected err(name: string) { return this.errors()[name]; }
  protected msg(code: ErrorCode | undefined) { return code ? this.t().request.errors[code] : ''; }

  private input(): RequestInput {
    const f = this.f();
    return { ...validateRequest({ ...f, service: 'notary', locale: this.i18n.locale(), lang: f['lang'] ?? this.i18n.locale(), key: this.key }, this.today() || todayInCalifornia()).value };
  }

  private check(fields: string[]) {
    const { errors } = validateRequest({ ...this.f(), service: 'notary', locale: this.i18n.locale(), key: this.key }, this.today() || todayInCalifornia());
    const relevant = Object.fromEntries(Object.entries(errors).filter(([k]) => fields.includes(k)));
    this.errors.set(relevant);
    return Object.keys(relevant);
  }

  protected next() {
    const bad = this.check(NOTARY_STEPS[this.step() - 1] as string[]);
    if (bad.length) { this.status.set(this.t().request.errors.step); this.focusField(bad[0]); return; }
    this.go(this.step() + 1);
  }

  protected go(n: number) {
    const from = this.steps[this.step() - 1]().nativeElement, dir = n > this.step() ? 1 : -1;
    this.status.set('');
    const show = () => {
      this.step.set(n);
      requestAnimationFrame(() => {
        const to = this.steps[n - 1]().nativeElement;
        (to.querySelector('legend') as HTMLElement | null)?.focus({ preventScroll: true });
        if (!reducedMotion()) to.animate([{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE });
        const form = to.closest('form') as HTMLElement;
        if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      });
    };
    if (reducedMotion()) { show(); return; }
    from.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 28}px)` }], { duration: 180, easing: 'ease-in' }).onfinish = show;
  }

  protected async submit(e: Event) {
    e.preventDefault();
    if (this.state().kind === 'sending') return;
    const bad = this.check(NOTARY_STEPS.flat() as string[]);
    if (bad.length) {
      this.status.set(this.t().request.errors.step);
      const stepOf = NOTARY_STEPS.findIndex((s) => (s as string[]).includes(bad[0])) + 1;
      if (stepOf !== this.step()) this.go(stepOf);
      setTimeout(() => this.focusField(bad[0]), 400);
      return;
    }
    this.status.set('');
    this.state.set({ kind: 'sending' });
    const res = await this.client.send(this.input(), this.turnstileToken);
    if (res.kind === 'sent') {
      this.state.set({ kind: 'sent', dryRun: res.dryRun });
      try { sessionStorage.removeItem(STORE); } catch { /* ignore */ }
    } else if (res.kind === 'invalid') {
      this.state.set({ kind: 'form' });
      this.errors.set(res.fields as Record<string, ErrorCode>);
      this.status.set(this.t().request.errors.step);
    } else if (res.kind === 'turnstile') {
      this.state.set({ kind: 'form' });
      this.status.set(this.t().request.turnstile);
      window.turnstile?.reset();
    } else {
      this.state.set({ kind: 'failed', reason: res.kind === 'rate' ? 'rate' : res.offline ? 'offline' : 'server' });
    }
    requestAnimationFrame(() => this.resultEl()?.nativeElement.focus());
  }

  protected retry() {
    this.state.set({ kind: 'form' });
    this.step.set(3);
    requestAnimationFrame(() => (this.steps[2]().nativeElement.closest('form') as HTMLFormElement).requestSubmit());
  }

  protected reset() {
    this.f.set({});
    this.errors.set({});
    this.key = newKey();
    this.persist();
    this.state.set({ kind: 'form' });
    this.step.set(1);
  }

  protected summary() {
    const v = this.input(), t = this.t().request;
    const city = this.cities.find((c) => c.slug === v.city)?.name ?? t.cityOther;
    const where = v.where === 'office' ? t.summaryOffice : this.i18n.fmt(t.summaryMobile, { city });
    const date = v.date ? new Date(`${v.date}T12:00`).toLocaleDateString(this.i18n.locale(), { weekday: 'short', month: 'short', day: 'numeric' }) : '';
    return [where, `${date}, ${t.times[TIMES.indexOf(v.time ?? 'any')].toLowerCase()}`, v.name].join(' · ');
  }

  protected smsHref() {
    const body = this.i18n.fmt(this.t().request.smsBody, { summary: this.summary(), name: this.input().name });
    return `sms:${SITE.tel}?&body=${encodeURIComponent(body)}`;
  }

  protected mailHref() {
    return `mailto:${SITE.email}?subject=${encodeURIComponent(this.t().request.h2)}&body=${encodeURIComponent(`${this.summary()}\n${this.input().phone}\n${this.input().notes ?? ''}`)}`;
  }

  private focusField(name: string) {
    (document.querySelector(`.book-form [name="${name}"]`) as HTMLElement | null)?.focus();
  }

  private persist() {
    try { sessionStorage.setItem(STORE, JSON.stringify({ f: this.f(), key: this.key })); } catch { /* ignore */ }
  }
}
