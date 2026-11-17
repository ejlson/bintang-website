# SPEC — Bintang website, phase 1: Home page

Source of truth for the look: the Claude Design canvas "Bintang Website" (Home artboard, v2).
Broader direction: `DESIGN-PLAN.md` (§3 tokens) as revised by the v2 canvas (one colour per page, bilingual nav, karaoke subtitles).

## Scope

**In:** the Home page, built for real; shared layout (fonts, metadata); placeholder routes for every nav link; media pipeline for the hero.
**Out:** Journal, Gallery and Contact content (placeholders only; Menu was added in phase 1b and About in phase 1c, below); CMS; booking integration; forms; Baybayin lettering; sakuga effects anywhere except the Home subtitles.

## Decisions (from interview, 17 Nov 2026)

| Topic | Decision |
|---|---|
| Stack | **Next.js** (App Router, TypeScript), static output where possible |
| Unbuilt pages | **Placeholder routes** so no link breaks |
| Mobile nav | **Menu button + full-screen overlay**; lion head stays centred |

## Project layout

`web/` inside this folder (assets and design docs stay at the top level).

```
web/
  app/layout.tsx          Typekit kit pev2vne (Aquavit), metadata, JSON-LD
  app/page.tsx            Home
  app/menu/page.tsx       Menu (phase 1b) — components/MenuPage, KaraokeVideo; data in lib/menu.ts
  app/about/page.tsx      About (phase 1c) — components/AboutPage, AboutFilm; media in public/media/about/
  app/[...]/page.tsx      placeholders: /gallery /journal
                          /contact /contact/groups /contact/karaoke /contact/private-hire
  components/SiteHeader   bilingual split nav + centred lion head + mobile overlay
  components/Hero         video, warm overlay, pause control, thumbnail, reduced-motion poster
  components/Subtitles    videoke-style English/Tagalog lines with sakuga effects
  lib/karaoke.ts          subtitle timing (syllables → wipe schedule)
  lib/sakuga.ts           loads the vendored Sakuga VFX core (lib/vendor/sakuga-core.js, MIT)
  public/media, public/brand
```

## Home page — behaviour

1. **Full-screen hero (100svh, min 640px)**, with the site footer below it on ink. Background is `hero-loop.mp4` (trimmed 4.5–33.5s, 1920×1080 H.264 CRF 23 ~8.3 MB; portrait screens get a 608×1080 crop ~3.4 MB; no audio), autoplay, muted, loop, playsinline, with a poster. A warm overlay (soft dark fades at top (to 30%) and bottom (to 38%) over an 18% warm wash) sits over it.
2. **Header** (absolute, paper `#EDE9E9` text, 14px Helvetica, line-height 1.2):
   - Left: About/Tungkol, Menu/Mga Ulam, Gallery/Larawan, Journal/Balita.
   - Centre: lion head in the same paper colour as the links (52px tall), links to `/`, `aria-label="Bintang home"`.
   - Right (right-aligned): Book/Magpareserba → `/contact`, Groups/Grupo → `/contact/groups`, Karaoke/Kantahan → `/contact/karaoke`, Private hire/Pribado → `/contact/private-hire`.
   - English line on top; the Tagalog line underneath at 92% opacity (≥4.5:1 on every page colour). On hover, the English line is underlined.
   - **< 768px:** the left and right lists are hidden. The lion head stays centred, and a "Menu / Mga Pahina" button on the right opens a full-screen ink overlay with all 8 links set large (Aquavit). The overlay closes on Esc, on its close button and on any link click. While it's open, focus is trapped inside and the page behind doesn't scroll. The button carries `aria-expanded`.
3. **Karaoke subtitles** (Filipino videoke, animated in the Sakuga VFX style; prototype `preview/karaoke.html`), centred at the bottom: Aquavit 700, ink outline (text-shadow). English line `clamp(22px,2.8vw,42px)`, Tagalog line `clamp(20px,2.5vw,38px)`. Lines:
   Welcome to Bintang / Maligayang pagdating sa Bintang · ♪ Let's eat! ♪ / ♪ Kain tayo! ♪ · Since 1987 / Simula pa noong 1987 · Pass the rice, please / Pakiabot ang kanin · ♪ Let's sing! ♪ / ♪ Kantahan na! ♪
   Each line:
   - **Pop in** on a spring with volume-kept squash and stretch (no opacity fades anywhere).
   - **Countdown:** four yellow dots centred above the English line pop away, one per 0.34s beat; the remaining dots stay centred.
   - **Wipe:** paper `#EDE9E9` text fills to yellow `#F6DE43` left to right, word by word, 0.2s per syllable, stepped at 12fps ("on twos"). English first, then Tagalog 0.14s later.
   - **Sound word** (Sakuga VFX lettering, Yuji Boku) lands at the end of every line, with a small effect: Welcome → Salamat! + sparkles · Let's eat → Sarap! + puffs · Since 1987 → Pak! + burst · Pass the rice → Pok + puffs · Let's sing → Dagundong + speed lines + sparkle. Words are clamped inside the viewport.
   - **Phones (< 768px):** the lines sit 92px up, clear of the pause button and thumbnail, with 16px side gutters so the longest Tagalog line fits on one row.
   - **Hold** 0.85s, then **smear out**: a 0.25s sideways stretch and lean with speed lines, then a hard cut.
   - **Score card:** after the last line, "100 — Ang galing mo! / You're a star!" pops in for 2.6s with a burst, sparkles and Salamat!, then the loop restarts.
   The effects canvas sits at z-index 9 (above the hero, below the header and its menu overlay) and is wiped when the subtitles unmount or reduced motion switches on, so no frozen effect is left behind. Effects load lazily; if they fail, the wipe still runs. The subtitles pause while the hero is off screen. They are decorative: `aria-hidden`, with the real message in the visually hidden H1.
4. **Bottom-right thumbnail:** 76×76, 2px paper border, 10px radius, looping `about-thumb.mp4` (240×240 crop of the about film), links to `/about` ("Watch our story").
5. **Bottom-left pause control** (icon only, no outline; 44px tap area). It pauses or plays the background video *and* the subtitles. It's required for accessibility, because motion that plays for more than 5 seconds needs a way to stop it (WCAG 2.2.2).
6. **Reduced motion** (`prefers-reduced-motion: reduce`): the video doesn't autoplay (the poster shows), and the subtitles show the first line fully lit, with no countdown, wipe, effects or cycling. This holds even if they press play: the video plays, the subtitles stay still. Data-saver visitors (who start paused) see the same still line until they press play. Pausing mid-line freezes everything where it is, sakuga effects included.
7. **H1:** visually hidden, "Bintang — London's oldest Filipino restaurant, Camden Town since 1987".
8. **Metadata:** title, description, Open Graph image (the poster), theme colour, and Restaurant JSON-LD (address 93 Kentish Town Road NW1 8NY, phone 020 7267 2197, opening hours Tue–Sun as on the current site, servesCuisine Filipino).

## Design tokens (CSS custom properties)

`--paper #EDE9E9 · --ink #2D2D2D · --red #D92E36 · --red-deep #B8242C · --green #58BE91 · --pink #E9C0D4 · --yellow #F6DE43`
Fonts: `aquavit` (Typekit kit pev2vne) everywhere — 700 (Black) for titles and subtitles, 400 for nav and body.

## Menu page (phase 1b, 17 Nov 2026)

Designed on the Claude Design canvas "Bintang Website" (Menu artboard); options B–E on the canvas are unused explorations. Content is transcribed from the printed À la carte and Brunch cards into `lib/menu.ts`.

1. **Header:** the shared `SiteHeader` (Menu marked current). Its text follows the page colour; the lion is paper on the Karaoke tab, ink otherwise.
2. **Title:** "MENU" in Aquavit Black, `clamp(88px, 22vw, 340px)` (33vw on phones so it fills the content width), squished vertically with `scaleY(0.85)`.
3. **Tabs:** À la carte · Brunch · Desserts · Karaoke, in Aquavit Regular. The row is exactly as wide as the MENU word (measured, re-measured on resize/font load), justified edge to edge, and sticky. The active tab is italic and underlined. `role="tablist"` with arrow/Home/End keys and roving focus; the active tab is mirrored in the URL hash (`/menu#brunch`), which also works as a deep link.
4. **Colours, Mala Project style:** each menu has a background and one text colour, and the page fades between them (0.6s) on tab change. À la carte paper/ink · Brunch yellow/ink · Desserts pink/ink · Karaoke ink/yellow.
5. **Sheets:** a letter-spaced band names each sheet ("À la carte · Food", "À la carte · Drinks", …). Sections flow into balanced CSS columns (3 × min 280px, 48px gutter, hairline column rules); each has an Aquavit heading, then items: name (Aquavit) with the price right-aligned, description, optional bold note. Boxed sections (Silogs, weekend desserts, private karaoke) have a 1px border. All rules are 1px.
6. **Karaoke tab:** a 16:9 muted looping video (the Home hero loop until karaoke footage exists) with yellow karaoke subtitles and a pause button; it starts paused for reduced motion or data saver. The "Karaoke at Bintang" banner links to `/contact/karaoke`.
7. **Footer:** halal/allergen/service-charge notes on drinks sheets, and a "Book a table" button to `/contact`.
8. **Spacing:** 8px scale (8/12/16/24/32/48/64/96); title, tabs and sheets share one container (max 1280px, gutter `clamp(16px, 5vw, 80px)`).

**Open:** Uber Eats / Deliveroo links (URLs needed) · real karaoke footage · karaoke pricing/capacity · Tagalog labels need a native-speaker check · brunch hours (cards say both Sat 11–3 and 11–4; site uses 11–3) · Barbera d’Alba is listed under white wine · "Merlo Basco" spelling.

## About (phase 1c, from the "About" board in the Claude Design canvas)

1. **Colour:** deep red flood (`--red-deep`), paper text, paper lion head in the header.
2. **Title:** none visible (the statement leads, as on the board); a visually hidden H1 "About" stays.
3. **Statement + film:** the large Aquavit paragraph (34→68px) sits 24px under the navbar, with the then-and-now film to its right at the golden ratio (statement : film = 1.618 : 1). Below 900px they stack, statement first.
4. **Film:** portrait 9:16 with square corners. It is muted, looping and inline, with a bottom-left pause control (WCAG 2.2.2). Reduced-motion and data-saver visitors start paused, with `preload="none"`, like the Home hero and the Karaoke video.
5. **Chapters:** three columns (1987, The kitchen, Today), each an English/Tagalog label over a 22px paragraph, under a hairline.
6. **Not built from the board:** the fixed bottom-right video thumbnail. The navbar Book button replaced it.

**Open:** the founding story (who opened it, and why) for the 1987 chapter · the Tagalog lines need a native-speaker check.

## Site footer (17 Nov 2026)

`components/SiteFooter`, after Mala Project's footer, is the last child of every page's `<main>` (Home, Menu, About, Journal and posts, every placeholder). On Menu, the sticky tab bar is wrapped with the sheets so it lets go before the footer.
1. **No colour of its own:** it takes the page's background and text colour, so it follows the Menu tab fades too. On Home it sits on ink with paper text.
2. **Left:** one column of links, English only, in the nav type (16/20px): Reserve on OpenTable · Group bookings · Private hire · email address (mailto:) · phone (tel:). It lines up with the page column (`--max`, `--gutter`).
3. **Right (right-aligned):** Find us (address, links to Google Maps) and Opening hours. The details live in `lib/site.ts`, which the JSON-LD also uses.
4. **Sign-off:** "© Bintang · Kentish Town, London" and "Since 1987", 13.6px. No Tagalog lines in the footer.
5. **< 768px:** everything stacks on the left.

**Open:** Instagram/Facebook links (handles needed) · it sits inside `<main>` like the header, so it isn't a top-level contentinfo landmark.

## Placeholder pages

Each one uses its page's v2 colour ( Menu green, Journal pink, Gallery ink, Contact yellow). They show the shared header, a big Aquavit title, "Coming soon / Malapit na", and a link back home.

## Done means

- `npm run build`, `npm run typecheck` and `npm run lint` pass.
- Unit tests pass (Vitest + Testing Library): header links and targets, mobile overlay open/close/Esc/aria-expanded, karaoke timing (syllables, schedule) and the subtitle line sequence, still state and pause, reduced-motion behaviour, and the pause control; the About film's autoplay, pause, reduced-motion and data-saver start.
- Seen running in the browser at 1440×900 and 375×812: the video plays, the font loads, and there's no horizontal scroll.
- Nothing committed or deployed without asking.

## Open questions (don't block phase 1)

- Have a native speaker check all Tagalog copy.
- Hosting target (Vercel is the natural fit for Next.js).
- Real booking provider for `/contact`.
