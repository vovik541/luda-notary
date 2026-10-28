# Liudmyla Petruk Notary: website (draft)

An Angular 22 static site (every public page prerendered, `outputMode: "static"`) plus a separate Cloudflare Worker for `/api/*`. The design is ported 1:1 from the approved prototype `design-exploration/experiment-a3-complete`. The full plan is in [`docs/IMPLEMENTATION-PLAN.md`](../docs/IMPLEMENTATION-PLAN.md).

## Requirements

Node ≥ 22.22.3, because Angular CLI 22 requires it. The system Node here is 22.12, so a portable Node 24 sits in `../.tools/` (git-ignored). Put it first on `PATH` before running any command below:

```bash
export PATH="$(pwd)/../.tools/node-v24.19.0-win-x64:$PATH"
```

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Draft/preview build: LDA pages included with the "Internal draft" bar, every page `noindex`, `robots.txt` disallows all, no sitemap |
| `npm run build:production` | Production build: LDA omitted (no routes, links or sitemap entries), indexable pages, `sitemap.xml` |
| `npx wrangler dev --port 8790` | Serves the built site and the API exactly as Cloudflare would (static assets, `_redirects`, `_headers`, nested 404s). Add `--env production` for the production Worker settings |
| `npm run check` | Checks against the running dev server: redirects, canonicals, hreflang, 404s, sitemap, the signature line at five widths, reduced motion, console errors, and screenshots in `dist/check/` |
| `npx tsc -p worker/tsconfig.json` | Type-checks the API Worker |

**Restart `wrangler dev` after every build.** It may otherwise keep serving a half-replaced `dist/`.

## Structure

- `src/app/content/`: copy and data.
  - `en.ts` is the source of truth; `uk.ts` and `ru.ts` must match its shape, or the build fails.
  - `reviews.ts` holds the reviews; `site.ts` holds the verified facts and which cities get a page.
- `src/app/core/`: locale routing helpers, the i18n service (one dictionary chunk per language), and SEO (head tags and JSON-LD).
- `src/app/layout/`, `src/app/pages/`: the shell, header and footer, and the pages.
- `src/app/shared/`: the ported interactions.
  - The signature line, carousel, FAQ chat, three-step request form and LDA inquiry form.
  - `request-schema.ts` is the validation shared with the Worker.
- `worker/index.ts`: the `/api/request` handler.
  - Anti-abuse runs in this order: rate limit, honeypot, time-trap token, Turnstile.
  - Durable Object idempotency, then Resend.
  - Dry-run when the Resend secrets are missing.
- `scripts/postbuild.mjs`: per-locale `404.html`, `_redirects` (legacy URLs), `_headers`, `robots.txt` and `sitemap.xml`.

## Configuration

**Build-time constants** are set per configuration in `angular.json` under `define`: `LDA_PUBLISHED`, `SITE_ENV`, `SITE_URL` and `TURNSTILE_SITE_KEY`.

**Worker secrets** go in with `npx wrangler secret put NAME` (add `--env production` for production). For local runs, put them in `web/.dev.vars`, which is git-ignored.

| Secret | Needed for |
|---|---|
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL` | Sending email. `RESEND_FROM_EMAIL` must be on a domain verified in Resend. Without them the Worker runs in dry-run mode in preview, and refuses requests in production |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile check. Required in production; also set `TURNSTILE_SITE_KEY` in the production `define` |
| `FORM_SECRET` | Signing the time-trap token. Required in production |

Nothing has been deployed.
