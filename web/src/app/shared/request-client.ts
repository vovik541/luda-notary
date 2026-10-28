import { Injectable } from '@angular/core';
import type { RequestInput } from './request-schema';

export type SendResult =
  | { kind: 'sent'; dryRun: boolean }
  | { kind: 'invalid'; fields: Record<string, string> }
  | { kind: 'turnstile' }
  | { kind: 'rate' }
  | { kind: 'failed'; offline: boolean };

declare global {
  interface Window { turnstile?: { render(el: HTMLElement, o: Record<string, unknown>): string; reset(id?: string): void } }
}

/** Talks to the API Worker. The same idempotency key is reused on every retry of one request. */
@Injectable({ providedIn: 'root' })
export class RequestClient {
  private token: Promise<string | null> | null = null;

  /** A signed form token (time-trap). Fetched on first interaction, so it is at least a few seconds old on submit. */
  warmUp() {
    this.token ??= fetch('/api/request/token', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((j: { t?: string } | null) => j?.t ?? null).catch(() => null);
  }

  async send(input: RequestInput, turnstile: string | null): Promise<SendResult> {
    this.warmUp();
    const t = await this.token;
    const body = JSON.stringify({ ...input, t, turnstile, company: '' });
    for (let attempt = 0; attempt < 3; attempt++) {
      let res: Response;
      try {
        res = await fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(15000) });
      } catch {
        return { kind: 'failed', offline: typeof navigator !== 'undefined' && navigator.onLine === false };
      }
      const data = (await res.json().catch(() => ({}))) as { dryRun?: boolean; fields?: Record<string, string> };
      if (res.ok) return { kind: 'sent', dryRun: !!data.dryRun };
      if (res.status === 409) { await new Promise((r) => setTimeout(r, 1500)); continue; } // first attempt still in progress
      if (res.status === 400 && data.fields) return { kind: 'invalid', fields: data.fields };
      if (res.status === 403) { this.token = null; return { kind: 'turnstile' }; }
      if (res.status === 429) return { kind: 'rate' };
      return { kind: 'failed', offline: false };
    }
    return { kind: 'failed', offline: false };
  }

  /** Cloudflare Turnstile, only when a site key is configured for this build. */
  renderTurnstile(el: HTMLElement, onToken: (t: string | null) => void) {
    if (!TURNSTILE_SITE_KEY) return;
    const go = () => window.turnstile?.render(el, { sitekey: TURNSTILE_SITE_KEY, action: 'request', callback: onToken, 'expired-callback': () => onToken(null), 'error-callback': () => onToken(null) });
    if (window.turnstile) { go(); return; }
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = go;
    document.head.append(s);
  }
}

export const newKey = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
