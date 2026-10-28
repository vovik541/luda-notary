// Shared, fact-checked content for all three concepts.
// Status keys: "confirmed" (owner/SOS supplied), "owner" (owner-provided, not independently verified),
// "draft" (needs owner confirmation before publishing).

export const biz = {
  name: 'Liudmyla Petruk Notary',
  person: 'Liudmyla Petruk',
  first: 'Liudmyla',
  base: 'Citrus Heights, CA',
  baseLine: 'Citrus Heights, CA — by appointment',
  phone: '+1 (916) 301-3829',
  tel: '+19163013829',
  email: 'mila.petruk.ca@gmail.com',
  gbp: 'https://g.page/r/CTb1cQGUE5RGEAI',
  notary: { title: 'California Notary Public', number: '2538244', expires: 'November 6, 2029', source: 'California Secretary of State active-notary listing (supplied by the owner)' },
  lda: { title: 'Legal Document Assistant', county: 'Sacramento County', number: '2026-004', expires: null, status: 'Owner-provided — not yet verified with Sacramento County' },
  languages: ['English', 'Ukrainian', 'Russian'],
  payments: ['Zelle', 'Cash', 'Check'],
};

export const hours = [
  ['Monday', '10:00 AM – 8:00 PM'],
  ['Tuesday', '10:00 AM – 8:00 PM'],
  ['Wednesday', '10:00 AM – 8:00 PM'],
  ['Thursday', '10:00 AM – 8:00 PM'],
  ['Friday', '10:00 AM – 6:00 PM'],
  ['Saturday', 'Closed'],
  ['Sunday', 'Closed'],
];
export const hoursNote = 'Weekend appointments may be possible by prior arrangement, for an additional fee agreed in advance. Same-day appointments may be available after confirmation.';

export const disclaimer = 'I am not an attorney and, therefore, cannot give legal advice about immigration or any other legal matters.';
export const ldaDisclaimer = 'I am not an attorney and do not provide legal advice or representation.';

// Service area. county: S = Sacramento County, P = Placer County.
// lat/lon are approximate city centres, used only to draw a schematic map.
export const cities = [
  { name: 'Lincoln', county: 'P', group: 'North', lat: 38.892, lon: -121.293, lab: [8, 4, 'start'] },
  { name: 'Auburn', county: 'P', group: 'North', lat: 38.897, lon: -121.077, lab: [-9, 4, 'end'] },
  { name: 'Rocklin', county: 'P', group: 'North', lat: 38.791, lon: -121.236, lab: [-9, 4, 'end'] },
  { name: 'Loomis', county: 'P', group: 'North', lat: 38.821, lon: -121.193, lab: [9, 4, 'start'], pending: true },
  { name: 'Roseville', county: 'P', group: 'Central', lat: 38.752, lon: -121.288, lab: [-9, 4, 'end'] },
  { name: 'Citrus Heights', county: 'S', group: 'Central', lat: 38.707, lon: -121.281, lab: [9, 4, 'start'], base: true, slug: 'citrus-heights' },
  { name: 'Antelope', county: 'S', group: 'Central', lat: 38.708, lon: -121.33, lab: [-9, 4, 'end'] },
  { name: 'Orangevale', county: 'S', group: 'Central', lat: 38.679, lon: -121.226, lab: [0, -10, 'middle'] },
  { name: 'Fair Oaks', county: 'S', group: 'Central', lat: 38.645, lon: -121.272, lab: [9, 4, 'start'] },
  { name: 'Carmichael', county: 'S', group: 'Central', lat: 38.617, lon: -121.328, lab: [-9, 4, 'end'] },
  { name: 'Folsom', county: 'S', group: 'Central', lat: 38.678, lon: -121.176, lab: [9, 12, 'start'] },
  { name: 'Rancho Cordova', county: 'S', group: 'Central', lat: 38.589, lon: -121.302, lab: [9, 4, 'start'] },
  { name: 'Sacramento', county: 'S', group: 'Sacramento', lat: 38.58, lon: -121.49, lab: [0, 20, 'middle'] },
  { name: 'Arden-Arcade', county: 'S', group: 'Sacramento', lat: 38.602, lon: -121.378, lab: [-9, 4, 'end'] },
  { name: 'North Highlands', county: 'S', group: 'Sacramento', lat: 38.686, lon: -121.372, lab: [-9, 16, 'end'] },
  { name: 'Rio Linda', county: 'S', group: 'Sacramento', lat: 38.691, lon: -121.448, lab: [-4, -10, 'end'] },
  { name: 'Elk Grove', county: 'S', group: 'South', lat: 38.409, lon: -121.372, lab: [9, 4, 'start'] },
];
export const groups = [
  ['North', 'Placer County north'],
  ['Central', 'Around Citrus Heights'],
  ['Sacramento', 'Sacramento and nearby'],
  ['South', 'South county'],
];
export const countyName = { S: 'Sacramento County', P: 'Placer County' };

export const services = [
  { id: 'mobile', name: 'Mobile notary visits', short: 'Liudmyla comes to your home, office or another agreed place in the service area.',
    when: 'You cannot easily travel, several people need to sign together, or you simply prefer to sign at home.',
    body: 'Appointments are arranged by phone, text or the request form. Travel is quoted individually and confirmed with you before the appointment.' },
  { id: 'acknowledgments', name: 'Acknowledgments', short: 'Confirms your identity and that you signed the document willingly.',
    when: 'Deeds, agreements, trusts, powers of attorney and many forms that say "acknowledged before me".',
    body: 'You sign (or confirm your signature) in front of the notary, show acceptable ID, and the notary completes a California acknowledgment certificate.' },
  { id: 'jurats', name: 'Jurats', short: 'You swear or affirm that a document is true, then sign it in front of the notary.',
    when: 'Affidavits, sworn declarations and other statements made under oath.',
    body: 'The notary gives the oath or affirmation, you sign in her presence, and she completes the jurat certificate.' },
  { id: 'poa', name: 'Power of attorney notarization', short: 'Notarizing a power of attorney you have already prepared.', link: 'service-detail.html',
    when: 'Financial, durable and other powers of attorney that need a notarized signature.',
    body: 'California notaries take a thumbprint in the notary journal for powers of attorney. The notary does not draft the document or advise which kind you need.' },
  { id: 'general', name: 'General document notarization', short: 'Everyday personal and business documents that need a notarized signature.',
    when: 'Consent letters, business forms, vehicle and school documents, and similar paperwork.',
    body: 'Bring the complete, unsigned document. If you are unsure which notarial act your document needs, ask the agency or person who will receive it.' },
  { id: 'realestate', name: 'Real estate documents', short: 'Notarizing deeds and other documents that affect real property.',
    when: 'Grant deeds, quitclaim deeds, deeds of trust and related forms.',
    body: 'California requires the notary to record a thumbprint in her journal for documents affecting real property.' },
];

export const drafts = {
  apostille: { name: 'Apostille assistance', status: 'draft',
    short: 'Help preparing documents that will be sent to the California Secretary of State for an apostille.',
    body: 'An apostille is issued only by the California Secretary of State. Liudmyla can notarize documents that need it and help you prepare the request. She is not affiliated with the Secretary of State and cannot guarantee approval.',
    pending: 'Exact scope, turnaround and handling fee await owner confirmation.' },
  hospital: { name: 'Hospital & care facility visits', status: 'draft',
    short: 'Visits to a signer in a hospital, care home or rehabilitation facility.',
    body: 'The signer must be able to communicate directly with the notary, understand what they are signing and sign willingly, and must have acceptable ID or credible witnesses. Facility rules and visiting hours apply.',
    pending: 'Availability not yet confirmed by the owner. Do not publish until confirmed.' },
  lda: { name: 'Legal document preparation', status: 'owner',
    short: 'Typing and preparing legal documents at your specific direction, as a Legal Document Assistant.',
    body: 'A Legal Document Assistant can prepare documents at your specific direction. She cannot choose forms for you, tell you what to write, or advise you on your legal rights.',
    pending: 'LDA registration No. 2026-004 (Sacramento County) is owner-provided. Expiration date unknown. Keep out of the production set until verified.' },
};

export const steps = [
  ['Tell her what you need', 'Call, text or send the form with the document type, number of signers and where you would like to meet.'],
  ['Confirm the details', 'Liudmyla confirms the time, the place and the full fee before the appointment. Nothing is booked until both sides agree.'],
  ['Meet and sign', 'Bring every signer, acceptable ID for each one and the complete, unsigned document.'],
  ['Pay and you are done', 'Pay by Zelle, cash or check at the appointment. The notary journal entry and certificate are completed on the spot.'],
];

export const prepare = [
  ['A current government photo ID for every signer', 'For example a California driver license or ID card, a U.S. passport, or another ID accepted under California law. It must be current or issued within the last five years.'],
  ['The complete document, unsigned', 'Do not sign in advance unless the document says otherwise. All pages should be present.'],
  ['Everyone who needs to sign', 'Each signer must appear in person and be able to communicate directly with the notary.'],
  ['Credible witnesses, if a signer has no ID', 'California allows identification by credible witnesses in some cases. Ask Liudmyla before the appointment.'],
  ['Payment', 'Zelle, cash or check, for the fee confirmed before the appointment.'],
];

export const reviews = [
  { name: 'Sunny Day', text: 'I had an excellent experience when I did affidavit and notary services with Lyudmila Petruk. It was very professional, efficient, and she made the entire process very smooth.' },
  { name: 'Gina Averina', text: 'Liudmyla Petruk is a true professional — everything was handled clearly, efficiently, and with great attention to detail.' },
  { name: 'Olesea', text: 'Excellent experience! Liudmyla Petruk is a true professional—punctual, knowledgeable, and very helpful.' },
  { name: 'Natalia Boiakova', text: 'She was incredibly kind, professional, and very fast. The whole process was easy and stress-free thanks to her.' },
  { name: 'Наталья Портнова', lang: 'uk', text: 'Спілкування, вивчення та оформлення документів пройшло легко, без напруги.', note: 'Review written in Ukrainian' },
];
export const reviewsNote = 'Excerpts from Google reviews shown on the current website, attributed as published on Google.';

export const faqs = [
  ['How much does a mobile notary appointment cost?', 'California law sets the maximum notarial fee: up to $15 per signature for an acknowledgment and up to $15 per person for a jurat oath. Travel is a separate fee, quoted individually and confirmed with you before the appointment.'],
  ['What ID do I need?', 'A current government-issued photo ID, such as a California driver license or ID card or a U.S. passport, or another ID accepted under California Civil Code §1185. Each signer needs their own ID.'],
  ['Can you tell me which document I need or how to fill it in?', 'No. A notary is not an attorney and cannot give legal advice or choose documents for you. For legal questions, please speak with an attorney.'],
  ['Do you offer same-day or weekend appointments?', 'Same-day appointments may be available after confirmation. Weekends are possible only by prior arrangement, for an additional fee agreed in advance.'],
  ['Can I come to you instead?', 'Yes, by appointment in Citrus Heights. The exact address is shared when your appointment is confirmed.'],
  ['How do I pay?', 'By Zelle, cash or check at the appointment, after the fee has been confirmed with you. No payment is requested before the appointment is confirmed.'],
  ['Which languages do you speak?', 'Liudmyla speaks English, Ukrainian and Russian, so she can communicate directly with signers in any of the three.'],
];

export const pricing = [
  { item: 'Notarization fee', value: 'Up to $15', unit: 'per signature (acknowledgment) · per person (jurat oath)', note: 'Maximum set by California Government Code §8211. Verify against current law before launch.' },
  { item: 'Mobile travel fee', value: 'Quoted individually', unit: 'for each appointment', note: 'Depends on location and time. Confirmed before the appointment.' },
  { item: 'Additional distance', value: 'Confirmed before appointment', unit: 'for locations farther from Citrus Heights', note: 'Agreed with you in advance. No surprise charges.' },
  { item: 'Weekend appointment', value: 'Contact for pricing', unit: 'by prior arrangement only', note: 'Availability is not guaranteed.' },
  { item: 'Other services', value: 'Quoted individually', unit: 'apostille assistance, facility visits, document preparation', note: 'Government fees, such as the Secretary of State apostille fee, are separate.' },
];

export const route = [
  ['/', 'Home'], ['/services/', 'Services'], ['/services/power-of-attorney/', 'Power of attorney'],
  ['/services/apostille-assistance/', 'Apostille assistance (draft)'], ['/services/hospital-notary/', 'Hospital & care facility (draft)'],
  ['/pricing/', 'Pricing'], ['/service-area/', 'Service areas'], ['/service-area/citrus-heights/', 'Citrus Heights'],
  ['/about/', 'About'], ['/contact/', 'Contact'], ['/privacy/', 'Privacy'], ['/terms/', 'Terms'],
];
