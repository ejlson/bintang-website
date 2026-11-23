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
                          /contact/groups /contact/private-hire
  app/contact             Contact us — components/ContactPage
  components/SiteHeader   bilingual split nav + centred lion head + mobile overlay
  components/Hero         video, warm overlay, pause control, thumbnail, reduced-motion poster
  components/Subtitles    videoke-style English/Tagalog lines with sakuga effects
  lib/karaoke.ts          subtitle timing (syllables → wipe schedule)
  lib/sakuga.ts           loads the vendored Sakuga VFX core (lib/vendor/sakuga-core.js, MIT)
  public/media, public/brand
```

## Home page — behaviour

1. **Full-screen hero (100svh, min 640px)**, and nothing below it: Home has no site footer (removed 19 Nov 2026). Background is `hero-loop.mp4` (trimmed 4.5–33.5s, 1920×1080 H.264 CRF 23 ~8.3 MB; portrait screens get a 608×1080 crop ~3.4 MB; no audio), autoplay, muted, loop, playsinline, with a poster. A warm overlay (soft dark fades at top (to 30%) and bottom (to 38%) over an 18% warm wash) sits over it.
2. **Header** (absolute, paper `#EDE9E9` text, 14px Helvetica, line-height 1.2):
   - Left: About/Tungkol, Menu/Mga Ulam, Gallery/Larawan, Journal/Balita.
   - Centre: lion head in the same paper colour as the links (52px tall), links to `/`, `aria-label="Bintang home"`.
   - Right (right-aligned): Book/Magpareserba → `/contact`, Groups/Grupo → `/contact/groups`, Karaoke/Kantahan → `/contact/karaoke`, Private hire/Pribado → `/contact/private-hire`.
   - English line on top; the Tagalog line underneath at 92% opacity (≥4.5:1 on every page colour). On hover, the English line is underlined.
   - **< 768px:** the left and right lists are hidden. The lion head stays centred, and a "Menu / Mga Pahina" button on the right opens a full-screen ink overlay with all 8 links set large (Aquavit). The overlay closes on Esc, on its close button and on any link click. While it's open, focus is trapped inside and the page behind doesn't scroll. The button carries `aria-expanded`.
3. **Title intro, “Welcome to Bintang” (23 Nov 2026; Intro A “Poster cut” on the design canvas, after indie film posters and Saul Bass hard cuts).** `components/HomeTitle` + `lib/homeIntro`, CSS only, keyed off `<html data-home-intro>` (`play` / `skip`). **Loader (shown while the site loads, like a normal loading screen):** on black, the full lion (`brand/lion-full-art.svg#art`) in red dissolves in (1.1s, soft focus to sharp, easing back from 104%), its tail swinging on a loop exactly like the footer lion's (same clip and pivot, shared from `FooterLion`), with a red loading ring under it (40px, 5px, a 300° arc with a fading tail and a round head, after our spinner) that draws on and spins. It holds until the page has loaded (window `load`) and the hero film has a frame (`loadeddata`, or 2.5s after load), and for at least 1.6s; never longer than 8s. The decision is made by the `<head>` script, so it doesn't wait on React and can't get stuck. In a background tab (opened with a middle-click) it holds until the tab is shown, so the sequence isn't timed while hidden. **Then, timed from the end of loading:** the ring fades (0.35s) and the lion dissolves away (0–0.9s, blurring, growing to 106%); the black lifts more slowly (0.3–1.9s) onto the film, which is dimmed to 78% warm ink with a lens vignette from the first frame (black → dark → bright, never bright in between) and pushes out from 112% to 100% over 9s. Red (`--red`) Aquavit Black poster type smash-cuts in, one piece at a time: “Brought to you by Maginhawa Group” 1.5s · WELCOME 1.9s · TO 2.25s · “Since 1987” / “Kentish Town” either side 2.7s · BINTANG 3.15s · billing line (“A Maginhawa picture · …”) 3.55s. The words are stretched 112% tall and the title creeps to 103.5% while it holds. **Hand-off:** at 5.15s the whole title dissolves away together, like the lion (0.9s: fading, blurring to 12px, growing to 106%), and the film brightens back to normal (5.2–6.3s); the header drops in from 14px above at 5.5s and the pause button and thumbnail rise from 14px below at 5.65s (0.8s each), all settled by 6.45s. It always plays through: clicks, taps and keys don't skip it. While loading and playing, the title layer blocks clicks (so none land on the hidden header); it hides itself at 6.3s into the sequence, with or without JS. Shows **only when a visitor arrives on Home from outside the site** (a search result, a link elsewhere, a typed address), decided in `<head>` before first paint on a full load of `/` (`<html data-home-intro>` goes `load` → `play` → `skip`). Never when they move to Home within the site (a client-side navigation: HomeTitle sets `skip`), come from another page of the site (same-origin referrer), reload, go back/forward to Home, or have seen it already this session (sessionStorage `bintang-home-intro`); never with reduced motion or blocked storage. Leaving Home mid-intro doesn't replay it on return. Decorative (`aria-hidden`); the H1 reads “Welcome to Bintang — London’s oldest Filipino restaurant, Kentish Town since 1987”. **Centred on the screen:** the title fills one screen from the top of the hero (`100svh`, even when the hero's 640px minimum runs past a short window), the credit is balanced by an equal invisible space under BINTANG so TO sits on the centre line both ways, the side credits are nudged level with TO's letters, and the slow push grows from the middle. Phones: the words size by width (WELCOME 20.5vw, BINTANG 24vw), capped by screen height.
   **The karaoke subtitles were removed from Home on 23 Nov 2026**; they stay on the Karaoke page (below). Their design, for reference (Filipino videoke, animated in the Sakuga VFX style; prototype `preview/karaoke.html`), centred at the bottom: Aquavit 700, ink outline (text-shadow). English line `clamp(22px,2.8vw,42px)`, Tagalog line `clamp(20px,2.5vw,38px)`. Lines:
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
4. **Bottom-right thumbnail:** 76×76, 2px paper border, square corners, looping `about-thumb.mp4` (240×240 crop of the about film), links to `/about` ("Watch our story").
5. **Bottom-left pause control** (icon only, no outline; 44px tap area). It pauses or plays the background video. It's required for accessibility, because motion that plays for more than 5 seconds needs a way to stop it (WCAG 2.2.2).
6. **Reduced motion** (`prefers-reduced-motion: reduce`): no title intro, and the video doesn't autoplay (the poster shows). (On the Karaoke page, the subtitles show the first line fully lit, with no countdown, wipe, effects or cycling. This holds even if they press play: the video plays, the subtitles stay still. Data-saver visitors (who start paused) see the same still line until they press play. Pausing mid-line freezes everything where it is, sakuga effects included.)
7. **H1:** visually hidden, "Welcome to Bintang — London's oldest Filipino restaurant, Kentish Town since 1987".
8. **Metadata:** title, description, Open Graph image (the poster), theme colour, and Restaurant JSON-LD (address 93 Kentish Town Road NW1 8NY, phone 020 7267 2197, opening hours Tue–Sun as on the current site, servesCuisine Filipino).

## Edge fade (23 Nov 2026)

Every page: the edges of the screen fade softly into warm black (#0e0b0a, the Home loader's), like a lens vignette. `<div class="vignette">` in the root layout, styled in `globals.css`: fixed, a radial gradient (ellipse 80% × 75%; clear to 55%, 25% at 80%, 55% at the corners), `pointer-events: none`, `aria-hidden`. z-index 2: over page content and the gallery grid, under the header, bars, tab bars and pause buttons (3 and up), menus (50) and the photo viewer (60), so those stay crisp. It has its own view-transition layer (`view-transition-name: vignette`, group z-index 3, not animated, old snapshot hidden), so it stays on screen, unchanged, through the page wipe instead of popping in when the wipe ends.

## Scrollbar (19 Nov 2026)

No window scrollbar on any page (`scrollbar-width: none` and `::-webkit-scrollbar { display: none }` on `html` in `app/globals.css`). Scrolling still works with wheel, trackpad, touch and keys.

## Design tokens (CSS custom properties)

`--paper #EDE9E9 · --ink #2D2D2D · --red #D92E36 · --red-deep #B8242C · --green #58BE91 · --pink #E9C0D4 · --yellow #F6DE43`
Fonts: `aquavit` (Typekit kit pev2vne) everywhere — 700 (Black) for titles and subtitles, 400 for nav and body.

## Buttons — "Cinematic" (23 Nov 2026, direction D on the "Bintang Buttons" design canvas)

Set like opening credits, all in Aquavit (no other font): Regular (400) in wide caps, hairlines, no filled pills, and one slow ease (0.7s, `--ease`) for every hover. Shared classes in `app/globals.css`.

1. **Book a table** (`.cine-book` + inner `.cine-frame`): caps at 0.42em tracking inside a 1px frame (54px tall), with a short 1px rule either side (28px). Hover (mouse only): the rules grow 2.5× outward (a transform, so nothing moves) and the frame takes the accent. Rules and hover frame use `--cine-accent`: red by default; cream on About's red page, the karaoke yellow on Karaoke, the sheet colour on Menu, the text colour in the footer. Footer uses `.cine-book--sm` (44px, 11px) with **no side rules** and the header Book's hover (23 Nov 2026): the page's text colour wipes in from the left (0.5s) and the words take the page's ground, `--ground`, which each page sets next to its background (About, Contact, Gallery, Journal, Karaoke and its yellow footer, Menu; Placeholder from its inline background). The words are recoloured with `-webkit-text-fill-color` so `currentColor` still paints the fill. Instant for reduced motion. Below 480px the tracking and rules shrink so it fits a phone. Karaoke's "Enquire" uses the same button.
2. **Secondary links with an arrow** (About/Karaoke/Contact `.more`, Journal `.line`): Aquavit Regular, 12px caps at 0.32em, no underline; on hover the thin arrow slides 10px on.
3. **Selected states** (Menu tabs): the others are dimmed (72% of the sheet colour, `--tab-dim`; not on the red Karaoke sheet, where cream has no contrast to spare), the chosen one is full strength, italic, with a 1px line that draws in under it.
4. **Header Book** (`components/BookButton`, `SiteHeader.module.css`): a plain link to OpenTable in a new tab, with **no click effect** (the Sakuga impact frame was removed on 23 Nov 2026). "BOOK" in Aquavit Regular, 12px caps at 0.32em, centred in a square 1px frame (44px tall, 34px side padding, 24px on phones; the left pads by the extra 0.32em the last letter trails) in the bar's colour, no rules (the bar has no room). The frame rests at 60% strength. On hover or keyboard focus it fills with the bar's colour, wiping in from the left (0.5s), and the word turns to `--book-on`, the contrasting colour: ink on a cream or yellow fill, cream on an ink one (on Menu, the sheet's background; ink on the red Karaoke sheet).
5. **Not yet converted** (files were being changed by other work at the time): the gallery view switcher and the photo viewer's round controls (to become thin chevrons and a "Close" word).

## Menu page (phase 1b, 17 Nov 2026)

Designed on the Claude Design canvas "Bintang Website" (Menu artboard); options B–E on the canvas are unused explorations. Content is transcribed from the printed À la carte and Brunch cards into `lib/menu.ts`.

1. **Header:** the shared `SiteHeader` (Menu marked current). Its text follows the page colour; the lion is paper on the Karaoke tab, ink otherwise.
2. **Title:** "MENU" in Aquavit Black, `clamp(88px, 22vw, 340px)` (33vw on phones so it fills the content width), squished vertically with `scaleY(0.85)`.
3. **Tabs:** À la carte · Brunch · Desserts · Karaoke, in Aquavit Regular. The row is exactly as wide as the MENU word (measured, re-measured on resize/font load), justified edge to edge, and sticky. The active tab is italic and underlined. `role="tablist"` with arrow/Home/End keys and roving focus; the active tab is mirrored in the URL hash (`/menu#brunch`), which also works as a deep link.
4. **Colours, Mala Project style:** each menu has a background and one text colour, and the page fades between them (0.6s) on tab change. À la carte paper/ink · Brunch yellow/ink · Desserts pink/ink · Karaoke ink/yellow.
5. **Sheets:** a letter-spaced band names each sheet ("À la carte · Food", "À la carte · Drinks", …). Sections flow into balanced CSS columns (3 × min 280px, 48px gutter, hairline column rules); each has an Aquavit heading, then items: name (Aquavit) with the price right-aligned, description, optional bold note. Boxed sections (Silogs, weekend desserts, private karaoke) have a 1px border. All rules are 1px.
6. **Karaoke tab:** a 16:9 muted looping video (the Home hero loop until karaoke footage exists) with yellow karaoke subtitles and a pause button; it starts paused for reduced motion or data saver. The "Karaoke at Bintang" banner links to `/contact/karaoke`.
7. **Footer:** halal/allergen/service-charge notes on drinks sheets, and a "Book a table" button to `/contact` (see Buttons).
8. **Spacing:** 8px scale (8/12/16/24/32/48/64/96); title, tabs and sheets share one container (max 1280px, gutter `clamp(16px, 5vw, 80px)`).
9. **Motion (19 Nov 2026, About's motion in CSS, no JS):** on load MENU rises from a mask, the tabs arrive left to right and the menu comes in under them. The whole menu is visible once it has come in (23 Nov 2026: no scroll-driven reveals, so nothing below the fold is faded or hidden); only the karaoke card's title lags the page (±8px) on the scroll timeline. Tab switches replay it for the new sheets. None for reduced motion.

**Open:** Uber Eats / Deliveroo links (URLs needed) · real karaoke footage · karaoke pricing/capacity · Tagalog labels need a native-speaker check · brunch hours (cards say both Sat 11–3 and 11–4; site uses 11–3) · Barbera d’Alba is listed under white wine · "Merlo Basco" spelling.

## About (rebuilt 19 Nov 2026, from the "About option B — Editorial album" board in the Claude Design canvas)

`components/AboutPage` (+ `AboutFilm`), media in `public/media/about/`. Deep red flood (`--red-deep`), paper text, a quiet newspaper feel like the Menu.

1. **One system:** spacing 8 · 16 · 24 · 32 · 48 · 64 · 96; every section opens on a 2px rule, 24px above its content, with the same section gap below; inner dividers 1px; columns split by soft rules. Type roles, Aquavit only (700 display and labels, 400 text): label 12px tracked caps · caption 14px italic · small 16px · story 20–24px · statement 32–48px · item title 32px · display 40px caps · headline 48–112px caps · giant quote 56–160px caps.
2. **Masthead:** "ABOUT US" across the full width (FitTitle, H1; the rotating stamp beside it was removed 23 Nov); a tracked band between rules; ruled facts (Since, Find us, Open from `lib/site`, Brunch).
3. **Statement + film:** the statement (key phrases italic and underlined) with the full lion at its foot, and the then-and-now film at 1.618 : 1; film square-cornered, muted, looping, with a pause control; reduced-motion and data-saver visitors start paused.
4. **History ("Where it began. Camden, 1987."):** two stories set like a newspaper feature with the family's own photos (Halloween at the original shopfront; the bamboo dining room), "From one kitchen" years (1987–2026), and the then-and-now strip in full colour. Facts from maginhawagroup.co.uk/about.
5. **Giant quote:** "Same street, same kitchen, same recipes." (from the old site).
6. **From the kitchen:** dish names from the current menu run on in a box, linking to /menu.
7. **Come for:** Dinner, Brunch, Karaoke, Groups; Book a table (OpenTable, new tab) and Groups and private hire.
8. **Motion (CSS scroll-driven, no JS):** rules draw in; headlines rise from a mask; photos develop from pale and soft; the years arrive one after another; each dish is underlined as it passes the middle of the screen. All still for reduced motion and in browsers without scroll-driven animations.
9. **Editorial entrance + reveals (CSS, no JS):** on load the page opens on the red ground and the first screen sets itself in about a second (rules draw under the masthead, band and facts; ABOUT US rises from a mask; the band and facts arrive; the statement rises; the film wipes open; the lion and caption fade in). Below the fold, photos wipe open from the bottom as they scroll in, text arrives in its blocks, and the "Come for" columns and then-and-now photos arrive left to right; these follow the scroll, so nothing can stay blank. None of it for reduced motion; the scroll reveals also need scroll-driven animation support.
10. **Parallax (19 Nov 2026, CSS scroll-driven):** ABOUT US stays put (no sink, by request); photos are scaled to 116% inside their frames and drift −6% to +6% as they pass (on the frame's named view timeline, because a clipping frame is its own scroll container); the lion runs 32px ahead of the page and the giant quote lags 20px (keeping its 0.92 squash). Still for reduced motion.

## Journal front page layout (23 Nov 2026, from the "Bintang Journal redesign" design canvas)

1. **Title:** the same size as GALLERY: it spans the screen rather than the content column, with 1.4vw at each side (so its ink is 97.2vw wide, like GALLERY's), 8px under the header, and is squished to 0.95 (`FitTitle squish={0.95}`) so its capitals are as tall as GALLERY's (219px vs 220px at 1440). No rule under it.
2. **One stories grid** under the title: four columns, 24px gutters (two under 1100px, one under 600px). The latest story is an ink panel (`--ink` ground, newsprint text) three columns wide; the next older story is a normal card in the fourth column, and the panel spans that card's five subgrid rows so it ends level with its Read more. The rest run four to a row underneath, on the same columns.
3. **The panel:** kicker between hairlines ("Latest · <label>" and the long date), headline and summary on the left; the photo (filling the panel's height, never shorter than 4:3) and Read the story on the right. Read the story has its arrow right after the words; on hover/focus newsprint sweeps down through the bar from the top (0.45s), the words turn ink and the arrow slides 10px on. Under 900px it stacks photo first; on phones it runs to the screen edges, one column wide (on tablets, full width with the cards two to a row under it).
4. **Card rules:** each card's headline is justified (every line but the last runs the card's width; hyphenated, no `text-wrap: balance`) and sits over a hairline and its label (section · date) closes with a third; they're on the shared subgrid rows, so each line runs level across a row.
5. **Cards' Read more:** a bar between two hairlines with the same thin arrow after the words. Hovering the card (or focusing its link) sweeps ink down through the bar from the top (0.45s), turns the words newsprint so they stay readable, and slides the arrow 10px on. Both sweeps fill at once for reduced motion.
6. **Rules match the title:** JOURNAL sits between two 2px ink rules (14px from the letters at 1440, `clamp(8px, 1vw, 14px)`), 1.4vw in from each side of the screen. The karaoke advert sits outside the content column with the same 1.4vw sides, between two rules of the same width. The colophon line ("Bintang · Kentish Town, London · …") was removed. Each card's headline has a hairline under it only, none above.
7. **Book a table (advert and post foot):** the cinematic button without its side rules; on hover/focus the frame fills with ink from the left and the words turn newsprint, like the header's Book (0.5s; instant for reduced motion). The footer's small one fills the same way (see Buttons).
8. **No Older entries bar:** the search box and the Show and Sort menus were removed with it. "Older entries" stays as a screen-reader heading; the section and list are `display: contents` so each card is a grid cell, with `role="list"` kept for Safari.

## Journal motion (19 Nov 2026, About's motion in CSS, no JS)

1. **Load:** JOURNAL rises from a mask, the lead panel fades up and its photo wipes open, then Read the story arrives. The card beside it fades up at 0.5s, then the rows under them fade up left to right a beat apart (23 Nov: on load, not on scroll, so the first screen never shows a card half faded). The post page sets itself the same way (back link and kicker, title, photo wipe, lede).
2. **Scroll (follows the scroll timeline):** JOURNAL stays put once it has risen in; every photo is scaled to 116% and drifts −6% to +6% in its frame; the advert's top rule draws as it enters and its bottom rule as it finishes entering, its title rises and lags 14px, and its lines fade up.
3. **Tap targets:** nothing between a headline link and its story block (`.front`, `.story`) is clipped or translated, since that would shrink the stretched link.
4. None for reduced motion; without scroll-driven animation support only the load entrance plays.

**Open:** the Tagalog lines need a native-speaker check · the Maginhawa story page says the group began in "Camden" while Bintang is on Kentish Town Road; the headline follows the story page.

## Site footer (17 Nov 2026; redesigned 19 Nov 2026)

`components/SiteFooter`, from the "Footer — blurred wordmark" boards on the Claude Design canvas (after the Moah studio site), is the last child of every page's `<main>` except Home.
1. **No colour of its own:** the background is the page's, and the lion and type take the page's text colour (so it follows the Menu tab fades too). On Home it sits on ink with paper text. Aquavit only.
2. **The lion:** the full lion (drawn from `public/brand/lion-full-art.svg#art` by `<use>`, in `currentColor`; see 5), 76px from the top, as wide as the content allows (20px gutters) without outgrowing the screen height. **Fade-out:** it fades away towards the bottom, softening a little as it goes: 3 copies (sharp, then blurred 0.4× and 1× `--lion-blur`: 12px desktop, 6px phone), each shown in its own band and fading out, gone by ~90% of its height so the bottom text stays clear. Each copy is blurred before its band is cut (the other way round smears band edges into streaks). Decorative (`aria-hidden`).
3. **Top row:** "Since 1987" · small-caps links (Groups, Private hire, Karaoke, email, phone) · a small "Book a table" to OpenTable (`.cine-book--sm`, see Buttons).
4. **Bottom row:** "London's oldest Filipino restaurant." and the address (links to Google Maps) · opening hours · "Back to top ↑" (Lenis-eased, then focus goes to the home mark). Contact details and hours live in `lib/site.ts`, shared with the JSON-LD.
5. **Tail swing** (`components/FooterLion`, the "Option A — Solid swing" board): the drawing is used from `public/brand/lion-full-art.svg#art` (no fill, so it takes the text colour) as two clipped copies, body and tail. The tail turns as one piece on its base (pivot 366,262 in the drawing's units; no joints, which showed seams): 3.5°, −3.5°, 1.9°, rest over 4.4s, ease-in-out. It plays once each time the lion comes into view (35% visible, on the way in, not out) and when a mouse moves onto it; a trigger mid-swing is ignored, so it never snaps back. Clip ids come from `useId`, since the router keeps earlier pages' footers in the DOM; under WCAG 2.2.2's 5s, so no pause control. None with reduced motion. The fade masks reach 60px above the lion so the tail isn't clipped when it swings up.
6. **Height:** one screen, `max(560px, 100svh)`. **< 768px:** the type stacks at the top and the lion sits underneath it, running off the bottom.

**Open:** Instagram/Facebook links (handles needed) · it sits inside `<main>` like the header, so it isn't a top-level contentinfo landmark.

## Gallery (rebuilt 23 Nov 2026 as one bento grid)

One grid of photographs and film clips, bento-style, on the Home loader's warm black. Replaces the three-view page (scattered field E with depth and parallax, a square grid, and one-at-a-time, 19–23 Nov), which is in git history. `components/GalleryPage`, `components/PhotoViewer`, `components/FlickStage`, `components/LoopVideo`; data and layout in `lib/gallery.ts`.
1. **Photos:** 19 — the 14 in `public/media/gallery/` plus five from `public/media/journal/` (archive-family, karaoke, private-hire, brunch, garden; 960×1200). `PHOTOS` is in the grid's reading order (reordered 23 Nov to match the six-column layout); the viewer steps in that order.
2. **Clips:** the 14 gallery stills are frames from the hero film (`bintang-hero.mp4`) and the about film (`aboutbig.mov`). Each has a clip of its own shot beside it (`<id>.mp4`; 960×540 or 540×960, H.264, no sound; played forwards then backwards so it loops without a jump; 80–760 KB, 4.3 MB in all). The still is the poster underneath; the clip (muted, looping, `preload="none"`, decorative) plays only while on screen (IntersectionObserver, 200px margin), fades in once it is actually playing, and isn't rendered for reduced motion. The viewer plays it too. The journal photos are stills.
3. **Page:** the Home loader's warm black (`#0e0b0a`) with red (`--red`) text; the header is red too (`tone="red"`, red lion; Book's frame red, filling red with paper text on hover) and the footer takes the page's red (type and lion). Red on this black is about 4:1, so the small header and footer type is under the 4.5:1 AA mark for body text; the site-wide edge fade (see Edge fade) darkens the screen's edges into that black; The H1 is visually hidden. No view switch, no corner labels.
3a. **Title (23 Nov):** a big "GALLERY" in red (`--red`) Aquavit Black across the page (25.5vw, squashed `scaleY(0.85)`, like the old field title), then the grid under it. The title is pinned (`position: sticky`, top 0) under the grid, so the photos scroll up over it and it shows through the 4px gaps. As you scroll, the title darkens into the black (opacity 1 → 0, a CSS scroll-driven animation on the root scroller over `0 → 100px + 17.34vw`: the 76px header, its 24px padding and its type), gone just as the grid's top reaches the top of the screen and covers it; browsers without scroll timelines leave it as it is. Decorative (`aria-hidden`); the visually hidden H1 names the page.
4. **Bento (768px and up):** six square columns (rows as tall as a column is wide), 4px gaps and the same 4px at each side. Each tile is placed by hand (`BENTO` in `lib/gallery.ts`: column, row, width and height in cells): landscape mostly 2 × 1, portrait 1 × 2, the journal's 4:5 photos 1 × 1, and two 2 × 2 features (the garden, the private party). Six rows, no holes. Tiles fill their cell (`object-fit: cover`).
5. **Phones (< 768px):** two square columns, 4px gaps and sides; spans `pw`/`ph` in `BENTO`, placed in order (no `dense` back-filling, so the reading and focus order is the visual order), 15 rows without holes.
6. **No rounded corners** on any photo, clip, caption or video (23 Nov; the Contact video and the Home video thumbnail lost theirs too).
7. **Hover / focus:** a paper label with the number and name ("14 Behind the bar") fades up in the tile's bottom-left corner (decorative, `aria-hidden`: each button already says "Open photo: …"); with a mouse the photo or clip also eases to 1.04×. Keyboard focus shows the label and a paper outline inside the tile. Reduced motion: no easing or zoom.
8. **Click / tap:** opens `PhotoViewer` on the warm black at 92% (the page only just showing through) — the caption between the arrows is a fixed box (360px wide, room for two lines of name, three on phones, over the count), so the arrows and count never move as the names change; Close / Previous / Next, arrow keys step and wrap, Esc closes, Tab stays inside, focus starts on Close and returns to the tile, the page behind doesn't scroll. Keys are heard on the document so they work after a click leaves focus on `<body>`.
9. **Flicking (after the BUNSO gallery's full view), `components/FlickStage`:** in the viewer each new photo is laid on top of the last and opens out from the centre (clip-path `inset(40%)` → `inset(0)`, 0.36s, `cubic-bezier(0.25, 0.6, 0.3, 1)`); the old one is dropped once it has opened, hidden from assistive tech meanwhile. Touch screens swipe (40px, mostly sideways); the scroll wheel turns photos too: one per 40px of travel, then nothing until the wheel has rested for 450ms (each event restarts the wait, so a trackpad flick's momentum turns only one); pinch-zoom (wheel with Ctrl) is left to the browser. Reduced motion: the new photo just replaces the old.
10. **Loading:** the first four stills load eagerly, the rest lazily; clips only when near the screen. `sizes` is 17vw per column wide, 50vw per column on phones.
11. The site footer follows the grid (it wears the dark page).

**Open:** real years for the archive captions.

## Karaoke (19 Nov 2026, from the "Karaoke — night edition" board in the Claude Design canvas)

`components/KaraokePage` (+ `KaraokeHero`, `KaraokeSnap`) at `/contact/karaoke`. Ink page, yellow for the wordmark, header and information. No scrollbar (site-wide, see `app/globals.css`; scrolling works as normal). A pinned video; the information scrolls up over it and rests at its foot; then the footer comes up and pushes everything away.
1. **Pinned stage (sticky, `--stage-h` = max(600px, 100svh), negative bottom margin so the rest of the page lies on top of it):** `karaoke-loop.mp4`, the karaoke scenes cut from the Home film (`bintang-hero.mp4` 14.55–18.12s + 20.80–26.87s, ~9.6s, 1920×1080 H.264 CRF 24, ~2.3 MB, no audio; portrait screens get a 608×1080 crop, ~0.8 MB, swapped on rotation), muted, looping, inline. The poster (the full room) is the stage's background, landscape or portrait. A dark fade at the top and the foot. The Home page's videoke subtitles (`components/Subtitles`, same lines, sakuga effects and score card; see Home §3) play over the foot. One pause button (bottom left, 44px, "Pause video" + `aria-pressed`) stops the video and the subtitles (WCAG 2.2.2). Reduced-motion and data-saver visitors start paused on the poster (`preload="none"`, no download) with the subtitles' still line, as on Home; pressing play starts the video. As the visitor scrolls, the subtitles fade out over the first 35vh and are taken off the page at 40% of a screen (which also wipes their sakuga effects layer, so no effect is left frozen over the information; back at the top they start again) and the room dims to 62% ink over the first 70vh, so the yellow reads. The stage stays pinned until the footer covers it.
2. **Header and title:** the shared `SiteHeader` in yellow (`variant="overlay" tone="yellow" mark="yellow"`: yellow links, yellow lion `brand/lion-head-yellow.svg`, yellow Book outline; Karaoke current) with "KARAOKE" in yellow across the width under it (FitTitle, H1), in a sticky strip one screen tall (that screen is also the scroll before the information arrives). Clicks pass through its empty space.
3. **Information, scrolling over the video:** after the strip, so it scrolls up from the bottom like any page, then rests: sticky just under KARAOKE, as tall as the rest of the screen, columns at its foot. Yellow text, no background, a soft shadow behind the letters. Two columns split by a yellow rule (stacked below 900px, tighter type below 600px), from the board. On wide screens an empty space between each column's text and its buttons takes whatever height is left (72–280px), so the buttons sit low:
   - **01 · Group dining — The sharing feast:** platters at £38 per person, three starters and three mains with jasmine rice, then Buko Pandan; Book a table (see Buttons, yellow rules; OpenTable, new tab) and See the karaoke menu → `/menu#karaoke`.
   - **02 · Private hire — The whole room:** hire the lower ground floor and the karaoke comes with it; email for room-hire prices and time slots; Enquire (same button, email, subject "Karaoke room hire") and the email address.
   Buttons sit 24–44px below that space. Clicks pass through the information's empty space to the pause button. Below 900px the stacked columns are taller than the space under KARAOKE, so there the header, title and information scroll as a normal page over the pinned video.
4. **Scroll assistance (`KaraokeSnap`, Lenis snap, "proximity", 45% threshold, 0.9s):** stopping near the top or near the resting view (where the information has just come to rest) eases the page the rest of the way there; free scrolling elsewhere is left alone. Only while Lenis runs (`onLenis` in `SmoothScroll`): not for reduced motion, and touch keeps native scrolling. Snap points are recomputed on resize.
5. **Parallax (CSS scroll-driven, so it moves with the smooth scroll; still for reduced motion):** the video zooms to 110% and drifts up 3% over the first screen; the subtitles and dim are scroll-linked as above; the two columns rise into place as they enter, the second a beat behind and from further down (80px / 160px). The snap eases out (quint, 1.2s).
6. **Hold, then footer:** 60vh of scroll with the information at rest, then the shared site footer on yellow with ink text and lion slides up over everything. It sits inside the same group as the header strip and the information, so they stay pinned while it covers them; as it comes up, the title and information drift up 24px and fade out (CSS scroll-driven, on the footer's view timeline `--karaoke-footer`, shared with `timeline-scope`; without support they simply stay put under it).

Facts come from the karaoke sheet in `lib/menu.ts` and the current bintangrestaurant.co.uk Karaoke page. Open mic is left out: the brunch card's "Saturday 5pm – 11pm" runs past Saturday closing (10pm) and isn't on the current site.

**Open:** real karaoke-night footage (the loop reuses the Home film) · room capacity and hire prices · confirm whether open mic still runs (and remove it from the brunch sheet if not) · Tagalog labels need a native-speaker check.

## Contact us (23 Nov 2026)

`components/ContactPage` at `/contact`. Yellow page, ink type, after typographic restaurant contact pages on Awwwards (Root Food, UVE, Les Burgers de Colette). No Tagalog subtitle under the title.
1. **One screen:** (`min-height`, so a very short window grows instead of spilling into the footer) header, "CONTACT US" (FitTitle, H1; across the page like the Journal masthead: 1.4vw side margins, a 2px ink rule above and below, the usual 0.85 squish, so it is not as tall as JOURNAL) and the details fit `max(560px, 100svh)`; the footer is the next screen.
2. **Body:** (same 1.4vw side margins as the title; the film and rows keep their widths from a 1520px column, 5/12 and 7/12 less the gap, and are pinned to the title's left and right edges, any extra width going between them) a film (left, 5/12, fills the height, caption pill over its foot (hollow: 1px yellow outline, yellow caps, 32px tall); `components/ContactFilm`): the Home film's portrait loop `hero-loop-portrait.mp4` with its portrait poster, cropped to cover, muted, looping, with a hollow 32px pause circle bottom right, the same height as the caption (1px yellow outline, 44px tap area) (WCAG 2.2.2). Reduced-motion and data-saver visitors start paused on the poster with nothing downloaded; at 900px and below, where the column is hidden, it never loads. beside four numbered rows split by rules: 01 Visit (address → Google Maps), 02 Call (`tel:`), 03 Write (`mailto:`, "Groups, private hire and karaoke nights."), 04 Hours (2×2). Facts from `lib/site.ts`. The rows sit close together (20px padding, number, label and value cap-aligned at the top; the first row's capitals level with the photo's top; no rule above the first row), at the foot of the column against the right edge, "Book a table" (→ OpenTable; drawn like the Header Book, see Buttons §4: hairline ink frame, 12px caps at 0.32em, ink fills from the left on hover with yellow words; not the shared `.cine-book`) and "Karaoke & private hire →" at the foot of the column, level with the bottom of the photo, which takes all the height under the title.
3. **≤ 900px:** the film goes and the rows stack; **≤ 600px:** the value sits under the label.
4. **Motion:** the title rises from a mask, then the film and rows fade up in turn. None for reduced motion.

## Placeholder pages

Each one uses its page's v2 colour (Journal pink, Contact yellow). They show the shared header, a big Aquavit title, "Coming soon / Malapit na", and a link back home.

## Done means

- `npm run build`, `npm run typecheck` and `npm run lint` pass.
- Unit tests pass (Vitest + Testing Library): header links and targets, mobile overlay open/close/Esc/aria-expanded, karaoke timing (syllables, schedule) and the subtitle line sequence, still state and pause, reduced-motion behaviour, and the pause control; the About film's autoplay, pause, reduced-motion and data-saver start.
- Seen running in the browser at 1440×900 and 375×812: the video plays, the font loads, and there's no horizontal scroll.
- Nothing committed or deployed without asking.

## Open questions (don't block phase 1)

- Have a native speaker check all Tagalog copy.
- Hosting target (Vercel is the natural fit for Next.js).
- Real booking provider for `/contact`.
