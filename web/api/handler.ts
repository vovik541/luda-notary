// /api/* handler, mounted by Cloudflare Pages Functions (functions/api/[[path]].ts). Static pages never reach it:
// Pages only invokes Functions for /api/* (the generated _routes.json). Not Angular SSR: just the request forms.
//
// POST /api/request          JSON (fetch) or form-encoded (no-JS) → validate → anti-abuse → idempotent send via Resend
// GET  /api/request/token    signed time-trap token for the form
//
// Anti-abuse, in order (plan §6): origin + size checks, honeypot, signed time-trap, server-side Turnstile
// verification, shared-schema validation. Rate limiting is a Cloudflare WAF rule on the zone (README), because
// Pages Functions have no Rate Limiting binding.
// Idempotency is durable and needs no storage of ours: the form's key is sent to Resend as Idempotency-Key, and
// Resend keeps it for 24 h (same key + same email → original result, no second send; still running → 409).
// Function memory is never relied on. Without Resend secrets the API runs in dry-run mode: it validates, sends nothing.
import { type RequestInput, todayInCalifornia, validateRequest } from '../src/app/shared/request-schema';

export interface Env {
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

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/request/token' && request.method === 'GET') return json(200, { t: await signToken(env, Date.now()) });
  if (url.pathname === '/api/request' || url.pathname === '/api/request/') {
    if (request.method !== 'POST') return json(405, { error: 'method' }, { allow: 'POST' });
    return handleRequest(request, env);
  }
  return json(404, { error: 'not_found' });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
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

  // 2. Rate limit: a WAF rule in front of /api/request answers 429 before this code runs (README).
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

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

  // 7. Send; Resend's Idempotency-Key makes a double-click or a retry after a timeout safe
  const dryRun = !(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.RESEND_TO_EMAIL);
  if (dryRun && production) {
    console.error('config: Resend secrets missing in production');
    return done(false, 500, { error: 'config' });
  }
  try {
    const id = dryRun ? `dry-${key.slice(0, 8)}` : await sendEmail(env, value, key, isForm);
    if (id === IN_PROGRESS) return isForm ? done(true, 200, {}) : json(409, { error: 'in_progress' });
    console.log(JSON.stringify({ event: 'request', service: value.service, dryRun, id })); // no personal data in logs
    return done(true, 200, { ok: true, id, dryRun });
  } catch (e) {
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

const IN_PROGRESS = 'in_progress';

/**
 * Returns Resend's email id, or IN_PROGRESS while a first attempt with the same key is still running.
 * A key reused with a different email (invalid_idempotent_request) throws: the client then shows the call/text fallbacks.
 */
async function sendEmail(env: Env, v: RequestInput, key: string, unverified: boolean): Promise<string> {
  const { subject, text, html } = buildEmail(v, unverified);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: [env.RESEND_TO_EMAIL], reply_to: v.email || undefined, subject, text, html }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
  if (res.status === 409 && data.name === 'concurrent_idempotent_requests') return IN_PROGRESS;
  if (!res.ok || !data.id) throw new Error(`resend ${res.status}: ${data.message ?? 'no id'}`);
  return data.id;
}
