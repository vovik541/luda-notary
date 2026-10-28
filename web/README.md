# Liudmyla Petruk Notary: website (draft)

An Angular 22 static site (every public page prerendered, `outputMode: "static"`) hosted on **Cloudflare Pages**, with Pages Functions for `/api/*`. The design is ported 1:1 from the approved prototype `design-exploration/experiment-a3-complete`. The full plan is in [`docs/IMPLEMENTATION-PLAN.md`](../docs/IMPLEMENTATION-PLAN.md).

## Requirements

Node ≥ 22.22.3, because Angular CLI 22 requires it. `.node-version` pins 24.19.0, which the Pages build reads too. The system Node here is 22.12, so a portable Node 24 sits in `../.tools/` (git-ignored). Put it first on `PATH` before running any command below:

```bash
export PATH="$(pwd)/../.tools/node-v24.19.0-win-x64:$PATH"
```

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Draft build: LDA pages included with the "Internal draft" bar, every page `noindex`, `robots.txt` disallows all, no sitemap |
| `npm run build:production` | Production build: LDA omitted (no routes, links or sitemap entries), indexable pages, `sitemap.xml`; `*.pages.dev` hostnames stay `noindex` |
| `npm run dev:pages` | Serves `dist/site/browser` and the Functions exactly as Pages would (`_redirects`, `_headers`, nested 404s) on port 8790. For a production build add `-- --binding SITE_ENV=production --binding LDA_PUBLISHED=false` |
| `npm run check` | Checks against the running dev server: redirects, canonicals, hreflang, 404s, sitemap, the signature line at five widths, reduced motion, console errors, and screenshots in `dist/check/` |
| `npm run typecheck:api` | Type-checks the API (`api/`, `functions/`) |
| `npm run deploy` | Draft build, then direct upload with `wrangler pages deploy` (needs `wrangler login`) |

**Restart `dev:pages` after every build.** It may otherwise keep serving a half-replaced `dist/`.

## Deploying on Cloudflare Pages

Pick one of the two ways below.

### Git integration (builds on every push)

In Workers & Pages → Create → Pages → Connect to Git, choose `vovik541/luda-notary`, then set:

| Setting | Value |
|---|---|
| Production branch | `master` |
| Framework preset | None |
| Root directory | `web` |
| Build command | `npm run build` |
| Build output directory | `dist/site/browser` |

`wrangler.jsonc` holds `pages_build_output_dir` and the runtime vars, so it is the source of truth for those. Variables set in the dashboard are ignored for anything the file defines.

Every other branch gets its own preview URL (`<branch>.<project>.pages.dev`).

### Direct upload (from this machine)

```bash
npx wrangler login
```

Run `npx wrangler pages project create liudmyla-petruk-notary --production-branch master` once. After that, deploy with `npm run deploy`.

### After the first deploy

1. **Secrets:** Settings → Variables and Secrets, or `npx wrangler pages secret put NAME`. See the table below. Without the Resend secrets the form runs in dry-run mode (it validates, says so, and sends nothing).
2. **Turnstile:** create a widget for the site's hostnames and put the site key in `TURNSTILE_SITE_KEY` (`angular.json` → `define`). Then add `TURNSTILE_SECRET_KEY` as a secret.
3. **Rate limit:** Pages Functions have no Rate Limiting binding, so add a WAF rule on the custom domain's zone: Security → WAF → Rate limiting rules. Match `URI Path equals /api/request` and `Request Method equals POST`, allow 5 requests per 1 minute per IP, and set the action to Block. On `*.pages.dev` alone there is no zone to add it to; Turnstile and the time-trap still apply there.
4. **Custom domain:** add it under the project's Custom domains. Do this only at launch (blocker B1).

### Launch switch (draft → production)

Change three things together:
- In `wrangler.jsonc`, set `SITE_ENV` to `"production"` and `LDA_PUBLISHED` to `"false"`.
- Change the Pages build command to `npm run build:production`.
- Make sure all the secrets are set: production refuses to run without them.

## Structure

- `src/app/content/`: copy and data.
  - `en.ts` is the source of truth; `uk.ts` and `ru.ts` must match its shape, or the build fails.
  - `reviews.ts` holds the reviews; `site.ts` holds the verified facts and which cities get a page.
- `src/app/core/`: locale routing helpers, the i18n service (one dictionary chunk per language), and SEO (head tags and JSON-LD).
- `src/app/layout/`, `src/app/pages/`: the shell, header and footer, and the pages.
- `src/app/shared/`: the ported interactions.
  - The signature line, carousel, FAQ chat, three-step request form and LDA inquiry form.
  - `request-schema.ts` is the validation shared with the API.
- `functions/api/[[path]].ts`: the Pages Functions entry for `/api/*`.
  - Pages invokes Functions only for these routes; every page is a static file.
- `api/handler.ts`: the `/api/request` handler.
  - Anti-abuse runs in this order: honeypot, time-trap token, Turnstile.
  - Then validation, then Resend.
  - Idempotency comes from Resend's `Idempotency-Key`, kept for 24 h, so a double submit sends one email and needs no storage of ours.
  - Dry-run when the Resend secrets are missing.
- `scripts/postbuild.mjs`: per-locale `404.html`, `_redirects` (legacy URLs), `_headers`, `robots.txt` and `sitemap.xml`.

## Configuration

**Build-time constants** are set per configuration in `angular.json` under `define`: `LDA_PUBLISHED`, `SITE_ENV`, `SITE_URL` and `TURNSTILE_SITE_KEY`. The draft `SITE_URL` assumes the Pages project is named `liudmyla-petruk-notary`.

**Runtime vars** (`SITE_ENV`, `LDA_PUBLISHED`) live in `wrangler.jsonc` and must match the build.

**Secrets:**

| Secret | Needed for |
|---|---|
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL` | Sending email. `RESEND_FROM_EMAIL` must be on a domain verified in Resend. Without them the API runs in dry-run mode in the draft, and refuses requests in production |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile check. Required in production |
| `FORM_SECRET` | Signing the time-trap token (any long random string). Required in production |

For local runs, put secrets in `web/.dev.vars` (git-ignored).
