// Shared by the browser form and the API Worker (worker/index.ts): one definition of what a valid request is.
// Plain TypeScript, no Angular imports.
export const SERVICES = ['notary', 'lda'] as const;
export const LANGS = ['en', 'uk', 'ru'] as const;
export const WHERE = ['mobile', 'office'] as const;
export const TIMES = ['any', 'morning', 'afternoon', 'evening'] as const;
export const CONTACT_PREFS = ['call', 'text', 'email'] as const;
export const CITY_SLUGS = [
  'antelope', 'arden-arcade', 'auburn', 'carmichael', 'citrus-heights', 'elk-grove', 'fair-oaks', 'folsom', 'lincoln', 'loomis',
  'north-highlands', 'orangevale', 'rancho-cordova', 'rio-linda', 'rocklin', 'roseville', 'sacramento', 'other',
] as const;

export type Service = (typeof SERVICES)[number];
export type ErrorCode = 'required' | 'phone' | 'email' | 'date' | 'signers';

export type RequestInput = {
  service: Service;
  locale: (typeof LANGS)[number];
  key: string; // idempotency key (UUID), generated once per draft in the browser
  // notary
  where?: (typeof WHERE)[number];
  city?: (typeof CITY_SLUGS)[number] | '';
  signers?: number;
  document?: string;
  date?: string; // YYYY-MM-DD
  time?: (typeof TIMES)[number];
  // lda
  docType?: string;
  description?: string;
  contactPref?: (typeof CONTACT_PREFS)[number];
  ack?: boolean;
  // both
  lang?: (typeof LANGS)[number];
  name: string;
  phone: string;
  email?: string;
  notes?: string;
};

export const LIMITS = { name: 80, phone: 30, email: 120, document: 120, docType: 120, description: 1200, notes: 1200 } as const;

const pick = <T extends readonly string[]>(list: T, v: unknown, fallback?: T[number]) =>
  (typeof v === 'string' && (list as readonly string[]).includes(v) ? v : fallback) as T[number] | undefined;
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const longText = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');

/** Which fields belong to which step of the notary form (for per-step validation in the browser). */
export const NOTARY_STEPS: (keyof RequestInput)[][] = [['where', 'city', 'signers', 'document'], ['date', 'time', 'lang'], ['name', 'phone', 'email', 'notes']];

/**
 * Normalise and validate untrusted input. `today` is YYYY-MM-DD in the business time zone.
 * Returns the cleaned value and a map of field errors (empty when valid).
 */
export function validateRequest(raw: Record<string, unknown>, today: string): { value: RequestInput; errors: Partial<Record<keyof RequestInput, ErrorCode>> } {
  const service = pick(SERVICES, raw['service'], 'notary')!;
  const value: RequestInput = {
    service,
    locale: pick(LANGS, raw['locale'], 'en')!,
    key: text(raw['key'], 64),
    lang: pick(LANGS, raw['lang'], 'en'),
    name: text(raw['name'], LIMITS.name),
    phone: text(raw['phone'], LIMITS.phone),
    email: text(raw['email'], LIMITS.email),
    notes: longText(raw['notes'], LIMITS.notes),
  };
  const errors: Partial<Record<keyof RequestInput, ErrorCode>> = {};
  if (!value.name) errors.name = 'required';
  const digits = value.phone.replace(/\D/g, '');
  if (!value.phone) errors.phone = 'required';
  else if (digits.length < 10 || digits.length > 15) errors.phone = 'phone';
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email)) errors.email = 'email';

  if (service === 'notary') {
    value.where = pick(WHERE, raw['where'], 'mobile');
    value.city = pick(CITY_SLUGS, raw['city']) ?? '';
    value.signers = Number.parseInt(String(raw['signers'] ?? '1'), 10);
    value.document = text(raw['document'], LIMITS.document);
    value.date = text(raw['date'], 10);
    value.time = pick(TIMES, raw['time'], 'any');
    if (value.where === 'mobile' && !value.city) errors.city = 'required';
    if (!Number.isInteger(value.signers) || value.signers < 1 || value.signers > 20) errors.signers = 'signers';
    if (!value.date) errors.date = 'required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date) || value.date < today) errors.date = 'date';
  } else {
    value.docType = text(raw['docType'], LIMITS.docType);
    value.description = longText(raw['description'], LIMITS.description);
    value.contactPref = pick(CONTACT_PREFS, raw['contactPref'], 'call');
    value.ack = raw['ack'] === true || raw['ack'] === 'on' || raw['ack'] === 'true';
    if (!value.description) errors.description = 'required';
    if (!value.ack) errors.ack = 'required';
    if (value.contactPref === 'email' && !value.email) errors.email = 'required';
  }
  return { value, errors };
}

/** Today's date in California (the business time zone), as YYYY-MM-DD. */
export function todayInCalifornia(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
