import type { Locale } from '../core/locale';

// Google reviews for Liudmyla Petruk Notary (5.0 from 26 reviews, collected October 2026).
// - name: exactly as published on Google.
// - original: verbatim text in `lang`. For reviews written in Ukrainian or Russian the verbatim original has not been
//   collected yet (plan blocker B7): `googleEn` holds Google's English machine translation and is labelled as such.
// - tr: our meaning-preserving translations of English originals; draft until a native speaker reviews them.
// Left out: Volodymyr Khymych (developer of this site, conflict of interest) and two ratings without text.
export type Review = {
  id: string;
  name: string;
  lang: Locale;
  original?: string;
  googleEn?: string;
  tr?: Partial<Record<Locale, string>>;
  excerpt?: boolean;
  home?: boolean;
};

export const REVIEWS: Review[] = [
  {
    id: 'david-serdyuchenko', name: 'David Serdyuchenko', lang: 'en', home: true,
    original: 'The best notary service! I had a great experience. Everything was fast, efficient, and professional. If you’re looking for someone who truly knows their job, this is the person to call!',
    tr: {
      uk: 'Найкращий нотаріальний сервіс! У мене був чудовий досвід. Усе було швидко, ефективно й професійно. Якщо шукаєте людину, яка справді знає свою справу, — телефонуйте саме їй!',
      ru: 'Лучший нотариальный сервис! У меня был отличный опыт. Всё было быстро, эффективно и профессионально. Если вы ищете человека, который действительно знает своё дело, — звоните именно ей!',
    },
  },
  {
    id: 'natalia-boiakova', name: 'Natalia Boiakova', lang: 'en', home: true,
    original: 'I am very happy with the service provided by Liudmyla. She was incredibly kind, professional, and very fast. The whole process was easy and stress-free thanks to her. I would definitely recommend her to anyone looking for a reliable notary!',
    tr: {
      uk: 'Я дуже задоволена послугою, яку надала Людмила. Вона була надзвичайно доброзичливою, професійною і дуже швидкою. Завдяки їй увесь процес пройшов легко й без стресу. Я однозначно рекомендую її всім, хто шукає надійного нотаріуса!',
      ru: 'Я очень довольна услугой, которую оказала Людмила. Она была невероятно доброжелательной, профессиональной и очень быстрой. Благодаря ей весь процесс прошёл легко и без стресса. Я однозначно рекомендую её всем, кто ищет надёжного нотариуса!',
    },
  },
  {
    id: 'natalia-scherbakova', name: 'Natalia Scherbakova', lang: 'en', home: true,
    original: 'Liudmyla was very professional, kind, and helpful. She explained everything clearly and made the notarization process quick and easy. I am very grateful for her excellent service and highly recommend her to anyone who needs a reliable notary. Thank you so much!',
    tr: {
      uk: 'Людмила була дуже професійною, доброзичливою і корисною. Вона все зрозуміло пояснила, і засвідчення пройшло швидко й легко. Я дуже вдячна за чудовий сервіс і щиро рекомендую її всім, кому потрібен надійний нотаріус. Щиро дякую!',
      ru: 'Людмила была очень профессиональной, доброжелательной и полезной. Она всё понятно объяснила, и заверение прошло быстро и легко. Я очень благодарна за отличный сервис и настоятельно рекомендую её всем, кому нужен надёжный нотариус. Большое спасибо!',
    },
  },
  {
    id: 'sergey-ierebakan', name: 'Sergey Ierebakan', lang: 'en',
    original: 'Thank you Lyudmila , for your competent work, the notary performed her duties professionally. I recommend her.',
    tr: {
      uk: 'Дякую, Людмило, за вашу компетентну роботу, нотаріус виконала свої обов’язки професійно. Рекомендую її.',
      ru: 'Спасибо, Людмила, за вашу компетентную работу, нотариус выполнила свои обязанности профессионально. Рекомендую её.',
    },
  },
  {
    id: 'olga-klymenko', name: 'Olga Klymenko', lang: 'en', home: true,
    original: 'Highly recommend Liudmyla! Excellent service, very professional, and a pleasure to work with. Everything was handled smoothly and efficiently',
    tr: {
      uk: 'Щиро рекомендую Людмилу! Чудовий сервіс, дуже професійно, і з нею приємно працювати. Усе було зроблено гладко й ефективно',
      ru: 'Очень рекомендую Людмилу! Отличный сервис, очень профессионально, и с ней приятно работать. Всё было сделано гладко и эффективно',
    },
  },
  {
    id: 'sunny-day', name: 'Sunny Day', lang: 'en', home: true,
    original: 'I had an excellent experience when I did affidavit and notary services with Lyudmila Petruk. It was very professional, efficient, and she made the entire process very smooth. She took the time to explain to me everything clearly, so I truly appreciated her attention to every detail. I highly recommend her services to anyone looking for reliable and high-quality assistance with absolutely affordable price ;)',
    tr: {
      uk: 'У мене був чудовий досвід, коли я оформлювала афідевіт і нотаріальні послуги в Людмили Петрук. Усе було дуже професійно й ефективно, і вона зробила весь процес дуже легким. Вона знайшла час усе мені зрозуміло пояснити, тож я щиро оцінила її увагу до кожної деталі. Дуже рекомендую її послуги всім, хто шукає надійної та якісної допомоги за цілком доступну ціну ;)',
      ru: 'У меня был отличный опыт, когда я оформляла аффидевит и нотариальные услуги у Людмилы Петрук. Всё было очень профессионально и эффективно, и она сделала весь процесс очень лёгким. Она нашла время всё мне понятно объяснить, так что я искренне оценила её внимание к каждой детали. Очень рекомендую её услуги всем, кто ищет надёжную и качественную помощь по вполне доступной цене ;)',
    },
  },
  {
    id: 'daniel-talmazan', name: 'Daniel Talmazan', lang: 'en', home: true,
    original: 'Excellent notary service. Very professional and helpful. Everything was done quickly and smoothly. Thank you!',
    tr: {
      uk: 'Чудовий нотаріальний сервіс. Дуже професійно й корисно. Усе було зроблено швидко й гладко. Дякую!',
      ru: 'Отличный нотариальный сервис. Очень профессионально и полезно. Всё было сделано быстро и гладко. Спасибо!',
    },
  },
  {
    id: 'olesea', name: 'Olesea', lang: 'en', home: true,
    original: 'Excellent experience! Liudmyla Petruk is a true professional—punctual, knowledgeable, and very helpful. If you need a reliable notary in the Sacramento area, look no further',
    tr: {
      uk: 'Чудовий досвід! Людмила Петрук — справжній професіонал: пунктуальна, обізнана й дуже корисна. Якщо вам потрібен надійний нотаріус у районі Сакраменто, більше не шукайте',
      ru: 'Отличный опыт! Людмила Петрук — настоящий профессионал: пунктуальная, знающая и очень полезная. Если вам нужен надёжный нотариус в районе Сакраменто, больше не ищите',
    },
  },
  {
    id: 'gina-averina', name: 'Gina Averina', lang: 'en', home: true,
    original: 'I recently had a power of attorney prepared and I couldn’t be happier with the experience. Liudmyla Petruk is a true professional — everything was handled clearly, efficiently, and with great attention to detail. What really stood out to me is how much care and dedication she puts into her work.',
    tr: {
      uk: 'Нещодавно я оформлювала довіреність і не могла б бути задоволенішою. Людмила Петрук — справжній професіонал: усе було зроблено чітко, ефективно й з великою увагою до деталей. Найбільше мене вразило, скільки турботи й відданості вона вкладає у свою роботу.',
      ru: 'Недавно я оформляла доверенность и не могла бы быть довольнее. Людмила Петрук — настоящий профессионал: всё было сделано чётко, эффективно и с большим вниманием к деталям. Больше всего меня поразило, сколько заботы и самоотдачи она вкладывает в свою работу.',
    },
  },
  {
    id: 'slavic-assistance-center', name: 'Slavic Assistance Center', lang: 'en', excerpt: true,
    original: 'I highly recommend Liudmyla Petruk as a Notary Public. The team of the Slavic Center have had the pleasure of working with her on several occasions. She is professional, thorough, and always friendly, making even complex paperwork easy',
    tr: {
      uk: 'Щиро рекомендую Людмилу Петрук як Notary Public. Команда Slavic Center мала задоволення працювати з нею кілька разів. Вона професійна, ретельна й завжди привітна, тож навіть складні документи стають простими',
      ru: 'Настоятельно рекомендую Людмилу Петрук как Notary Public. Команда Slavic Center имела удовольствие работать с ней несколько раз. Она профессиональна, тщательна и всегда приветлива, так что даже сложные документы становятся простыми',
    },
  },
  {
    id: 'denys-chernyi', name: 'Denys Chernyi', lang: 'en',
    original: 'Real service - the way it should be!',
    tr: { uk: 'Справжній сервіс — саме такий, яким він має бути!', ru: 'Настоящий сервис — именно такой, каким он должен быть!' },
  },
  {
    id: 'valeriia-fulitka', name: 'Valeriia Fulitka', lang: 'en', excerpt: true,
    original: 'I would like to express my sincere gratitude to Lyudmila for her excellent and professional service! I contacted her to prepare a notarized power of attorney, and everything was completed quickly, efficiently, and on time.',
    tr: {
      uk: 'Хочу висловити щиру вдячність Людмилі за чудовий і професійний сервіс! Я звернулася до неї, щоб оформити нотаріально засвідчену довіреність, і все було зроблено швидко, ефективно й вчасно.',
      ru: 'Хочу выразить искреннюю благодарность Людмиле за отличный и профессиональный сервис! Я обратилась к ней, чтобы оформить нотариально заверенную доверенность, и всё было сделано быстро, эффективно и вовремя.',
    },
  },
  { id: 'vadyk-kushch', name: 'Вадик Кущ', lang: 'uk', googleEn: 'Excellent service and professional approach! The notary is attentive to details, explains everything clearly, and works quickly and clearly. Very satisfied with the service — I recommend it!' },
  { id: 'danny-stalmakov', name: 'Danny Stalmakov', lang: 'uk', googleEn: 'I used Lyudmila’s services and honestly was blown away by her work. Everything was super clear, well organized, and under control the whole time. She’s a true professional and you can tell she really cares about what she does. Highly recommend to everyone without a second thought 👍' },
  { id: 'roman-bur', name: 'Roman Bur', lang: 'uk', excerpt: true, googleEn: 'The notary arrived on time, was very professional, and handled everything quickly. Highly recommended!' },
  { id: 'kateryna', name: 'Катерина', lang: 'uk', googleEn: 'Thank you for the quality of service. The notary provided detailed advice on all issues. Everything was done correctly. I recommend it.' },
  { id: 'natalia-portnova', name: 'Наталья Портнова', lang: 'ru', googleEn: 'Notary Lyudmila Petruk’s high level of professionalism allowed me to resolve my issue in a very short time. Communication, review, and document preparation were easy and stress-free. Lyudmila’s many years of practice and experience enabled her to complete the task efficiently. My choice of notary was the right one and a success.' },
  { id: 'anna-gaftk', name: 'Anna Gaftk', lang: 'uk', googleEn: 'Very fast, high quality, professional! Also pleasant communication, everything is businesslike. We will contact you again. We recommend!' },
  { id: 'solomiia-srednia', name: 'Solomiia Srednia', lang: 'uk', googleEn: 'The person is a professional in his field. Nice and very smart. I recommend 👌' },
  { id: 'igor-gedert', name: 'Igor Gedert', lang: 'ru', googleEn: 'Many thanks for the timely and professional services...' },
  { id: 'nastya-p', name: 'Nastya P', lang: 'ru', googleEn: 'Lyudmila’s service is amazing!!! I highly recommend her.' },
  { id: 'angelina-pri', name: 'Angelina PRI', lang: 'uk', googleEn: 'Responsible, punctual, knows her job.' },
  { id: 'alex-zhukov', name: 'Alex Zhukov', lang: 'uk', googleEn: 'You will never get this level of service from American notaries!' },
];

/** What a review shows on a page in `locale`: the text, an optional label and the verbatim original (if different). */
export function reviewView(r: Review, locale: Locale) {
  if (r.original && r.lang === locale) return { text: r.original, label: null as null | { key: 'from'; lang: Locale } | { key: 'google' }, original: null as string | null };
  if (r.original) return { text: r.tr?.[locale] ?? r.original, label: r.tr?.[locale] ? { key: 'from' as const, lang: r.lang } : null, original: r.tr?.[locale] ? r.original : null };
  return { text: r.googleEn ?? '', label: { key: 'google' as const }, original: null };
}
