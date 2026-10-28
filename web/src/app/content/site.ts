// Verified business facts. Anything not confirmed by the owner stays out, or behind a flag.
export const SITE = {
  name: 'Liudmyla Petruk',
  phone: '+1 (916) 301-3829',
  tel: '+19163013829',
  email: 'mila.petruk.ca@gmail.com',
  google: 'https://g.page/r/CTb1cQGUE5RGEAI',
  googleReview: 'https://g.page/r/CTb1cQGUE5RGEAI/review',
  commission: { number: '2538244', expires: '2029-11-06' },
  // Owner-provided, not yet verified: only rendered while LDA_PUBLISHED is false in drafts (see LdaDisclosure).
  lda: { county: 'Sacramento County', number: '2026-004', expires: null as string | null },
  hours: [
    { days: ['Mo', 'Tu', 'We', 'Th'], opens: '10:00', closes: '20:00' },
    { days: ['Fr'], opens: '10:00', closes: '18:00' },
  ],
  rating: { score: '5.0', count: 26, asOf: '2026-10' },
};

export type City = { slug: string; name: string; county: 'sacramento' | 'placer'; base?: boolean; pending?: boolean; indexed: boolean };

// indexed: a city gets its own page only after Search Console data, confirmed coverage and distinct content (plan §3).
// Until then only the home base is built; the others are listed on /service-area/ and their legacy URLs redirect there.
export const CITIES: City[] = [
  { slug: 'antelope', name: 'Antelope', county: 'sacramento', indexed: false },
  { slug: 'arden-arcade', name: 'Arden-Arcade', county: 'sacramento', indexed: false },
  { slug: 'carmichael', name: 'Carmichael', county: 'sacramento', indexed: false },
  { slug: 'citrus-heights', name: 'Citrus Heights', county: 'sacramento', base: true, indexed: true },
  { slug: 'elk-grove', name: 'Elk Grove', county: 'sacramento', indexed: false },
  { slug: 'fair-oaks', name: 'Fair Oaks', county: 'sacramento', indexed: false },
  { slug: 'folsom', name: 'Folsom', county: 'sacramento', indexed: false },
  { slug: 'north-highlands', name: 'North Highlands', county: 'sacramento', indexed: false },
  { slug: 'orangevale', name: 'Orangevale', county: 'sacramento', indexed: false },
  { slug: 'rancho-cordova', name: 'Rancho Cordova', county: 'sacramento', indexed: false },
  { slug: 'rio-linda', name: 'Rio Linda', county: 'sacramento', indexed: false },
  { slug: 'sacramento', name: 'Sacramento', county: 'sacramento', indexed: false },
  { slug: 'auburn', name: 'Auburn', county: 'placer', indexed: false },
  { slug: 'lincoln', name: 'Lincoln', county: 'placer', indexed: false },
  { slug: 'loomis', name: 'Loomis', county: 'placer', pending: true, indexed: false },
  { slug: 'rocklin', name: 'Rocklin', county: 'placer', indexed: false },
  { slug: 'roseville', name: 'Roseville', county: 'placer', indexed: false },
];

export const INDEXED_CITIES = CITIES.filter((c) => c.indexed);
