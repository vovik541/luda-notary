// Build-time constants, set per configuration in angular.json (`define`).
declare const LDA_PUBLISHED: boolean; // false in production until LDA registration and disclosures are verified
declare const SITE_ENV: 'preview' | 'production'; // preview builds are noindex everywhere
declare const SITE_URL: string; // absolute origin used for canonicals, hreflang and the sitemap
declare const TURNSTILE_SITE_KEY: string; // public Cloudflare Turnstile site key; empty disables the widget (draft)
