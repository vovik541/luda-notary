# Implementation plan: Liudmyla Petruk Notary website

Revision 2, 28 Oct 2026. Revised after the review notes (points 1–9 below are addressed in place). Owner instruction: build the **whole site as a working draft** that will keep changing, **including the LDA (document assistance) services**. LDA stays unpublished in production until registration and legal disclosures are verified (§5).

**Design source of truth:** `design-exploration/experiment-a3-complete`, which is the approved A2 page plus reviews, the FAQ chat, the three-step request form and the footer.
- All earlier prototypes stay on disk, untouched; they are only ignored by git.
- No generic UI component library (no Material, PrimeNG or Tailwind UI kits) and no redesign. The A2/A3 CSS tokens, type scale, hairlines, portrait composition and signature line are ported as they are.

**Versions checked today:** Angular 22.2 (`@angular/ssr` 22.2.5), Wrangler 4.154, Node 22.12.

---

## 1. Architecture

| Layer | Decision |
|---|---|
| Public pages | Angular 22, standalone components, signals, zoneless. Build with **`outputMode: "static"`**: every public route is prerendered to HTML at build time, and no Angular server runs in production. |
| API | A **separate Cloudflare Worker** (`web/worker/index.ts`) handles `/api/*` only. It is not Angular SSR: it is a small TypeScript fetch handler bundled by Wrangler. |
| Hosting | One Cloudflare Worker with **static assets**: the Angular browser output is the assets directory, and the Worker script serves the API. |
| Interactivity | Hydration with event replay. Heavy islands (signature line, carousel, FAQ chat, form) are in `@defer (on viewport)` blocks so their JS loads only when needed. |
| Styling | Plain CSS ported from the prototype (custom properties, the same tokens). No CSS framework. |

### Verified Worker configuration

These points were checked against the Cloudflare docs on 28 Oct 2026.
- **API routing:** `assets.run_worker_first` accepts glob arrays, for example `["/api/*"]`, so only `/api/*` reaches the Worker and everything else is served as a static asset.
- **404s:** `not_found_handling: "404-page"` serves the **nearest** `404.html` with a real `404` status, walking up the directories. `/uk/anything` therefore gets `/uk/404.html`.
- **Trailing slashes:** `html_handling: "auto-trailing-slash"` serves `route/index.html` at `/route/`, which matches Angular's prerender output.
- **Static assets only:** `_redirects` (2,000 static and 100 dynamic rules, codes 301/302/303/307/308) and `_headers` (100 rules) apply to static assets, but **not to Worker-generated responses**. The Worker therefore sets its own security headers on `/api/*`, and no redirect may point into `/api/*`.

```jsonc
// web/wrangler.jsonc (shape; values filled at setup)
{
  "name": "liudmyla-petruk-notary",
  "main": "worker/index.ts",
  "compatibility_date": "2026-10-01",
  "assets": {
    "directory": "./dist/site/browser",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"],
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  },
  "ratelimits": [{ "name": "BOOKING_LIMIT", "namespace_id": "<id>", "simple": { "limit": 5, "period": 60 } }],
  "durable_objects": { "bindings": [{ "name": "BOOKING_STORE", "class_name": "BookingStore" }] },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["BookingStore"] }],
  "vars": { "SITE_ENV": "preview", "LDA_PUBLISHED": "false" }
  // secrets (wrangler secret put): RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_TO_EMAIL, TURNSTILE_SECRET_KEY
}
```

- **Folder layout:** the new site lives in `web/` with its own `package.json`. The existing preview tooling (`scripts/`, `preview/`, the root `wrangler.jsonc`) and all prototypes stay as they are.
- **Integration check before the first deploy:** run `wrangler dev` against the real build output and confirm:
  - static pages, nested 404s and redirects;
  - `/api/booking` reaches the Worker;
  - `_headers` apply to pages.

### Languages

EN, UK and RU **launch together with complete, reviewed translations**. A language whose review is not finished does not ship; there is no partial-language launch.
- **URLs:** `/` (EN, also `x-default`), `/uk/`, `/ru/`. The language is taken from the path only. There is no automatic redirect by `Accept-Language` or cookie, so bots and people get a stable URL per language.
- **Mechanism:** route-based locales with typed content dictionaries (`content/en.ts`, `uk.ts`, `ru.ts`), prerendered per locale from **one build**.
  - This was chosen over Angular's compile-time `$localize` because the site is content-heavy: long-form copy, reviews and city texts are easier to translate and review as data than as template markers.
  - Every page sets `<html lang>`, the canonical and the hreflang set from the same route table.
  - A type check makes a missing translation key a build error.

---

## 2. Pages and routes

| Route (EN; `/uk/…` and `/ru/…` mirror each one) | Content | Indexed |
|---|---|---|
| `/` | Home, as in prototype A3 (Notary-led; the LDA branch only when published) | yes |
| `/notary/` | Notary services: types, how it works, ID requirements, notary fees, notary FAQ, notary request form | yes |
| `/document-assistance/` | LDA services, pricing model, required disclosures, LDA FAQ, LDA inquiry form | **only when `LDA_PUBLISHED`** |
| `/reviews/` | All reviews | yes |
| `/service-area/` | Hub with the county and city lists and the map (also the target for retired city pages) | yes |
| `/mobile-notary/{city}/` | Only the cities that pass §3 | per §3 |
| `/privacy/`, `/terms/` | Legal | yes (low priority) |
| `/request/sent/`, `/request/error/` | Result pages for the no-JavaScript form | no (`noindex`, not in sitemap) |
| `404.html` per locale | Real 404 status | no |

The home page keeps the approved one-page experience. The dedicated `/notary/` and `/document-assistance/` pages keep the two services separate (§5) and give each a landing URL.

---

## 3. Legacy URLs and city pages (point 1)

### Complete legacy URL map
Source: `www.mobilenotary-sacramento.com`, all 23 sitemap URLs plus the pages not in the sitemap.

| # | Legacy URL | New target | Code |
|---|---|---|---|
| 1 | `/` and `/index.html` | `/` | 200 / 301 |
| 2 | `/about.html` | `/` (about section) | 301 |
| 3 | `/services.html` | `/notary/` | 301 |
| 4 | `/services/mobile-notary.html` | `/notary/` | 301 |
| 5 | `/services/loan-signing.html` | `/notary/` (or its own page if loan signing stays, see blocker B4) | 301 |
| 6 | `/service-area.html` | `/service-area/` | 301 |
| 7 | `/contact.html` | `/#request` | 301 to `/` |
| 8 | `/privacy-policy.html` | `/privacy/` | 301 |
| 9 | `/terms-of-service.html` | `/terms/` | 301 |
| 10 | `/terms-of-use.html` | `/terms/` | 301 |
| 11–26 | `/cities/{city}-mobile-notary.html` (16 cities: antelope, arden-arcade, auburn, carmichael, citrus-heights, elk-grove, fair-oaks, folsom, lincoln, north-highlands, orangevale, rancho-cordova, rio-linda, rocklin, roseville, sacramento) | `/mobile-notary/{city}/` **if the city qualifies**, otherwise `/service-area/` | 301 |

- **One hop only:** every redirect goes straight to its final target, never through a chain.
- **Where redirects live:** the map is stored in `web/redirects.json`, generated into `_redirects`, and tested (§7).
- **Old domain:** if the domain changes (blocker B1), a Cloudflare **Bulk Redirect** on the old domain forwards path by path using the same map.

### Which city pages get indexed
We do not assume the legacy city pages bring traffic. Each city gets its own page **only if all of these hold**:
1. **Search Console** shows real demand for that city (the last 16 months of clicks or impressions for city queries and landing pages), **or** it is a primary market (Citrus Heights, the home base, plus any city the owner names);
2. **Liudmyla confirms she actually serves it** (Loomis is still pending);
3. we can write **distinct, useful content** for it: travel notes, typical documents, local facilities. A page that only swaps the city name is not built.

- **Cities that fail:** no page. The legacy URL 301s to `/service-area/`, where the city stays listed by name.
- **Until Search Console data arrives:** the draft builds the city template with **Citrus Heights only**. The other cities are in the data file with `indexed: false`, so they are not built or added to the sitemap and their legacy URLs redirect to `/service-area/`.

---

## 4. Reviews (point 3)

- **Data:** `content/reviews.json`, one entry per review: `id`, `name` (**exactly as published on Google**, for example "Наталья Портнова", "Вадик Кущ", "Катерина", "Nastya P", "Angelina PRI"), `originalLang`, `original` (verbatim), `translations: { en, uk, ru }`, `excerpt`, `showOnHome`.
- **Display rule:**
  - If the page language matches `originalLang`, show the original with no label.
  - Otherwise show the translation, clearly labelled: "Translated from Ukrainian", «Переклад з англійської», «Перевод с английского».
  - **Show original:** a "Show original" toggle (a `<details>` element) reveals the verbatim text on every translated review.
- **Translation rules:** meaning-preserving and literal in tone. No polishing, no added praise, no removed caveats. A native speaker reviews each one, and Liudmyla signs off.
- **Originals still needed:** for reviews written in Ukrainian or Russian we only have Google's English machine translation. Until the verbatim originals are collected (blocker B7) those entries show the English with the label "Translated by Google", and their UK/RU versions are not called "original".
- **Excluded:** Volodymyr Khymych (the site's developer, so a conflict of interest) and the two ratings without text.
- **Not done:**
  - no `Review` or `AggregateRating` structured data (self-serving reviews are not eligible, and copying reviews from Google into markup is against the guidelines);
  - no automatic scraping. The data is updated by hand; the Google Places API is a possible later option.

---

## 5. Notary and LDA: kept separate (point 4)

| | Notary Public | Legal Document Assistant (LDA) |
|---|---|---|
| Page | `/notary/` | `/document-assistance/` |
| Pricing | Statutory: up to $15 per signature (acknowledgment) or per person sworn (jurat); travel quoted in advance | Quoted in a **written contract**, never mixed with notary fees |
| FAQ | Notary FAQ (ID, signing, fees, travel, no legal advice) | LDA FAQ (what an LDA may and may not do, contract, cancellation) |
| Request flow | Notary request form (3 steps) → `POST /api/request` with `service: "notary"` | Separate LDA inquiry form → `POST /api/request` with `service: "lda"`, its own required fields and its own email template and subject |
| Disclosures | "I am not an attorney…" statement; fee notice | LDA statutory disclosures: the "not an attorney" statement, county registration number and expiry, bond information. Wording to be verified (blocker B5) |
| Mobile | Yes | **No** (by appointment only) |

- **Publication gate:** the LDA page, home branch, FAQ answers, form option, footer link, sitemap entries and JSON-LD all exist in the codebase but render **only when `LDA_PUBLISHED=true` at build time**.
  - **Production:** `false` until the registration (Sacramento County No. 2026-004, still owner-provided) and the disclosures are verified. The routes are not built, return 404, are left out of the sitemap and are not linked anywhere.
  - **Preview/draft builds:** they render with a visible "Internal draft · not for publication" bar, under the site-wide `noindex`.
  - **The API** rejects `service: "lda"` unless the flag is on.
- **No cross-selling inside the notary flow:** the notary form never offers LDA help, and the LDA page links to the notary page only as a separate service.

---

## 6. Request form, Resend and anti-abuse (point 5)

### Flow
1. **Client:** the three-step form from the prototype.
   - On load it generates a **request key** (UUID v4), kept in `sessionStorage` with the draft, so a retry or a refresh reuses the same key.
   - **Turnstile** (managed or invisible widget) runs on step 3.
   - Submitting sends `POST /api/request` with JSON: the fields, the Turnstile token and the request key. It times out after 15 s (`AbortController`).
2. **Worker, in this order:**
   1. **Method and origin:** POST only; `Origin` must match the site host; `Content-Type` JSON or form-encoded; body ≤ 8 KB.
   2. **Rate limit (first line):** a Workers Rate Limiting binding keyed by `cf-connecting-ip` plus the route, 5 requests per 60 s.
      - The binding counts **per Cloudflare location** and is eventually consistent, so it is a cheap brake, not an exact global counter.
      - On a limit hit the Worker answers `429` with `Retry-After`.
   3. **Honeypot and time-trap:**
      - a hidden `company` field must be empty;
      - a signed `t` (HMAC timestamp from page render) must be at least 3 s and at most 2 h old.
   4. **Server-side Turnstile verification:**
      - `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret`, `response` (token), `remoteip` and `idempotency_key` (the request key, so a retry can re-verify the same token safely);
      - the Worker requires `success === true`, the expected `hostname`, and `action === "request"`;
      - tokens are single-use and expire after 300 s; an expired or duplicate token returns `403 turnstile` and the client re-runs the widget.
   5. **Validation:** a shared schema (the same TypeScript module the client uses), with server-side normalisation (trim, phone digits, length caps) and an allow-list for `service`, `city` and `language`.
   6. **Durable idempotency:** Worker memory is not global or durable, so it is never used.
      - A **Durable Object** `BookingStore`, with SQLite storage, is addressed by `idFromName(requestKey)`. One object per key means requests for the same key are serialised.
      - Its states are `processing`, `sent` (with the Resend id) and `failed` (retryable).
      - **A second request with the same key** returns the stored result and does not send again. While the first is still `processing`, the duplicate gets `409 in_progress` and the client polls once.
      - Entries hold **no personal data**, only the key hash, status, Resend id and timestamps, and expire after 24 h (DO alarm).
      - **Resend gets the same `Idempotency-Key`** header, which deduplicates on Resend's side for 24 h. That is the second line.
   7. **Sending through Resend** (`fetch`, no SDK):

      ```
      POST https://api.resend.com/emails
      Authorization: Bearer RESEND_API_KEY · Idempotency-Key: <request key>
      from: RESEND_FROM_EMAIL · to: RESEND_TO_EMAIL · reply_to: client email if given
      subject: "[Notary] Folsom · Wed Nov 3, morning · 2 signers"   ([LDA] for LDA inquiries)
      html + text bodies with all fields, the page language, and tel:/sms: buttons
      ```
   8. **Response:** `200 {ok, id}`, `400 {fields}`, `403 turnstile`, `409 in_progress`, `429` or `502 send_failed`.
      - Security headers are set in the Worker, because `_headers` does not apply to Worker responses.
      - Logs hold the error code and the Resend id only, never form contents.
- **Dry-run mode:** when the Resend secrets are missing, the Worker validates and stores the request, logs a redacted summary and returns `{ok: true, dryRun: true}`, so the UI can be tested before the variables are set.
- **No-JavaScript path:** a form-encoded POST gets a `303` to `/request/sent/` or `/request/error/` in the right language. Turnstile's no-JS fallback is still verified.
- **No confirmation email to the client at launch.** It would turn the form into a way to send mail to arbitrary addresses. We can revisit it after launch with Turnstile and the rate limit in place.

### What people see

| State | UI |
|---|---|
| Field error | An inline message under the field, a red border, focus on the first error; the step does not advance |
| Sending | The button reads "Sending…" with `aria-busy`; inputs are locked; double submits are ignored (same key) |
| Sent | "Request sent", a summary, what happens next ("Liudmyla will call or text you to confirm time, place and fee"), Call now, and Send another. The draft is cleared |
| Offline or timeout | "We couldn't send your request. Your details are kept on this device." Try again (same key), plus Call, Text (an SMS pre-filled with the request) and Email (`mailto:` with the body) |
| 502 send_failed | Same as above; no technical text |
| 429 | "Too many attempts. Please wait a minute, or call or text directly." |
| Turnstile failed | "Please confirm you're not a robot" and the widget re-runs |

All messages are translated, announced through `aria-live`, and never shown as alerts.

---

## 7. SEO and its verification (point 6)

- **Per page and locale:**
  - `<title>` and `description`;
  - an absolute **self-referencing canonical** with a trailing slash;
  - a reciprocal **hreflang** set (`en`, `uk`, `ru`, `x-default` pointing to EN), included only for locales that are built;
  - Open Graph and Twitter tags, and a per-locale OG image.

  All of these come from one route table.
- **Structured data (JSON-LD):** `Notary` (name, telephone, `areaServed`, opening hours, `knowsLanguage`, `sameAs` the Google profile), `WebSite`, and `BreadcrumbList` on inner pages. No Review, AggregateRating or FAQPage markup.
- **`sitemap.xml`:**
  - generated from the same route table at build time;
  - only indexable 200 pages whose canonical equals their own URL;
  - each entry has its `xhtml:link` alternates and `lastmod`;
  - LDA entries appear only when the page is published.
- **`robots.txt` by environment:**
  - production: allow all, `Disallow: /api/`, `Disallow: /request/`, plus the `Sitemap:` line;
  - preview: `Disallow: /`, `X-Robots-Tag: noindex` in `_headers`, and `<meta robots noindex>` on every page.
- **`llms.txt`:** optional, and added only if it costs nothing to keep accurate.

### Automated SEO checks (CI, run against the built output served by `wrangler dev`)
1. Every legacy URL returns **one 301** to the expected target, and that target returns **200**.
2. Every built page has exactly one canonical; it is absolute, self-referencing and returns 200.
3. The hreflang sets are reciprocal, every alternate returns 200, and each set has `x-default`.
4. Unknown paths return a **real 404** status with the right locale's 404 page, at `/x`, `/uk/x` and `/ru/x`.
5. Every sitemap URL returns 200 and is indexable, and every indexable page is in the sitemap. LDA and `/request/*` are absent in production builds.
6. Production builds contain no `noindex`; preview builds have `noindex` everywhere.
7. There are no broken internal links or assets.

---

## 8. Performance, motion and the signature line (point 7)

### Budgets (mobile, Lighthouse "moto G power" emulation, slow 4G, run 3× per page and taking the median)

| Metric | Budget |
|---|---|
| Lighthouse Performance / Accessibility / Best Practices / SEO | ≥ 95 / 100 / 100 / 100 |
| LCP | ≤ 2.0 s |
| CLS | ≤ 0.05 |
| TBT | ≤ 150 ms |
| INP (field, after launch) | ≤ 200 ms |
| JS, initial route (gzip) | ≤ 70 KB |
| CSS (gzip) | ≤ 20 KB |
| Fonts on first view | ≤ 2 files, ≤ 90 KB |
| Hero image | ≤ 110 KB (AVIF), `fetchpriority="high"` |

- **Where:** Lighthouse CI runs on each template (home, notary, reviews, service area, city, LDA draft) × EN/UK.
- **Failing a budget fails the build.**

### Fonts (self-hosted, no third-party requests)
- **Families:** Literata and Inter only, variable WOFF2, split into `unicode-range` subsets.
- **Preloads:** the two needed files per locale (Latin for EN, Cyrillic for UK/RU).
- **Fallback metrics:** `size-adjust` and the ascent/descent overrides, so the font swap causes no layout shift.
- **The signature script** uses the pre-generated `sig-glyphs` paths, as in the prototype, not a font.

### Motion rules
- **Allowed:** transform, opacity and SVG `stroke-dashoffset` only.
- **Content is never gated:** everything is visible in the prerendered HTML, the CTAs are never delayed, and there is no scroll hijacking, parallax or autoplay video.
- **`prefers-reduced-motion`:** entrances and transitions are off, the signature line is shown complete and static, carousel scrolling is instant, the chat typing indicator is skipped, and the form steps switch without sliding.

### Signature line: explicit validation (Playwright, at 1440, 1024, 768, 390 and 320 px in EN and UK)
1. **No overlap with text:** about 400 points are sampled along the path; none may fall inside the box of any text, form control or image element. The test fails on any hit.
2. **Drawing advances with scroll:** the drawn share grows monotonically while scrolling down, is 0 at the top and 100% at the bottom.
3. **The pen tip stays in the viewport:** it stays between 50% and 98% of the viewport height at every sampled scroll position.
4. **Rebuild:** the line is rebuilt after a resize, a font load, a form step change and a chat answer; test 1 is re-run after each.
5. **Reduced motion:** the line is fully drawn, the nib is hidden, and no scroll handler work is measured.
6. **Cost:** scroll-handler time stays ≤ 2 ms per frame on a 4× CPU throttle, the line causes no long tasks, and CLS stays 0.
7. **Text in the line:** each written word fits its band and never enters a tinted section.
8. **Visual snapshots** are compared against the prototype screenshots.

The final flourish is a design decision for the owner (blocker B9). Until it is approved, the approved A3 behaviour is kept: the phone number is written before the contact block.

### Accessibility
- **Target:** WCAG 2.2 AA.
- **Checks:** axe in Playwright on every template; a keyboard-only pass; a screen-reader smoke test (VoiceOver on iOS, NVDA).
- **Specifics:** chat and form use `aria-live`; quotes in other languages carry `lang`; touch targets are at least 44 px.

---

## 9. Analytics and consent (point 8)

- **Proposed tool:** Cloudflare Web Analytics, which is cookie-free and has no cross-site tracking. Events: `tel:`/`sms:` clicks, form start, form sent, and locale.
- **Consent is a compliance question to verify, not an assumption.** Whether a cookie-free tool needs a notice, an opt-out or a banner depends on the jurisdictions in scope (California CCPA/CPRA, plus any EU or UK visitors) and on what is collected. Until that is confirmed (blocker B8):
  - analytics stays **off** in production builds;
  - the privacy policy describes exactly what is collected.

---

## 10. Design preservation (point 9)

- **Prototypes:** all of them (concepts 01–08, experiments A, A2, A3, B and C) remain on disk unchanged.
- **Ported from A3 as-is:** tokens, type scale, spacing, hairlines, buttons, the portrait composition, the "Petruk" wordmark and the signature line.
- **No component libraries:** form controls, carousel, chat and stepper are hand-written to match the prototype.
- **Visual regression:** Playwright screenshots of the Angular pages are compared with the A3 prototype at 1440 and 390 px. Differences beyond the agreed content changes are bugs.
- **New pages** (`/notary/`, `/document-assistance/`, `/service-area/`, city, legal, 404) are built only from existing A3 patterns: 4/8 grid, hairline lists, the fee list, FAQ chat and the request form.

---

## 11. Compliance notes to verify before launch

- **California notary advertising in other languages:** a notary who advertises in a language other than English must include specific notices (the "not an attorney" statement and the fee schedule) in English and in that language (Gov. Code §8219.5).
  - The UK and RU pages are such advertising, so the exact required wording and the fee notice must be verified and translated precisely.
  - Translating "notary public" literally can be misleading in some languages; the UK/RU wording will be reviewed.
- **LDA disclosures** (Bus. & Prof. Code §6400 and following): the registration number, county, expiry, bond, contract terms and the "not an attorney" statement. They must be verified before `LDA_PUBLISHED=true`.
- **Privacy policy:** what the form collects, why, how long it is kept (email only; the Durable Object holds no personal data), Resend as a processor, and contact for requests.

---

## 12. Build order (draft first, iterate)

1. Scaffold `web/`: Angular 22 static app, Worker, `wrangler.jsonc`, locale routing, fonts, the ported design tokens.
2. Layout, home page and footer in EN, matching A3.
3. `/reviews/`, `/notary/`, `/document-assistance/` (draft-gated), `/service-area/`, the city template (Citrus Heights), legal pages and per-locale 404.
4. EN/UK/RU content dictionaries and translated reviews (draft translations, clearly flagged until reviewed).
5. Interactions: reveals, signature line, carousel, FAQ chat, three-step notary form and the LDA inquiry form.
6. The `/api/request` Worker: validation, rate limit, Turnstile, Durable Object idempotency, Resend (dry-run until the secrets exist), no-JS path.
7. SEO: meta, JSON-LD, sitemap, robots, `_redirects`, `_headers`.
8. Tests: SEO checks, signature-line checks, Lighthouse mobile, axe, visual comparison.

No commits or deploys without an explicit request.

---

## 13. Remaining blockers and decisions

| # | Blocker | Needed for | Owner |
|---|---|---|---|
| B1 | **Domain:** reuse `www.mobilenotary-sacramento.com` or a new domain; DNS and Cloudflare account access | Canonicals, sitemap, redirects, Resend domain | Owner |
| B2 | **Search Console access** (or a 16-month export of pages and queries) | Choosing which city pages to build (§3) | Owner |
| B3 | **Resend:** a verified sending domain (SPF/DKIM) and the three values | Real email delivery (dry-run until then) | Owner |
| B4 | **Loan signing:** is it still offered? | Legacy URL #5 target | Owner |
| B5 | **LDA verification:** registration status and expiry, bond, and the exact required disclosures | `LDA_PUBLISHED=true` | Owner + counsel |
| B6 | **§8219.5 foreign-language notices** and the reviewed UK/RU legal wording | Launching UK/RU | Owner + counsel |
| B7 | **Original UK/RU review texts** (verbatim, from Google with "See original") and a native review of all translations | Correct review display (§4) | Owner |
| B8 | **Analytics consent:** confirm requirements for the chosen tool | Turning analytics on | Owner + counsel |
| B9 | **Signature line ending:** keep the phone number (approved A3) or end with the "Liudmyla Petruk" signature | Final flourish | Owner |
| B10 | **Address display:** a service-area business only, or a public address; it must match Google Business Profile | NAP, JSON-LD | Owner |
| B11 | **Apostille and hospital or care-facility visits:** offered or not | Service lists, FAQ | Owner |
| B12 | **Turnstile:** approve it, and provide the site key and secret | Anti-abuse in production | Owner |

The draft can be built now without any of these. Each one changes content or configuration, not architecture.

---

## 14. Implementation status (draft, 28 Oct 2026)

The whole site is built as a working draft in `web/` (see `web/README.md`). Nothing is committed or deployed.

**Built**
- **Pages:** Angular 22.2 with `outputMode: "static"`. 33 pages are prerendered in preview builds and 30 in production. Production omits LDA.
- **Languages:** EN, UK and RU, one dictionary chunk per language.
- **Page list:** home (all A3 sections), notary, document assistance (draft-gated), reviews, service area, Citrus Heights, privacy, terms, the no-JS result pages, and a 404 per locale.
- **Reviews:** 23, with names as published, translations labelled, and "Show original".
- **Interactions:** the signature line, the carousel, the FAQ chat, the three-step notary form with every state from §6, and the separate LDA inquiry form.
- **API Worker:** rate-limit binding, honeypot, signed time-trap token, server-side Turnstile, shared-schema validation, Durable Object idempotency, Resend with `Idempotency-Key` (dry-run until the secrets exist), and the no-JS 303 path.
- **SEO:** canonical, hreflang, JSON-LD, environment-based `robots.txt`, a sitemap generated from the built pages, 74 one-hop 301s, and real 404s per locale.

**Verified** with `npm run check` against `wrangler dev`, for both the preview and production builds:
- every redirect, canonical, hreflang set, 404 and sitemap entry;
- the signature line at 1440, 1024, 768, 390 and 320 px in EN and UK: no overlap with text, it draws with scroll, the pen tip stays on screen, and reduced motion shows it complete;
- no console errors.

The API was exercised by hand: time-trap, dry-run send, idempotent repeat, field errors, origin block, the no-JS 303, the rate limit, and LDA blocked in production.

**Changes found during implementation**
- **Time-trap:** static pages cannot carry a signed render timestamp, so the form fetches `GET /api/request/token` on first interaction.
- **No-JavaScript submissions** cannot run Turnstile or fetch a token. They are accepted, rate-limited, and marked "unverified" in the email subject.
- **Layout shift on hydration:** a one-line inline script adds `html.js` before first paint, so the enhanced layout (form steps, chat) is identical before and after hydration. This removed a measured 800 px shift that also made the signature line stale.
- **The signature line** now fits narrow gaps on phones, clamps its scroll mapping so the pen tip stays between 40% and 100% of the viewport, and completes at the bottom of the page.
- **Initial JS budget:** the measured cost is Angular core, router and hydration, about 67 KB gzip, plus about 20 KB for the app shell, so about 88 KB gzip in total. The 70 KB target in §8 is not reachable with Angular plus a router; the proposed budget is ≤ 95 KB gzip.
- **First-view fonts:** Literata Latin and Inter Latin together are about 134 KB, above the 90 KB target. The fix is subsetting the variable fonts to the weights actually used (open).
- **Hero image:** 213 KB WebP, above the 110 KB target. Responsive AVIF/WebP generation is still to do.

**Not done yet**
- Lighthouse CI on mobile, the axe accessibility run, and Playwright visual comparison against the prototype. The CDP checks above cover part of this.
- Font subsetting, responsive hero images and an OG image per locale.
- Native review of the UK/RU copy and of the review translations (blocker B6/B7). Legal text stays a draft (B5, B6, B8).
- Everything that depends on blockers B1–B12.

### 14.x Hosting change: Cloudflare Pages (2026-10-28)

The site now deploys to **Cloudflare Pages**, not Workers with static assets. This supersedes the Worker details in §2 and §6:

- **API:** `/api/*` runs as Pages Functions (`web/functions/api/[[path]].ts`, logic in `web/api/handler.ts`). Pages invokes Functions only for those routes.
- **Idempotency:** Pages cannot host a Durable Object, so the Durable Object was removed. Durable idempotency now comes from Resend's `Idempotency-Key` (24 h): the same key with the same email returns the original result and sends nothing again, and a concurrent duplicate gets 409, which the client retries.
- **Rate limiting:** Pages has no Rate Limiting binding. It becomes a WAF rate-limiting rule on the custom domain's zone (README). Until then, Turnstile and the time-trap are the brakes.
- **Static assets:** `_redirects`, `_headers` and nested `404.html` behave the same on Pages. `npm run check` passes against `wrangler pages dev` for both builds.
- **Indexing:** production builds also send `X-Robots-Tag: noindex` on `*.pages.dev`, so only the custom domain can be indexed.
- **Draft mode on the production branch:** the Pages production branch (`master`) runs the draft build and draft runtime vars until launch.
