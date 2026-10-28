# Creative Personal Brand: Experiments A–C

Design exploration only. Three experimental **homepages**; no Angular, no deployment, no commit. Existing concepts were not modified.

> **Note:** the brief arrived truncated at "9. Typo…", so sections 9 and later were not received. I assumed the rules of earlier rounds:
> - Typography from the verified Cyrillic shortlist.
> - Responsive layouts at 1440, 768, 390 and 320 px.
> - Screenshots and a report.
> - No Angular, deploy or commit.
>
> Please resend the rest if it adds requirements.

**Open:** `design-exploration/index.html` (the Experiments section is at the top), or each folder directly:

| Experiment | Path |
|---|---|
| A · Portrait Beyond the Frame | `design-exploration/experiment-a-portrait/index.html` |
| B · Signature Identity | `design-exploration/experiment-b-signature/index.html` |
| C · Modern Personal Studio | `design-exploration/experiment-c-studio/index.html` |

Sources:
- Generator: `design-exploration/_build/exp.mjs` (run `node design-exploration/_build/exp.mjs`).
- Shared motion: `design-exploration/assets/js/proto4.js`.
- Validator: `design-exploration/_build/validate4.mjs`.

## 1. New photography

The root holds a single new file, `Elegant Businesswoman at Laptop.png`. It is not a folder.
- **Format:** 1089×1445 RGBA, with a **transparent background**: 35% of pixels are fully transparent and the subject is cut out cleanly.
- **Subject:** clearly Liudmyla, the same person as the earlier office portrait. She is seated at a desk, chin on hand, with a laptop, a phone and a pen cup.
- **Quality:** the edges are clean on light and navy grounds, with no halo in the hair.
- **Limitation:** the desk and laptop are cut off straight at the image edges. Experiment A softens the left edge with a CSS mask (not a visible gradient). In B, the bottom of the portrait fades out.

The new portrait is used in place of the old office photo everywhere. Web variants (new files only, never upscaled) are in `design-exploration/assets/images/`:

| File | Size | Weight | Use |
|---|---|---|---|
| `liudmyla-cutout-desk.webp` | 1089×1364 | 207 KB | full figure with desk |
| `liudmyla-cutout-bust.webp` | 800×838 | 123 KB | head to forearms |
| `liudmyla-cutout-head.webp` | 480×584 | 58 KB | head and shoulders |

All three keep the alpha channel. Nothing was generated or altered with AI, and no credentials were drawn.

**Fonts:** self-hosted in `design-exploration/assets/fonts/`.
- Families: Literata, Inter, Cormorant Garamond, Manrope and Onest (SIL OFL), as variable WOFF2.
- Subsets: latin, latin-ext, cyrillic and cyrillic-ext, each served only when needed (`unicode-range`).
- 644 KB on disk in total. Each page preloads only its two Latin files.

## 2. The three experiments

### A · Portrait Beyond the Frame
- **Composition:**
  - Literata + Inter on ivory, navy and gold.
  - Her cutout rises out of an **open navy block** that runs off the right edge of the page. Her head and shoulders break above it, and the desk spills left beyond it.
  - Behind her, the word **"Petruk"** is set huge in pale serif. It is decorative (`aria-hidden`) and her head partly covers it, so the type and the photo interlock.
  - A thin gold L-corner, deliberately open, and a credential plate sit where the block meets the page.
- **Sections:**
  - "Two kinds of help, one professional": an editorial 7/5 split, with Notary primary and Document Assistance marked as an internal draft.
  - "Your place, or hers."
  - A credentials ledger with the head cutout.
  - The county city lists set in serif, next to the schematic map.
  - Fees, with a large $15.
  - "Meet Liudmyla".
  - A navy closing section.
- **Motion:**
  - The headline lines rise in.
  - The portrait rises and fades in.
  - Underlines slide in on nav hover.
  - The gold indicator on the language switch slides.
  - Section blocks reveal in sequence.
- **Strongest:** the most "designed for her". The portrait feels part of the page, not pasted on. Calm and credible.
- **Weaker:** the three-line serif headline is long on phones, and the faint wordmark has to stay pale so it never competes.

### B · Signature Identity
- **Composition:**
  - Cormorant Garamond + Manrope on paper white, with navy and gold.
  - A **fine gold line** (abstract and quill-like, not a signature) draws itself around the portrait, then reappears as a wave between sections. It works as a thread that guides the eye down the page.
  - The sections are separated by a hand-drawn vertical stroke between "At your door" and "At her desk" and an underline flourish under her name, and the page ends with a closing stroke under the phone number.
  - The commission number is set very large in serif.
- **Services:** a quiet two-way switch (Notary Public / Document assistance) with a sliding gold underline and a crossfade.
  - The choice is saved in the URL (`?service=l`), so it can be shared.
  - It uses real buttons with `aria-pressed`.
  - Without JavaScript, both panels simply show.
- **Motion:** SVG lines draw in (stroke-dashoffset) as they scroll into view; the switch transition; the portrait entrance.
- **Strongest:** the most memorable brand device, and the most elegant typography. The line motif can carry into print, social media and email.
- **Weaker:**
  - The serif style is more delicate, so body text needs Manrope's support.
  - The line motif must stay sparse, or it becomes decoration.
  - The footer states that the line is decorative and is not a signature or an official mark.

### C · Modern Personal Studio
- **Composition:**
  - Manrope + Onest, using **navy and champagne sand** as the two brand fields.
  - A split hero: a bold three-line headline ("The notary who comes to you.") on white, beside a full-height sand field. Her cutout stands on the bottom edge of the field, and a navy credential tag crosses the boundary.
  - A navy strip lists the facts (mobile, in person, three languages).
- **Sections:**
  - The services are two full-width **colour bands**: navy for Notary, sand for Document Assistance (draft). Each is an open list of rows with no cards; rows slide on hover.
  - Giant words, "Mobile" and "In person".
  - "Credentials and fees, in numbers": 2538244 · 2029 · $15 · 3.
  - City lists in bold sans.
  - A fee table, an about panel, and a navy closing section with a large phone number.
- **Motion:** a navy **curtain** lifts off the portrait (transform only), the headline lines rise, the menu links shift on hover, and the LP mark rotates.
- **Strongest:** the most contemporary and confident. The clearest separation of the two branches. It scales well to future services.
- **Weaker:** the boldest look, which may feel less "gentle" for older clients. The headline is long at 390 px. It has the most colour, so photography must stay consistent.

### Comparison

| | A Portrait | B Signature | C Studio |
|---|---|---|---|
| Brand distinctiveness | High | Highest (ownable motif) | High |
| Warmth / approachability | High | High | Medium-high |
| Professional credibility | Highest | High | High |
| Branch clarity | Good (7/5 split) | Good (switch; one branch visible at a time) | **Best** (two colour bands) |
| Scales to more services | Medium | Medium | **Best** |
| Mobile | Very good | Good | Very good |
| Implementation effort (Angular) | Low–medium | Medium (SVG draw component) | Medium |

**Suggested combination** (the decision is yours and the owner's): **A's hero composition with C's branch bands and numbers section, plus B's line motif used sparingly**, once in the hero and as section dividers. The "tombstone" arch has been dropped completely. None of the experiments uses a closed arch, capsule or monument shape.

## 3. Business and compliance (unchanged rules)

- **Notary:**
  - California Notary Public, Commission No. 2538244, expires November 6, 2029.
  - Mobile and in-person appointments.
  - Up to $15 per signature (acknowledgment) or per person (jurat); travel and weekend fees are quoted and agreed in advance.
- **Document Assistance (LDA):**
  - Shown in full for internal review, always labelled "Internal draft".
  - Registration No. 2026-004 appears only with "owner-provided · expiration not yet confirmed · not for publication until verified".
  - Never described as mobile; by appointment only; quote in a written contract; separate from notary fees.
  - "Not legal advice" is stated every time.
- **No fabrications:** no testimonials, invented prices, office addresses, seals or certificates. The line motif is labelled decorative.
- Every page carries `noindex, nofollow` and a "Design experiment · not for publication" bar.

## 4. Motion rules applied

- **Techniques:** CSS transitions and the Web Animations API only, with no libraries.
  - Transform and opacity everywhere.
  - The only exception is the SVG stroke-dashoffset in B's line drawing, which is cheap paint on small paths.
- **Content is always reachable:**
  - Every element is visible without JavaScript.
  - Hero Call buttons are never hidden or delayed.
  - After the animations finish, no text is left hidden. This was checked automatically on all three pages, and C's curtain was confirmed fully retracted.
- **Not used:** scroll hijacking, parallax, custom cursors and autoplay video.
- **Reduced motion:** `prefers-reduced-motion` disables all movement, and the JavaScript exits before running any animation.

## 5. Validation

- **Automated (headless Chrome, `screenshots/validation-experiments.json`):**
  - No horizontal overflow at 320 px.
  - One H1 per page and no skipped heading levels.
  - No broken links, images or fonts, and no missing alt text.
  - Menus open, contain eight links and close with Escape.
  - No fixed elements cover content on mobile.
  - B's switch changes panel and updates the URL.
- **Vercel `web-design-guidelines`** (rules fetched fresh from `vercel-labs/web-interface-guidelines`). Fixes applied:
  - Width and background-size animations replaced with transforms (language indicator, B's nav underline).
  - Critical fonts preloaded.
  - `theme-color` added.
  - `touch-action: manipulation` and an intentional tap highlight.
  - `overscroll-behavior: contain` on the open menu.
  - Tabular figures for numbers.
  - Curly quotes and non-breaking spaces in times.
  - `translate="no"` on her name.
  - B's switch state saved in the URL.
  - Safe-area padding in the header.

  Deliberately not applied: Title Case headings. Sentence case is our system choice and suits Cyrillic.
- **Contrast fix:** C's large gold "In person" failed (about 2.9:1), so it was darkened to `#8A6A33`.
- **Taste-skill inspector (`design-research/inspect/xa|xb|xc`):** the remaining flags are deliberate, as are the content-reveal warnings.

  | Flag | Why it stays |
  |---|---|
  | Three-line stacked headlines | An editorial choice |
  | Small labels above branch headings | They mark branch and draft status |
  | Separator lines | Used in lists and fee tables |
  | "Few pictures" | Only one genuine photo source exists |
  | A's "covered text" | The decorative wordmark sits behind her by design |

**Screenshots (`design-exploration/screenshots/experiment-*/`):**
- 1440 fold and full page.
- 768 fold and full page.
- 390 fold and full page.
- Mobile menu open.
- Desktop after motion has settled.

**Not done:** a Lighthouse run, screen-reader testing, and Safari/iOS rendering.

## 6. Experiment A2 · Signature Scroll (after owner feedback)

**Feedback received:**
- A's first screen is liked; the "Two kinds of help" screen is good.
- Below that, the oversized prices, numbers and names looked wrong.
- Keep A and add a smooth animation driven by scrolling, from B's signature-line idea.
- C is dropped.

**Open:** `design-exploration/experiment-a2-signature-scroll/index.html`. Experiment A itself is unchanged.

### What changed
- **Kept:** A's hero (portrait beyond the navy block, "Petruk" wordmark, credential plate) and the two-branch section, both unchanged.
- **Calmer type below the fold** (`_build/a2.css`):
  - The large "$15" block is removed. The notarial fee is now the first ordinary row of the fee list, with the same wording as before.
  - Section headings, the credentials ledger, the "Meet Liudmyla" lead, the closing heading and the phone number are all set at modest sizes.
  - The footer name is no longer a giant word. It is a normal serif name with "Notary Public · Citrus Heights" beneath.
- **Scroll-drawn signature line:**
  - One fine gold stroke runs from below the hero to the closing section, with a small gold "nib" at the drawing tip.
  - **Path:** built at runtime from the page's own sections (`assets/js/proto4.js`, `[data-sigline]`). It stays in the side margin beside each section and swoops across the page only in the empty band between one section's last content and the next section's first content, so it never runs over text. It alternates sides, much like a pen moving across a page.
  - **Handwriting in the crossings** (second iteration, after owner feedback that a plain line was too simple):
    - On left-to-right crossings the pen writes **"Liudmyla"**, **"Petruk"** and the **"Lp" monogram**. The last crossing, just before the contact section, writes the **phone number**.
    - Right-to-left crossings get a small cursive loop instead. Writing only happens left to right, so the line never strikes through a word.
    - The script is **EMS Allure** (SIL OFL, a single-stroke derivative of Allura), so each letter is drawn as one pen line. `_build/sig-glyphs.mjs` converts `assets/fonts/EMSAllure.svg` into smoothed paths in `assets/js/sig-glyphs.js` (about 17 KB).
    - Words are scaled to fit the empty band and the width between the margins, and never extend onto the beige or navy sections. The written phone number is decorative; the real `tel:` links are unchanged.
  - **Scroll:** scrolling only changes how much of the path is drawn (`stroke-dashoffset`, via rAF and a passive scroll listener). The page scrolls natively: no hijacking, no pinning, no parallax.
  - **Pen tip stays on screen:** progress is no longer a share of the page height. It is mapped piece by piece to section positions, and each crossing is spread over about a third of the screen's scroll. The tip stays roughly between 55% and 95% of the viewport height, so it no longer runs ahead off the screen.
  - **Rebuild:** the path is rebuilt after fonts load and on resize, so it follows the real layout at every width. The margin is 9 px on phones.
  - **Reduced motion:** `prefers-reduced-motion` shows the full line, static, with no nib.
  - **Accessibility:** decorative and `aria-hidden`. It is not a signature or an official mark.

### Validation (`_build/validate4b.mjs`, `screenshots/validation-experiment-a2.json`)
- No text left hidden after motion; the Call CTA is never hidden.
- No overflow at 320 px; no broken links or assets; the menu opens and closes.
- Full-page screenshots were checked at 1440 and 390: the line never crosses text, the credential plate or the contact details.
- Scroll frames: `screenshots/experiment-a2-signature-scroll/scroll-18|40|62|85.jpg`.

**Not done:** Safari/iOS check of scroll smoothness, Lighthouse.

## 7. Experiment A3 · A2 + reviews, FAQ chat, booking, footer, reviews page

**Feedback:** A2 is approved and must stay exactly as it is. The second round of requests:
- a FAQ as a chat with Liudmyla;
- a three-step booking form with transitions;
- a footer with the ReIskra credit;
- 8 reviews in one row with arrows;
- a separate reviews page with all reviews, names standardised to English.

**Open:** `design-exploration/experiment-a3-complete/index.html` and `reviews.html`. A2 itself is left untouched as the approved reference.

- **How it is built:** `_build/a3.mjs` builds A3 from the built A2 page.
  - The review data lives in `_build/reviews.mjs`.
  - The new styles are only in `_build/a3.css`; the interactions are in `assets/js/proto4.js` (`data-carousel`, `data-chat`, `data-steps`).
  - Nav gains a "Reviews" link, and the hero's "Request an appointment" points to the form.
- **Reviews (data):** 26 Google reviews were collected (5.0 average); 23 with comments are kept.
  - Removed:
    - Volodymyr Khymych, the developer of this site, credited in the footer (conflict of interest);
    - two ratings without text (Oleksandr Petruk, Inna Babikova).
  - **Names:** Cyrillic names transliterated (Vadyk Kushch, Kateryna, Natalia Portnova); "Nastya P" and "Angelina PRI" standardised to "Nastya P." and "Angelina P.".
  - **Text:** kept as written. Reviews in Ukrainian or Russian use Google's English translation and are labelled "translated from … by Google". Reviews that Google only showed in part are marked "excerpt" with "…".
  - The full texts of Sunny Day and Gina Averina come from the current production site.
- **Home carousel:** the 8 strongest original English reviews in one row.
  - Moving: native horizontal scroll with snap, arrow buttons (one card per click, disabled at the ends), a 01/08 counter, and the arrow keys when the row is focused.
  - Cards in view lift slightly and get a gold top rule (transform only).
  - Links: "All reviews", "Read on Google", "Leave a review".
- **Reviews page (`reviews.html`):**
  - Same header and footer as the home page.
  - "What clients say", 5.0 · 26 reviews, a note on translations, all 23 reviews in a three-column layout (two on tablet, one on phone), and a navy closing call to action.
- **FAQ chat:**
  - **Layout:** questions on the left; on the right a chat window with her photo and "general information, not legal advice".
  - **Behaviour:** a click adds your question as a bubble, shows a short typing indicator, then her answer slides in. On phones, the chat sits above the question chips.
  - **Answers:** in her voice, but only confirmed facts; the document-assistance answer is still marked Internal draft.
  - **Fallbacks:** without JavaScript, a plain Q&A list shows. With reduced motion, the answer appears at once.
- **Booking in three steps** (Service → Date & time → Your details):
  - A numbered step bar with a gold progress line, and Back / Continue buttons.
  - Each step is checked before moving on, and invalid fields are highlighted.
  - Steps slide sideways (transform/opacity); focus moves to the new step's heading.
  - The last step shows a summary, "Preview only: nothing was sent", and Start over.
  - Without JavaScript all three steps show as one form. **Needs a real endpoint before going live.**
- **Footer:**
  - Brand with the monogram; Explore, Contact (call, text, email, Google profile) and Hours columns.
  - The commission and legal notice; "© 2026 Liudmyla Petruk"; and **"Design & development: ReIskra · Volodymyr Khymych"**.
- **Signature line:** the new sections are stops too, and the line now rebuilds whenever the page height changes (form steps, chat), so it never crosses text after an interaction.
- **Validation** (`_build/validate4c.mjs`, headless Chrome, motion on):
  - Carousel: the next arrow scrolls one card, the counter reads 02, and the previous arrow re-enables.
  - Chat: question and answer bubbles appear.
  - Form: an empty step is blocked with a message; after filling it, step 2 shows; finishing shows the summary.
  - Page checks: no overflow at 320 px on either page; one H1 per page; no broken links. The one "dimmed" element is the disabled previous arrow.
  - A2 re-validated unchanged.
