import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { I18n } from '../core/i18n';
import { reducedMotion } from './motion';

export type QA = { q: string; a: string };
type Bubble = { id: number; who: 'her' | 'you'; text: string; typing?: boolean };

/**
 * FAQ as a chat with Liudmyla (prototype A3): a question becomes your bubble, a short typing pause, then her answer.
 * The prerendered HTML holds the plain Q&A list (SEO, no-JS); the chat replaces it after hydration.
 * Reduced motion: the answer appears at once.
 */
@Component({
  selector: 'lp-faq-chat',
  template: `
    <div class="faq-chat">
      <div class="chat-qs" role="group" [attr.aria-label]="t().faq.questionsLabel">
        @for (item of items(); track item.q; let i = $index) {
          <button type="button" class="chat-q" [class.is-asked]="asked().has(i)" [class.is-current]="current() === i" (click)="ask(i)">{{ item.q }}</button>
        }
      </div>
      <div class="chat-window">
        <div class="chat-head"><img src="/img/liudmyla-cutout-head.webp" width="480" height="584" alt="" loading="lazy"><p><b translate="no">{{ name() }}</b><span>{{ note() }}</span></p></div>
        <div class="chat-log" #log role="log" aria-live="polite" [attr.aria-label]="t().faq.answersLabel">
          <p class="bubble from-her">{{ t().faq.greet }}</p>
          @for (b of bubbles(); track b.id) {
            @if (b.typing) {
              <p class="bubble from-her typing" aria-hidden="true"><i></i><i></i><i></i></p>
            } @else {
              <p class="bubble" [class.from-her]="b.who === 'her'" [class.from-you]="b.who === 'you'">{{ b.text }}</p>
            }
          }
        </div>
      </div>
      <dl class="chat-answers">
        @for (item of items(); track item.q) {
          <div><dt>{{ item.q }}</dt><dd>{{ item.a }}</dd></div>
        }
      </dl>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqChat {
  readonly items = input.required<QA[]>();
  readonly name = input('Liudmyla');
  readonly note = input('');
  protected readonly t = inject(I18n).t;
  protected readonly bubbles = signal<Bubble[]>([]);
  protected readonly asked = signal(new Set<number>());
  protected readonly current = signal(-1);
  private readonly log = viewChild.required<ElementRef<HTMLElement>>('log');
  private seq = 0;
  private timer = 0;

  protected ask(i: number) {
    const item = this.items()[i];
    this.current.set(i);
    this.asked.update((s) => new Set(s).add(i));
    clearTimeout(this.timer);
    const without = this.bubbles().filter((b) => !b.typing);
    if (reducedMotion()) {
      this.bubbles.set([...without, { id: ++this.seq, who: 'you', text: item.q }, { id: ++this.seq, who: 'her', text: item.a }]);
      this.scroll();
      return;
    }
    const typingId = ++this.seq + 1;
    this.bubbles.set([...without, { id: this.seq, who: 'you', text: item.q }, { id: ++this.seq, who: 'her', text: '', typing: true }]);
    this.scroll();
    this.timer = window.setTimeout(() => {
      this.bubbles.update((list) => list.map((b) => (b.id === typingId ? { id: ++this.seq, who: 'her', text: item.a } : b)));
      this.scroll();
    }, 700);
  }

  private scroll() {
    requestAnimationFrame(() => {
      const log = this.log().nativeElement;
      const last = log.lastElementChild;
      if (last && !reducedMotion()) last.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
      log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
  }
}
