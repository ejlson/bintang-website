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
  app/gallery/page.tsx    Gallery — components/GalleryPage, PhotoViewer; data and layout in lib/gallery.ts
  app/contact/karaoke     Karaoke — components/KaraokePage, KaraokeHero; video in public/media/karaoke/, photos from gallery and journal
  app/[...]/page.tsx      placeholders: /journal
                          /contact /contact/groups /contact/private-hire
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
9. **Motion (19 Nov 2026, About's motion in CSS, no JS):** on load MENU rises from a mask, the tabs arrive left to right and the menu comes in under them. On the scroll timeline (MENU itself stays put once it has risen in): each band draws its two rules in; section headings rise; sections fade up as they enter (every other one a beat later), settled before the middle of the screen so prices sit still while read; the karaoke card's title rises and lags the page (±8px). Tab switches replay it for the new sheets. None for reduced motion; without scroll-driven animation support only the load entrance plays.

**Open:** Uber Eats / Deliveroo links (URLs needed) · real karaoke footage · karaoke pricing/capacity · Tagalog labels need a native-speaker check · brunch hours (cards say both Sat 11–3 and 11–4; site uses 11–3) · Barbera d’Alba is listed under white wine · "Merlo Basco" spelling.

## About (rebuilt 19 Nov 2026, from the "About option B — Editorial album" board in the Claude Design canvas)

`components/AboutPage` (+ `AboutFilm`), media in `public/media/about/`. Deep red flood (`--red-deep`), paper text, a quiet newspaper feel like the Menu.

1. **One system:** spacing 8 · 16 · 24 · 32 · 48 · 64 · 96; every section opens on a 2px rule, 24px above its content, with the same section gap below; inner dividers 1px; columns split by soft rules. Type roles, Aquavit only (700 display and labels, 400 text): label 12px tracked caps · caption 14px italic · small 16px · story 20–24px · statement 32–48px · item title 32px · display 40px caps · headline 48–112px caps · giant quote 56–160px caps.
2. **Masthead:** "ABOUT US" across the width (FitTitle, H1) beside a rotating stamp ("London's oldest Filipino restaurant · Since 1987" around the lion head); a tracked band between rules; ruled facts (Since, Find us, Open from `lib/site`, Brunch).
3. **Statement + film:** the statement (key phrases italic and underlined) with the full lion at its foot, and the then-and-now film at 1.618 : 1; film square-cornered, muted, looping, with a pause control; reduced-motion and data-saver visitors start paused.
4. **History ("Where it began. Camden, 1987."):** two stories set like a newspaper feature with the family's own photos (Halloween at the original shopfront; the bamboo dining room), "From one kitchen" years (1987–2026), and the then-and-now strip in full colour. Facts from maginhawagroup.co.uk/about.
5. **Giant quote:** "Same street, same kitchen, same recipes." (from the old site).
6. **From the kitchen:** dish names from the current menu run on in a box, linking to /menu.
7. **Come for:** Dinner, Brunch, Karaoke, Groups; Book a table (OpenTable, new tab) and Groups and private hire.
8. **Motion (CSS scroll-driven, no JS):** rules draw in; headlines rise from a mask; photos develop from pale and soft; the years arrive one after another; the stamp turns with the scroll; each dish is underlined as it passes the middle of the screen. All still for reduced motion and in browsers without scroll-driven animations.
9. **Editorial entrance + reveals (CSS, no JS):** on load the page opens on the red ground and the first screen sets itself in about a second (rules draw under the masthead, band and facts; ABOUT US rises from a mask; the stamp, band and facts arrive; the statement rises; the film wipes open; the lion and caption fade in). Below the fold, photos wipe open from the bottom as they scroll in, text arrives in its blocks, and the "Come for" columns and then-and-now photos arrive left to right; these follow the scroll, so nothing can stay blank. None of it for reduced motion; the scroll reveals also need scroll-driven animation support.
10. **Parallax (19 Nov 2026, CSS scroll-driven):** ABOUT US stays put (no sink, by request); the stamp lags 22% over the first 60vh; photos are scaled to 116% inside their frames and drift −6% to +6% as they pass (on the frame's named view timeline, because a clipping frame is its own scroll container); the lion runs 32px ahead of the page and the giant quote lags 20px (keeping its 0.92 squash). Still for reduced motion.

## Journal motion (19 Nov 2026, About's motion in CSS, no JS)

1. **Load:** JOURNAL rises from a mask, the rule under it draws across, the lead story fades up and its photo wipes open, then Read the story arrives. The post page sets itself the same way (back link and kicker, title, photo wipe, lede).
2. **Scroll (follows the scroll timeline):** JOURNAL stays put once it has risen in; the Older entries bar draws both rules and its head rises; older stories fade up left to right a beat apart (four to a row); every photo is scaled to 116% and drifts −6% to +6% in its frame; the advert's rule draws, its title rises and lags 14px, its lines and the colophon fade up.
3. **Tap targets:** nothing between a headline link and its story block (`.front`, `.story`) is clipped or translated, since that would shrink the stretched link.
4. None for reduced motion; without scroll-driven animation support only the load entrance plays.

**Open:** the Tagalog lines need a native-speaker check · the Maginhawa story page says the group began in "Camden" while Bintang is on Kentish Town Road; the headline follows the story page.

## Site footer (17 Nov 2026; redesigned 19 Nov 2026)

`components/SiteFooter`, from the "Footer — blurred wordmark" boards on the Claude Design canvas (after the Moah studio site), is the last child of every page's `<main>`.
1. **No colour of its own:** the background is the page's, and the lion and type take the page's text colour (so it follows the Menu tab fades too). On Home it sits on ink with paper text. Aquavit only.
2. **The lion:** the full lion (drawn from `public/brand/lion-full-art.svg#art` by `<use>`, in `currentColor`; see 5), 76px from the top, as wide as the content allows (20px gutters) without outgrowing the screen height. **Fade-out:** it fades away towards the bottom, softening a little as it goes: 3 copies (sharp, then blurred 0.4× and 1× `--lion-blur`: 12px desktop, 6px phone), each shown in its own band and fading out, gone by ~90% of its height so the bottom text stays clear. Each copy is blurred before its band is cut (the other way round smears band edges into streaks). Decorative (`aria-hidden`).
3. **Top row:** "Since 1987" · small-caps links (Groups, Private hire, Karaoke, email, phone) · a hollow "Book a table" pill to OpenTable (fills red on hover, like the header's).
4. **Bottom row:** "London's oldest Filipino restaurant." and the address (links to Google Maps) · opening hours · "Back to top ↑" (Lenis-eased, then focus goes to the home mark). Contact details and hours live in `lib/site.ts`, shared with the JSON-LD.
5. **Tail swing** (`components/FooterLion`, the "Option A — Solid swing" board): the drawing is used from `public/brand/lion-full-art.svg#art` (no fill, so it takes the text colour) as two clipped copies, body and tail. The tail turns as one piece on its base (pivot 366,262 in the drawing's units; no joints, which showed seams): 3.5°, −3.5°, 1.9°, rest over 4.4s, ease-in-out. It plays once each time the lion comes into view (35% visible, on the way in, not out) and when a mouse moves onto it; a trigger mid-swing is ignored, so it never snaps back. Clip ids come from `useId`, since the router keeps earlier pages' footers in the DOM; under WCAG 2.2.2's 5s, so no pause control. None with reduced motion. The fade masks reach 60px above the lion so the tail isn't clipped when it swings up.
6. **Height:** one screen, `max(560px, 100svh)`. **< 768px:** the type stacks at the top and the lion sits underneath it, running off the bottom.

**Open:** Instagram/Facebook links (handles needed) · it sits inside `<main>` like the header, so it isn't a top-level contentinfo landmark.

## Gallery (rebuilt 19 Nov 2026, option E "Scattered field" on the Claude Design canvas)

After a Pinterest pin of the Simon Wheatley ("Don't Call Me Urban") portfolio home page: small photographs scattered across a white screen, tiny labels at the corners, a name in the middle, one photo enlarged on hover. Replaces option D (split frame + colour sweep, 17 Nov), which is in git history. `components/GalleryPage`, `components/PhotoViewer`, data and layout in `lib/gallery.ts`.
1. **Photos:** 19 — the 14 in `public/media/gallery/` plus five from `public/media/journal/` (archive-family, karaoke, private-hire, brunch, garden; 960×1200). `PHOTOS` is in reading order (left to right, top to bottom); the viewer steps in that order.
2. **Header:** ink text and the ink lion on white.
2a. **Title at the back (19 Nov):** "GALLERY" in Aquavit Black, `clamp(120px, 20vw, 400px)`, squished `scaleY(0.85)`, filling the field behind every photo; it is the page’s H1. A small italic line under it, pinned in front of the photos on a white backing (so it never moves the title), reads "Larawan", or the name and "n / 19" of the photo being looked at. Phones: the title sits first at 23vw.
2b. **Depth (19 Nov):** each photo has a layer in `FIELD` (3 near, 2 middle, 1 far). Near photos are sharp and in front; middle ones are at 94% opacity and far ones at 82%; with a mouse they also blur (1.2px, 3px), since only a mouse can bring a photo back into focus. Hovering or focusing a photo brings it into focus and to the front.
2c. **Mouse parallax (19 Nov):** with a mouse on wide screens, the field follows the pointer: `--px`/`--py` (−1 to 1) ease towards it (8% a frame) and each layer shifts by up to 32px × 22px times its factor (near 1, middle 0.55, far 0.25); the title drifts 0.2 the other way. Off for touch screens, phones and reduced motion, re-checked if the window crosses the breakpoint.
3. **Field (768px and up):** one screen (`100svh − 110px`, min 560px), a 6 × 4 grid with the title in the middle four cells. Each photo sits in its own cell (`FIELD` in `lib/gallery.ts`: column, row, horizontal and vertical edge, height as a share of the cell), so nothing overlaps at rest. Cells are size containers: a photo takes its share of the cell's height unless that would make it wider than the cell, then it takes the cell's width; either way it keeps its own shape (never cropped to another).
4. **Hover / focus:** the photo scales up 2.4× in place, above its neighbours with a soft shadow, growing towards the middle of the screen (transform-origin from its column and row) so it stays in view. The line under the big title swaps "Larawan" for that photo's name and "n / 19" (decorative, `aria-hidden`: each button already carries "Open photo: …"). Only with a mouse (`hover: hover` and `pointer: fine`, so a touchscreen laptop's tap doesn't leave one stuck big). A shrinking photo stays on top until it has finished. The name sits above the photos on a white backing. Mouse and keyboard are tracked apart; mouse focus (a click, or the viewer handing focus back after a mouse close) doesn't name a photo, keyboard focus does.
5. **Click / tap:** opens `PhotoViewer` — Close / Previous / Next, arrow keys step and wrap, Esc closes, Tab stays inside, focus starts on Close and returns to the photo, the page behind doesn't scroll. Keys are heard on the document so they work after a click leaves focus on `<body>`.
6. **Corner labels** under the field: "Bintang / Since 1987" and "Kentish Town / London NW1" (no count or hint between them). Then the site footer.
7. **Phones (< 768px):** the title goes first, then three columns of 140px cells that scroll; each photo keeps its offsets inside its cell. No enlarging; tap opens the viewer.
8. **Loading:** all 19 load up front (the field is one screen on wide screens). `sizes` 34vw wide (sharp when enlarged), 30vw on phones.

**Open:** real years for the archive captions · more photos would make the field denser, like the reference (it has about 45) · the pin's video (the reference interaction) was behind Pinterest's login, so the hover behaviour is read from the still frame.

## Karaoke (19 Nov 2026, from the "Karaoke — night edition" board in the Claude Design canvas)

`components/KaraokePage` (+ `KaraokeHero`, `KaraokeSnap`) at `/contact/karaoke`. Ink page, yellow for the wordmark, header and information. No scrollbar on this page (`scrollbar-width: none` on `html:has(.page)`; scrolling works as normal). A pinned video; the information scrolls up over it and rests at its foot; then the footer comes up and pushes everything away.
1. **Pinned stage (sticky, `--stage-h` = max(600px, 100svh), negative bottom margin so the rest of the page lies on top of it):** `karaoke-loop.mp4`, the karaoke scenes cut from the Home film (`bintang-hero.mp4` 14.55–18.12s + 20.80–26.87s, ~9.6s, 1920×1080 H.264 CRF 24, ~2.3 MB, no audio; portrait screens get a 608×1080 crop, ~0.8 MB, swapped on rotation), muted, looping, inline. The poster (the full room) is the stage's background, landscape or portrait. A dark fade at the top and the foot. The Home page's videoke subtitles (`components/Subtitles`, same lines, sakuga effects and score card; see Home §3) play over the foot. One pause button (bottom left, 44px, "Pause video" + `aria-pressed`) stops the video and the subtitles (WCAG 2.2.2). Reduced-motion and data-saver visitors start paused on the poster (`preload="none"`, no download) with the subtitles' still line, as on Home; pressing play starts the video. As the visitor scrolls, the subtitles fade out over the first 35vh and are taken off the page at 40% of a screen (which also wipes their sakuga effects layer, so no effect is left frozen over the information; back at the top they start again) and the room dims to 62% ink over the first 70vh, so the yellow reads. The stage stays pinned until the footer covers it.
2. **Header and title:** the shared `SiteHeader` in yellow (`variant="overlay" tone="yellow" mark="yellow"`: yellow links, yellow lion `brand/lion-head-yellow.svg`, yellow Book outline; Karaoke current) with "KARAOKE" in yellow across the width under it (FitTitle, H1), in a sticky strip one screen tall (that screen is also the scroll before the information arrives). Clicks pass through its empty space.
3. **Information, scrolling over the video:** after the strip, so it scrolls up from the bottom like any page, then rests: sticky just under KARAOKE, as tall as the rest of the screen, columns at its foot. Yellow text, no background, a soft shadow behind the letters. Two columns split by a yellow rule (stacked below 900px, tighter type below 600px), from the board. On wide screens an empty space between each column's text and its buttons takes whatever height is left (72–280px), so the buttons sit low:
   - **01 · Group dining — The sharing feast:** platters at £38 per person, three starters and three mains with jasmine rice, then Buko Pandan; Book a table (yellow pill, OpenTable, new tab) and See the karaoke menu → `/menu#karaoke`.
   - **02 · Private hire — The whole room:** hire the lower ground floor and the karaoke comes with it; email for room-hire prices and time slots; Enquire (outline pill, email, subject "Karaoke room hire") and the email address.
   Buttons sit 24–44px below that space. Clicks pass through the information's empty space to the pause button. Below 900px the stacked columns are taller than the space under KARAOKE, so there the header, title and information scroll as a normal page over the pinned video.
4. **Scroll assistance (`KaraokeSnap`, Lenis snap, "proximity", 45% threshold, 0.9s):** stopping near the top or near the resting view (where the information has just come to rest) eases the page the rest of the way there; free scrolling elsewhere is left alone. Only while Lenis runs (`onLenis` in `SmoothScroll`): not for reduced motion, and touch keeps native scrolling. Snap points are recomputed on resize.
5. **Parallax (CSS scroll-driven, so it moves with the smooth scroll; still for reduced motion):** the video zooms to 110% and drifts up 3% over the first screen; the subtitles and dim are scroll-linked as above; the two columns rise into place as they enter, the second a beat behind and from further down (80px / 160px). The snap eases out (quint, 1.2s).
6. **Hold, then footer:** 60vh of scroll with the information at rest, then the shared site footer on yellow with ink text and lion slides up over everything. It sits inside the same group as the header strip and the information, so they stay pinned while it covers them; as it comes up, the title and information drift up 24px and fade out (CSS scroll-driven, on the footer's view timeline `--karaoke-footer`, shared with `timeline-scope`; without support they simply stay put under it).

Facts come from the karaoke sheet in `lib/menu.ts` and the current bintangrestaurant.co.uk Karaoke page. Open mic is left out: the brunch card's "Saturday 5pm – 11pm" runs past Saturday closing (10pm) and isn't on the current site.

**Open:** real karaoke-night footage (the loop reuses the Home film) · room capacity and hire prices · confirm whether open mic still runs (and remove it from the brunch sheet if not) · Tagalog labels need a native-speaker check.

## Placeholder pages

Each one uses its page's v2 colour ( Menu green, Journal pink, Contact yellow). They show the shared header, a big Aquavit title, "Coming soon / Malapit na", and a link back home.

## Done means

- `npm run build`, `npm run typecheck` and `npm run lint` pass.
- Unit tests pass (Vitest + Testing Library): header links and targets, mobile overlay open/close/Esc/aria-expanded, karaoke timing (syllables, schedule) and the subtitle line sequence, still state and pause, reduced-motion behaviour, and the pause control; the About film's autoplay, pause, reduced-motion and data-saver start.
- Seen running in the browser at 1440×900 and 375×812: the video plays, the font loads, and there's no horizontal scroll.
- Nothing committed or deployed without asking.

## Open questions (don't block phase 1)

- Have a native speaker check all Tagalog copy.
- Hosting target (Vercel is the natural fit for Next.js).
- Real booking provider for `/contact`.
