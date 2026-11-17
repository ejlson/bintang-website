# Bintang — Website Design Plan & Design System

*London's oldest Filipino restaurant. Camden Town, since 1987.*

---

## 1. Direction

**Concept: "The family album, kept warm."**
The site is quiet so that the food, the garden and the photos stand out. Paper-coloured pages, dark ink type, and one red: the red of the tiger logo. The two videos carry the colour. The hero shows golden-hour bunting, string lights and shared trays. The about film shows family photos from 1987 laid over the room today. The layout steps back and lets that footage do the work.

**Principles**
1. **One colour does the shouting.** Red appears only on the logo, primary buttons and active states. Everything else is ink on paper.
2. **Photography is the colour palette.** No decorative gradients, tints or illustrations competing with the footage.
3. **Editorial, not template.** Large display type, generous whitespace, asymmetric image placement, the feel of a menu card or a printed zine.
4. **Heritage without nostalgia kitsch.** "Est. 1987" and the tiger stamp are used sparingly, as marks of authenticity, not decoration.
5. **Booking is never more than one tap away.** A persistent "Book a table" button on every page.

---

## 2. Source assets (audited)

| Asset | Spec | Use |
|---|---|---|
| `bintang-hero.mp4` | 1920×1080, 24fps, 39.8s, 9 MB, H.264, no audio | Home hero (full bleed) |
| `aboutbig.mov` | 1080×1920 (portrait), 25fps, 12.3s, 13 MB, has audio | About page story section |
| `bintang.png` | Red script wordmark + tiger, transparent | Primary logo |
| `brandpack2026.svg` | Palette, Aquavit Black + Redaction 10, tiger head / full body / stamp frames | Source of tokens below |

**Asset notes to fix before build**
- The **hero video ends with a red script logo animating over the last few seconds**. For a seamless loop, trim before that point (roughly the last 6–8s) and put the logo in the page header instead of baking it into the video.
- Video needs re-encoding for web (see §8). 9 MB is too heavy for a hero, especially on mobile.
- The brand pack text reads **"A TASTE OF THE PHILIPINES."** It should be *Philippines*. Correct it before it ends up on the site.
- We need the logo as **SVG** (red, ink and paper versions) and the tiger head/stamp exported as standalone SVGs. The PNG is not enough for a crisp header over video.

---

## 3. Design system

### 3.1 Colour

Three working colours plus one tint. The brand pack's orange, yellow, green and pink are **not used in the UI**. They already appear in the bunting in the footage, and repeating them in the interface would make it busy.

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#EDE9E9` | Default page background (brand "secondary") |
| `--paper-raised` | `#F6F4F3` | Cards, form fields, menu panels (tint of paper) |
| `--ink` | `#2D2D2D` | All text, rules, icons, dark sections, footer |
| `--red` | `#D92E36` | Logo, primary CTA, links on hover, active nav, focus ring |

Derived (opacity of ink, not new colours):
- `--ink-muted`: ink at 68% (secondary text, captions)
- `--rule`: ink at 14% (hairline dividers)
- `--scrim`: ink 0% → 55% vertical gradient (text legibility over video)

**Inverse sections** (footer, karaoke panel, video-led sections): `--ink` background, `--paper` text, red unchanged.

**Contrast check**
- Ink on paper: about 11:1 ✅ AAA
- Red on paper: about 4.1:1. Large text (≥24px) and buttons only; never body copy.
- Paper on red (button label): about 4.4:1. Use 16px semibold or larger, and treat buttons as large/bold UI text.
- Paper on ink: about 11:1 ✅

### 3.2 Typography

Two families, both from the brand pack.

| Role | Family | Notes |
|---|---|---|
| Display | **Aquavit Black** (800) | Headlines, section titles, nav, labels. Always uppercase, tight tracking. |
| Text | **Redaction 10** (Regular / Italic / Bold) | Body, menu descriptions, blog, captions. Its slightly worn letterforms suit "since 1987". |

> **Licensing:** Aquavit is a commercial typeface, so confirm a *web* licence is held. Redaction is free/open-source. Fallbacks: display → `"Arial Black", system-ui, sans-serif`; text → `Georgia, serif`.

**Type scale** (fluid, `clamp()`; 1.25 minor-third ratio at mobile → 1.333 at desktop)

| Token | Mobile → Desktop | Family | Use |
|---|---|---|---|
| `--fs-hero` | 48 → 120px | Aquavit, lh 0.9, tracking −0.02em | Hero line |
| `--fs-h1` | 40 → 80px | Aquavit, lh 0.95 | Page titles |
| `--fs-h2` | 30 → 48px | Aquavit, lh 1.0 | Section titles |
| `--fs-h3` | 22 → 28px | Redaction Bold, lh 1.2 | Dish names, card titles |
| `--fs-body-lg` | 19 → 22px | Redaction, lh 1.5 | Intro paragraphs |
| `--fs-body` | 17 → 18px | Redaction, lh 1.6 | Body (max 68ch) |
| `--fs-label` | 12 → 13px | Aquavit, tracking +0.12em, uppercase | Eyebrows, nav, buttons, prices |
| `--fs-small` | 14 → 15px | Redaction, lh 1.5 | Captions, legal |

**Rules**
- Eyebrow + title pattern: `EST. 1987` (label, red) above a section title (ink).
- Menu prices are set in the label style, right-aligned and joined to the dish name by a dotted leader.
- Never set Aquavit below 12px or in sentence case.

### 3.3 Spacing & layout

- **Base unit:** 8px. Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192`.
- **Section rhythm:** 96px mobile / 160px desktop between major sections. Whitespace separates sections rather than boxes or borders.
- **Grid:** 12 columns, 24px gutter (16px mobile), max width 1440px, side margin `clamp(16px, 5vw, 80px)`.
- **Reading width:** 680px max for prose (About, blog posts).
- **Breakpoints:** 640 / 960 / 1280.
- **Radius:** `0`. Square corners throughout, like printed matter. The one exception is the circular tiger stamp.
- **Rules:** 1px `--rule` hairlines, used for menu lists and the footer only.
- **Shadows:** none.

### 3.4 Iconography & marks

- **Logo:** red script wordmark + tiger. On video and ink backgrounds use the paper version; never red on video.
- **Tiger stamp:** used as favicon, footer sign-off and the blog "end of post" mark. Nowhere else.
- **Tiger head:** 404 page and empty states only.
- **UI icons:** minimal line icons (1.5px stroke, ink): arrow, plus/minus, play/pause, sound, close, map pin, phone. Lucide fits.

### 3.5 Motion

Calm and filmic, matching the footage.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint). Durations 200ms for UI, 600–900ms for reveals.
- **Hero:** headline lines rise 24px and fade in, staggered 80ms, after the first video frame paints.
- **Scroll reveals:** images fade in with a slight scale from 1.04 → 1. Text fades up 16px. Each element animates once only.
- **Header:** transparent over the hero, becomes paper with an ink logo after 80vh of scroll (200ms crossfade).
- **Image hovers:** slow 1.03 zoom (900ms) in the gallery and blog cards.
- **`prefers-reduced-motion`:** no reveals. Hero video replaced by its poster frame. About film shows its poster with a play button.

### 3.6 Components

| Component | Spec |
|---|---|
| **Button — primary** | Red fill, paper label (Aquavit label style), 52px tall, 28px horizontal padding, square. Hover: ink fill. |
| **Button — secondary** | 1.5px ink outline, ink label. Hover: ink fill, paper label. On video/ink: paper outline. |
| **Text link** | Redaction, ink, 1px underline offset 4px. Hover: red. |
| **Header** | Logo left, nav centre/right (label style), "Book a table" primary button. Mobile: logo + book button + "Menu" toggle opening a full-screen ink overlay with large Aquavit links. |
| **Sticky book bar (mobile)** | After the hero, a slim bottom bar: `Book a table` · `Call`. |
| **Eyebrow** | Label style, red, e.g. `SINCE 1987`, `KARAOKE`. |
| **Menu item** | Name (Redaction Bold) · dotted leader · price (label). Description below in muted text. Optional dietary tags `VG` `V` `GF` `SPICY` as small outlined labels. |
| **Card (blog/feature)** | Image (4:5 or 3:2), eyebrow (date/category), title (h3), no box or border. |
| **Form field** | Paper-raised fill, 1px rule border, 0 radius, 52px tall. Label above in label style. Focus: 2px red outline. Error: red text below and red border. |
| **Segmented tabs** | For enquiry type and menu sections. Label style, active = ink underline 2px plus ink text. Horizontally scrollable on mobile. |
| **Info block** | Address / hours / contact. Label headings, Redaction body, used on Home, Contact and in the footer. |
| **Lightbox** | Ink at 96% background, image centred, arrow and swipe navigation, caption below. |

---

## 4. Sitemap

```
Home
About
Menu            (Dinner · Brunch · Drinks · Set menus for groups)
Blog            (index → post)
Gallery
Contact         (Reservations · Large groups · Karaoke · Private hire)
— footer: Privacy, Shop (existing), Instagram
```

Global nav: **About · Menu · Gallery · Blog · Contact**, plus the **Book a table** button, which goes to Contact with the Reservations tab selected.

The old site's separate pages for Reservations, Large Groups, Karaoke and Private Hires become **one Contact page with four tabs**. Each tab gets its own URL (`/contact/karaoke` etc.) so existing links and SEO carry over. Set up 301 redirects from the old URLs.

---

## 5. Page plans

### Home
1. **Hero (full bleed video, 100svh).** Trimmed loop of `bintang-hero`, muted, autoplay, playsinline. A bottom scrim carries:
   eyebrow `CAMDEN TOWN · SINCE 1987` → hero line **"FILIPINO HOME COOKING, MADE FOR SHARING."** → buttons `Book a table` (primary) and `See the menu` (secondary, paper outline).
   A small pause/play control at bottom-right (accessibility requirement for autoplay video).
2. **Intro.** One large paragraph (body-lg, max 680px): *London's oldest Filipino restaurant. Same address, same kitchen, same recipes for nearly forty years.* Link: "Our story →".
3. **Signature dishes.** 3 dishes (Kare-kare, Adobo, plus one more) as an asymmetric image row. Dish name and one-line description. "Full menu →".
4. **The garden / the room.** Full-width still image (from the hero footage or a shoot) with an overlaid label: `THE GARDEN IS OPEN`.
5. **Gather here.** Three equal columns linking to Contact tabs: **Large groups**, **Karaoke**, **Private hire**. Each has an image, title and one line.
6. **From the journal.** Latest 3 blog posts.
7. **Visit.** Split layout: address, transport, hours on the left; static map (ink-tinted, red pin) on the right.
8. **Footer** (ink): tiger stamp, info block, nav, Instagram, newsletter (optional), legal.

### About
1. Page title **"SINCE 1987"** with a short intro.
2. **Story film.** `aboutbig` is portrait, so place it in a sticky 9:16 frame on the left (desktop). The story text scrolls past on the right in 3–4 short chapters (1987 opening → the family → the kitchen → today). Mobile: the film sits inline, full width. It is muted by default with a sound toggle, since it has an audio track.
3. **The family archive.** A loose grid of the old photographs (we need high-res scans), slightly overlapped like prints on a table, each captioned with a year.
4. **The food.** Short philosophy paragraph plus 2 images.
5. CTA band: `Come and eat with us` → Book a table.

### Menu
1. Title **MENU** with a note on sharing (*"Two or three dishes between two, plus rice"*).
2. Sticky segmented tabs: **Dinner · Brunch · Drinks · Group set menus**.
3. Within each tab: category headings (Small plates, Mains, Rice & noodles, Sides, Desserts) with a two-column list on desktop and one column on mobile.
4. Dietary key at the top. "Download PDF" secondary button.
5. Sparse imagery: one image per category, placed in the margin on desktop.
6. Content is managed in the CMS so prices are easy to update.

### Blog
- **Index:** featured latest post (large, 2-column), then a 3-column grid. Category filter tabs (News, Recipes, Events, Stories).
- **Post:** full-width cover image, title, date/author eyebrow, 680px prose column, pull quotes in Aquavit, inline full-bleed images, tiger stamp sign-off, then "More from the journal" (2 posts).

### Gallery
- Title plus filter tabs: **All · Food · Garden · Karaoke · Events · Archive**.
- Masonry grid (CSS columns), 2 columns mobile, 3 tablet, 4 desktop, 8px gaps, no captions on the grid.
- Click opens the lightbox with caption.
- Optional: a short silent clip tile (garden at dusk) mixed into the grid.

### Contact (Reservations · Large groups · Karaoke · Private hire)
1. Title **"BOOK & ENQUIRE"**, with the info block alongside (phone, email, address, hours).
2. **Segmented tabs**, each with a URL:
   - **Reservations:** embed of the booking system already in use (to be confirmed: OpenTable, ResDiary, SevenRooms, etc.), styled to match where the widget allows. Note: *Groups of 8+ please use Large groups.*
   - **Large groups:** short intro (the back tables, set menus, deposits) plus a form: name, email, phone, date, time, party size, occasion, dietary notes, message.
   - **Karaoke:** intro set on an ink panel (the one "night mode" moment on the site) with what's included, room capacity, pricing/minimum spend, then the same form with a "Karaoke hours" select.
   - **Private hire:** intro (garden / whole restaurant / partial buyout, capacities) plus a form with an additional "Space" select and budget range.
3. All forms share one component with conditional fields. They send to the restaurant inbox, send an auto-reply to the guest, and show an inline success state ("Salamat! We'll reply within 48 hours.").
4. Map and transport below.

---

## 6. Content & voice

- Warm, plain, a little proud. Short sentences. Talk like the host at the door.
- Tagalog used lightly and naturally: *Kain tayo* ("let's eat"), *Salamat* (thank you), *Mabuhay*. Never as decoration.
- Facts to keep consistent: **93 Kentish Town Road, London NW1 8NY · 020 7267 2197 · bintangnw1@gmail.com**
- Hours: Mon closed · Tue–Thu 5–9:30pm · Fri–Sat 11am–10pm · Sun 11am–6pm · Brunch Sat 11–3, Sun all day.

---

## 7. Accessibility

- WCAG 2.2 AA throughout. Red is never used for body text.
- Hero video: `muted`, a visible pause control, decorative (`aria-hidden`), with the H1 as real text. Poster image for reduced motion and data-saver users.
- About film: captions file (`.vtt`) if any speech is present, plus a sound toggle with a clear label.
- Visible focus rings (2px red, 2px offset). Full keyboard support for tabs, lightbox and mobile nav.
- Forms: real `<label>`s, error messages linked by `aria-describedby`, no placeholder-only fields.
- All gallery and blog images get alt text from the CMS (required field).

---

## 8. Performance & media pipeline

| Item | Target |
|---|---|
| Hero video | Trim to a clean loop of about 20–30s. Encode **AV1/WebM + H.264 MP4**, 1080p at about 2.5 MB and a 720p mobile version at about 1.2 MB, no audio track. Use `preload="metadata"` and a `<source media>` swap for mobile. |
| Hero poster | AVIF/WebP still of the first frame, about 80 KB, shown instantly (LCP element). |
| About film | Same dual encode, portrait 720×1280, lazy-loaded when scrolled into view. |
| Images | AVIF → WebP → JPEG via responsive `srcset`, lazy below the fold. |
| Fonts | Self-hosted WOFF2, subset Latin, `font-display: swap`, preload Aquavit + Redaction Regular only. |
| Budget | LCP < 2.5s on 4G, CLS < 0.05, JS < 60 KB on non-gallery pages. |

---

## 9. Recommended build stack

- **Astro** (static, fast, minimal JS) with small islands for tabs, lightbox and the mobile nav.
- **CMS:** Sanity or Decap for **Menu, Blog, Gallery, Hours**, so staff can update prices and posts without a developer.
- **Forms:** serverless function (Netlify/Vercel) → email via Resend/Postmark, with spam protection (honeypot + Turnstile).
- **Hosting:** Netlify or Vercel with image CDN. Set up 301 redirects from the old URLs.
- **Tokens:** a single `tokens.css` holding the variables in §3.

```css
:root {
  --paper: #EDE9E9;  --paper-raised: #F6F4F3;
  --ink: #2D2D2D;    --red: #D92E36;
  --ink-muted: rgb(45 45 45 / .68);  --rule: rgb(45 45 45 / .14);
  --font-display: "Aquavit", "Arial Black", system-ui, sans-serif;
  --font-text: "Redaction 10", Georgia, serif;
  --ease: cubic-bezier(.22, 1, .36, 1);
  --radius: 0;
}
```

---

## 10. Open questions before we build

1. **Booking system:** which provider does Bintang use today (if any)? This decides whether Reservations is an embed or a form.
2. **Aquavit web licence:** is one held?
3. **Logo files:** can we get the wordmark and tiger as SVG (plus white/ink versions)?
4. **Photography:** high-res food, interior, karaoke and archive photos, or should a shoot be planned? The current assets are the two videos only.
5. **Menu content:** current menu (PDF or text) with prices and dietary info.
6. **Karaoke & private hire details:** capacities, minimum spends, hours, deposit policy.
7. **Blog:** migrate existing posts, or start fresh?
8. **Shop:** keep the existing shop link as external, or bring it into scope?
9. **Instagram handle** and any other socials.

---

## 11. Build order

1. Tokens, fonts, base layout, header/footer
2. Home (hero video pipeline first)
3. Contact (tabs + forms + booking embed)
4. Menu (CMS-driven)
5. About (story film section)
6. Gallery, Blog
7. Redirects, SEO (restaurant schema.org markup with opening hours), accessibility and performance pass
