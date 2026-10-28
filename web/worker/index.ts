// API Worker for /api/* (static pages are served from assets; see wrangler.jsonc run_worker_first).
// This is not Angular SSR: a small fetch handler for the appointment and LDA request forms.
//
// POST /api/request          JSON (fetch) or form-encoded (no-JS) → validate → anti-abuse → idempotent send via Resend
// GET  /api/request/token    signed time-trap token for the form
//
// Anti-abuse, in order (plan §6): origin + size checks, Workers Rate Limiting binding (per location, a brake not a
// global counter), honeypot, signed time-trap, server-side Turnstile verification, shared-schema validation.
// Idempotency is durable: a Durable Object per request key serialises duplicates; Worker memory is never relied on.
// Without Resend secrets the Worker runs in dry-run mode: it validates and records, but sends nothing.
import { DurableObject } from 'cloudflare:workers';
import { type RequestInput, todayInCalifornia, validateRequest } from '../src/app/shared/request-schema';

export interface Env {
  ASSETS: Fetcher;
  BOOKING_STORE: DurableObjectNamespace<BookingStore>;
  BOOKING_LIMIT?: RateLimit;
  SITE_ENV: 'preview' | 'production';
  LDA_PUBLISHED: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_TO_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
  FORM_SECRET?: string;
}

const MAX_BODY = 8 * 1024;
const TOKEN_MIN_MS = 3_000;
const TOKEN_MAX_MS = 2 * 60 * 60 * 1000;
const SECURITY_HEADERS = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-robots-tag': 'noindex, nofollow',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};

const json = (status: number, body: object, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...SECURITY_HEADERS, ...extra } });

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/request/token' && request.method === 'GET') return json(200, { t: await signToken(env, Date.now()) });
    if (url.pathname === '/api/request') {
      if (request.method !== 'POST') return json(405, { error: 'method' }, { allow: 'POST' });
      return handleRequest(request, env, ctx);
    }
    if (url.pathname.startsWith('/api/')) return json(404, { error: 'not_found' });
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const type = request.headers.get('content-type') ?? '';
  const isForm = type.startsWith('application/x-www-form-urlencoded') || type.startsWith('multipart/form-data');
  let locale = 'en';
  const done = (ok: boolean, status: number, body: object) =>
    isForm ? new Response(null, { status: 303, headers: { location: `${locale === 'en' ? '' : `/${locale}`}/request/${ok ? 'sent' : 'error'}/`, ...SECURITY_HEADERS } }) : json(status, body);

  // 1. Origin and size
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json(403, { error: 'origin' });
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return json(413, { error: 'too_large' });
  const raw = await readBody(request, isForm);
  if (!raw) return json(400, { error: 'body' });
  locale = ['en', 'uk', 'ru'].includes(String(raw['locale'])) ? String(raw['locale']) : 'en';

  // 2. Rate limit (per Cloudflare location; cheap first brake)
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.BOOKING_LIMIT) {
    const { success } = await env.BOOKING_LIMIT.limit({ key: `request:${ip}` });
    if (!success) return isForm ? done(false, 429, {}) : json(429, { error: 'rate' }, { 'retry-after': '60' });
  }

  // 3. Honeypot: pretend success, send nothing
  if (typeof raw['company'] === 'string' && raw['company'].trim()) return done(true, 200, { ok: true });

  // 4. Time-trap (JSON path; the no-JS path cannot fetch a token and is marked unverified instead)
  const production = env.SITE_ENV === 'production';
  if (production && !env.FORM_SECRET) {
    console.error('config: FORM_SECRET missing in production');
    return done(false, 500, { error: 'config' });
  }
  if (!isForm) {
    const age = await tokenAge(env, raw['t']);
    if (age === null && (production || env.FORM_SECRET)) return json(403, { error: 'token' });
    if (age !== null && (age < TOKEN_MIN_MS || age > TOKEN_MAX_MS)) return json(403, { error: 'token' });
  }

  // 5. Turnstile, verified server-side
  const key = typeof raw['key'] === 'string' && /^[\w-]{8,64}$/.test(raw['key']) ? raw['key'] : crypto.randomUUID();
  if (env.TURNSTILE_SECRET_KEY && !isForm) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, raw['turnstile'], ip, key, url.hostname);
    if (!ok) return json(403, { error: 'turnstile' });
  } else if (production && !env.TURNSTILE_SECRET_KEY) {
    console.error('config: TURNSTILE_SECRET_KEY missing in production');
    return done(false, 500, { error: 'config' });
  }

  // 6. Validation (shared schema)
  const { value, errors } = validateRequest({ ...raw, key }, todayInCalifornia());
  if (value.service === 'lda' && env.LDA_PUBLISHED !== 'true') return done(false, 404, { error: 'not_available' });
  if (Object.keys(errors).length) return isForm ? done(false, 400, {}) : json(400, { error: 'invalid', fields: errors });

  // 7. Durable idempotency, then send
  const stub = env.BOOKING_STORE.get(env.BOOKING_STORE.idFromName(key));
  const begin = await stub.begin();
  if (begin.state === 'sent') return done(true, 200, { ok: true, id: begin.id, dryRun: begin.dryRun });
  if (begin.state === 'processing') return json(409, { error: 'in_progress' });

  const dryRun = !(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.RESEND_TO_EMAIL);
  if (dryRun && production) {
    await stub.finish({ ok: false });
    console.error('config: Resend secrets missing in production');
    return done(false, 500, { error: 'config' });
  }
  try {
    const id = dryRun ? `dry-${key.slice(0, 8)}` : await sendEmail(env, value, key, isForm);
    ctx.waitUntil(stub.finish({ ok: true, id, dryRun }));
    console.log(JSON.stringify({ event: 'request', service: value.service, dryRun, id })); // no personal data in logs
    return done(true, 200, { ok: true, id, dryRun });
  } catch (e) {
    await stub.finish({ ok: false });
    console.error(JSON.stringify({ event: 'send_failed', service: value.service, error: String((e as Error).message).slice(0, 200) }));
    return done(false, 502, { error: 'send_failed' });
  }
}

async function readBody(request: Request, isForm: boolean): Promise<Record<string, unknown> | null> {
  try {
    if (isForm) {
      const fd = await request.formData();
      return Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
    }
    const text = await request.text();
    if (text.length > MAX_BODY) return null;
    const data = JSON.parse(text);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// ---------- Time-trap token: `${timestamp}.${hmac}` ----------
async function hmac(secret: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!);
}
async function signToken(env: Env, ts: number) {
  return env.FORM_SECRET ? `${ts}.${await hmac(env.FORM_SECRET, String(ts))}` : `${ts}.unsigned`;
}
async function tokenAge(env: Env, t: unknown): Promise<number | null> {
  if (typeof t !== 'string') return null;
  const [ts, sig] = t.split('.');
  if (!/^\d{13}$/.test(ts ?? '')) return null;
  if (env.FORM_SECRET ? sig !== (await hmac(env.FORM_SECRET, ts)) : sig !== 'unsigned') return null;
  return Date.now() - Number(ts);
}

// ---------- Turnstile (server-side siteverify) ----------
async function verifyTurnstile(secret: string, token: unknown, ip: string, idempotencyKey: string, hostname: string) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  body.append('remoteip', ip);
  body.append('idempotency_key', idempotencyKey); // a retry with the same key may re-verify the same token
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; hostname?: string; action?: string };
  return data.success === true && data.action === 'request' && (data.hostname === hostname || hostname === 'localhost');
}

// ---------- Resend ----------
const CITY_NAMES: Record<string, string> = {
  antelope: 'Antelope', 'arden-arcade': 'Arden-Arcade', auburn: 'Auburn', carmichael: 'Carmichael', 'citrus-heights': 'Citrus Heights',
  'elk-grove': 'Elk Grove', 'fair-oaks': 'Fair Oaks', folsom: 'Folsom', lincoln: 'Lincoln', loomis: 'Loomis', 'north-highlands': 'North Highlands',
  orangevale: 'Orangevale', 'rancho-cordova': 'Rancho Cordova', 'rio-linda': 'Rio Linda', rocklin: 'Rocklin', roseville: 'Roseville', sacramento: 'Sacramento', other: 'Other / not sure',
};
const LANG_NAMES: Record<string, string> = { en: 'English', uk: 'Ukrainian', ru: 'Russian' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function buildEmail(v: RequestInput, unverified: boolean) {
  const tag = v.service === 'lda' ? '[LDA]' : '[Notary]';
  const city = v.where === 'office' ? 'Citrus Heights (office)' : CITY_NAMES[v.city ?? ''] ?? '—';
  const subject = v.service === 'lda'
    ? `${tag} ${v.docType || 'Document assistance inquiry'} · ${v.name}${unverified ? ' · unverified' : ''}`
    : `${tag} ${city} · ${v.date} ${v.time} · ${v.signers} signer${v.signers === 1 ? '' : 's'}${unverified ? ' · unverified' : ''}`;
  const rows: [string, string][] = v.service === 'lda'
    ? [['Service', 'Document assistance (LDA)'], ['Document / form', v.docType || '—'], ['Needs help with', v.description || '—'], ['Preferred contact', v.contactPref ?? '—']]
    : [['Service', 'Notary'], ['Where', v.where === 'office' ? 'Client visits her in Citrus Heights' : `Mobile: ${city}`], ['Signers', String(v.signers)], ['Document', v.document || '—'], ['Preferred date', `${v.date}, ${v.time}`]];
  rows.push(['Name', v.name], ['Phone', v.phone], ['Email', v.email || '—'], ['Language', LANG_NAMES[v.lang ?? 'en']], ['Page language', LANG_NAMES[v.locale]], ['Notes', v.notes || '—']);
  const tel = v.phone.replace(/[^\d+]/g, '');
  const text = `${rows.map(([k, val]) => `${k}: ${val}`).join('\n')}\n\nCall: tel:${tel}\nText: sms:${tel}\n${unverified ? '\nSent without JavaScript: anti-spam checks were limited.\n' : ''}`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#faf8f4;font:16px/1.5 Arial,sans-serif;color:#14233a">
<p style="margin:0 0 16px;font:600 20px Georgia,serif">${esc(subject)}</p>
<table cellpadding="8" style="border-collapse:collapse;background:#fff;border:1px solid #e3ded3">${rows.map(([k, val]) => `<tr><td style="color:#55606f;border-top:1px solid #e3ded3;vertical-align:top">${esc(k)}</td><td style="border-top:1px solid #e3ded3;white-space:pre-wrap">${esc(val)}</td></tr>`).join('')}</table>
<p style="margin:20px 0 0"><a href="tel:${esc(tel)}" style="background:#1b3358;color:#fff;padding:10px 16px;text-decoration:none">Call ${esc(v.phone)}</a> &nbsp; <a href="sms:${esc(tel)}">Text</a></p>
${unverified ? '<p style="color:#8c3524">Sent without JavaScript: anti-spam checks were limited.</p>' : ''}
</body></html>`;
  return { subject, text, html };
}

async function sendEmail(env: Env, v: RequestInput, key: string, unverified: boolean): Promise<string> {
  const { subject, text, html } = buildEmail(v, unverified);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: [env.RESEND_TO_EMAIL], reply_to: v.email || undefined, subject, text, html }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok || !data.id) throw new Error(`resend ${res.status}: ${data.message ?? 'no id'}`);
  return data.id;
}

// ---------- Durable idempotency ----------
type Stored = { state: 'processing' | 'sent' | 'failed'; at: number; id?: string; dryRun?: boolean };

/**
 * One instance per request key (idFromName). Requests for the same key are serialised by the object, so a
 * double-click or a retry after a timeout never sends twice. Holds no personal data; deletes itself after 24 h.
 */
export class BookingStore extends DurableObject<Env> {
  async begin(): Promise<{ state: 'new' | 'processing' | 'sent'; id?: string; dryRun?: boolean }> {
    const cur = await this.ctx.storage.get<Stored>('s');
    if (cur?.state === 'sent') return { state: 'sent', id: cur.id, dryRun: cur.dryRun };
    if (cur?.state === 'processing' && Date.now() - cur.at < 60_000) return { state: 'processing' };
    await this.ctx.storage.put<Stored>('s', { state: 'processing', at: Date.now() });
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
    return { state: 'new' };
  }

  async finish(r: { ok: boolean; id?: string; dryRun?: boolean }) {
    await this.ctx.storage.put<Stored>('s', r.ok ? { state: 'sent', at: Date.now(), id: r.id, dryRun: r.dryRun } : { state: 'failed', at: Date.now() });
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}
