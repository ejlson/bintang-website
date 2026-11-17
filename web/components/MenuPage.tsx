"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { menus, type MenuId, type MenuItem, type MenuSheet } from "@/lib/menu";
import { SiteHeader } from "./SiteHeader";
import { KaraokeVideo } from "./KaraokeVideo";
import { jumpTo } from "./SmoothScroll";
import styles from "./MenuPage.module.css";

const ids = menus.map((m) => m.id);
const isMenuId = (v: string): v is MenuId => (ids as string[]).includes(v);

// useLayoutEffect warns during server render; it only matters in the browser.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function Item({ item }: { item: MenuItem }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemHead}>
        <span className={styles.name}>{item.name}</span>
        {item.price && <span className={styles.price}>{item.price}</span>}
      </div>
      {item.desc && <p className={styles.desc}>{item.desc}</p>}
      {item.note && <p className={styles.note}>{item.note}</p>}
    </li>
  );
}

type VideoState = { userPaused: boolean | null; onUserPausedChange: (paused: boolean) => void };

function Sheet({ sheet, video }: { sheet: MenuSheet; video: VideoState }) {
  return (
    <article className={styles.sheet} aria-label={sheet.label}>
      <h2 className={styles.band}>{sheet.label}</h2>

      {sheet.video && <KaraokeVideo {...video} />}

      <div className={styles.columns}>
        {sheet.sections.map((s) => (
          <section key={s.title} className={s.boxed ? `${styles.section} ${styles.boxed}` : styles.section}>
            <h3 className={styles.heading}>{s.title}</h3>
            {s.sub && <p className={styles.sub}>{s.sub}</p>}
            {s.intro && <p className={styles.intro}>{s.intro}</p>}
            {s.colHead && <p className={styles.colHead}>{s.colHead}</p>}
            <ul className={styles.list}>
              {s.items.map((it) => (
                <Item key={it.name} item={it} />
              ))}
            </ul>
            {s.foot && <p className={styles.intro}>{s.foot}</p>}
          </section>
        ))}
      </div>

      {sheet.wide?.map((w) => (
        <section key={w.title} className={styles.feature}>
          <h3 className={`${styles.heading} ${styles.featureHeading}`}>{w.title}</h3>
          {w.lead && <p className={styles.lead}>{w.lead}</p>}
          <ul className={styles.featureList}>
            {w.items.map((it) => (
              <Item key={it.name} item={it} />
            ))}
          </ul>
          {w.foot && <p className={styles.intro}>{w.foot}</p>}
        </section>
      ))}

      {sheet.karaoke && (
        <Link href="/contact/karaoke" className={styles.karaoke}>
          <span className={styles.karaokeTitle}>Karaoke at Bintang</span>
          <span className={styles.karaokeLine}>{sheet.karaoke}</span>
        </Link>
      )}

      {sheet.legal && (
        <div className={styles.legal}>
          <p>
            <b>All meat is halal certified</b> · V vegetarian · VE vegan · PN peanuts · GF gluten free · Prices in £
          </p>
          <p>
            Food may contain or come into contact with allergens. Please tell a member of staff about any allergies or
            dietary requirements before ordering.
          </p>
          <p>A discretionary 12.5% service charge will be added to your bill.</p>
        </div>
      )}
    </article>
  );
}

/**
 * The brand-pack badge (brandpack-components/frames/badge/badge-blank.svg)
 * with the MENU title inside. Shapes are copied from the brand pack; the
 * text is live, in Aquavit, squished vertically like the rest of the titles.
 */
function MenuBadge() {
  return (
    <svg className={styles.badge} viewBox="307.94 622.97 286.42 170.41" role="img" aria-label="Menu">
      <defs>
        <radialGradient id="menu-badge-fill" cx="457.8" cy="826.6" r="143.34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e9bfd3" />
          <stop offset="1" stopColor="#ece8e7" />
        </radialGradient>
      </defs>
      <g stroke="#2d2d2d" strokeMiterlimit="10">
        <path
          d="M456.43,775.43c-34.45,0-66.92-6.64-91.43-18.71-25.68-12.64-39.82-29.88-39.82-48.53s14.14-35.89,39.82-48.53c24.51-12.06,56.98-18.71,91.43-18.71s66.92,6.64,91.43,18.71c25.68,12.64,39.82,29.88,39.82,48.53s-14.14,35.890-39.82,48.53c-24.51,12.06-56.98,18.71-91.43,18.71Z"
          fill="#f6de43"
        />
        <path
          d="M498.22,766.75c.38,1.13.58,2.3.58,3.49,0,11.68-18.97,21.15-42.36,21.150s-42.36-9.48-42.36-21.15c0-1.19.19-2.36.58-3.49-49.09-8.49-84.27-31.5-84.27-58.56s35.18-50.08,84.27-58.560c-.38-1.13-.58-2.3-.58-3.49,0-11.69,18.97-21.16,42.36-21.16s42.36,9.48,42.36,21.16c0,1.19-.19,2.36-.58,3.49,49.09,8.48,84.27,31.5,84.27,58.56s-35.18,50.07-84.27,58.56Z"
          fill="url(#menu-badge-fill)"
        />
        <circle cx="577.22" cy="702.92" r="15.16" fill="#f6de43" />
        <circle cx="325.11" cy="702.92" r="15.16" fill="#f6de43" />
      </g>
      <g fill="#2d2d2d" fillRule="evenodd">
        <path d="M336.88,698.25c1.23.2,1.72,1.71.84,2.6l-4.84,4.88,1.05,6.79c.19,1.24-1.090,2.17-2.21,1.61l-6.14-3.09-6.14,3.09c-1.11.56-2.4-.37-2.21-1.61l1.05-6.79-4.84-4.88c-.88-.88-.39-2.4.84-2.6l6.78-1.1,3.14-6.11c.57-1.11,2.16-1.11,2.73,0l3.140,6.11,6.78,1.1ZM328.11,703.36c0-1.4-1.13-2.53-2.53-2.53s-2.52,1.13-2.52,2.53,1.13,2.52,2.52,2.52,2.53-1.13,2.53-2.52Z" />
        <path d="M589,698.25c1.23.2,1.72,1.71.84,2.6l-4.84,4.88,1.05,6.79c.19,1.24-1.09,2.17-2.21,1.61l-6.14-3.09-6.14,3.09c-1.11.56-2.4-.37-2.21-1.61l1.05-6.79-4.84-4.88c-.88-.88-.39-2.4.84-2.6l6.78-1.1,3.14-6.11c.57-1.11,2.16-1.11,2.73,0l3.14,6.11,6.78,1.1ZM580.23,703.36c0-1.4-1.13-2.53-2.53-2.53s-2.52,1.13-2.52,2.53,1.13,2.52,2.52,2.52,2.53-1.13,2.53-2.52Z" />
      </g>
      <g fill="#2d2d2d" textAnchor="middle" aria-hidden="true">
        <text x="456.43" y="649" className={styles.badgeSmall} textLength="66" lengthAdjust="spacingAndGlyphs">
          EST 1987
        </text>
        <text x="456.43" y="776" className={styles.badgeSmall} textLength="66" lengthAdjust="spacingAndGlyphs">
          EST 1987
        </text>
        <text
          transform="translate(456.43 726) scale(1 0.85)"
          className={styles.badgeTitle}
          textLength="226"
          lengthAdjust="spacingAndGlyphs"
        >
          MENU
        </text>
        <text x="456.43" y="752" className={styles.badgeTag} textLength="158" lengthAdjust="spacingAndGlyphs">
          A TASTE OF THE PHILIPPINES.
        </text>
      </g>
    </svg>
  );
}

/** The Menu page: À la carte, Brunch, Desserts and Karaoke as tabs, one accent colour each. */
export function MenuPage() {
  const [active, setActive] = useState<MenuId>("carte");
  const menu = menus.find((m) => m.id === active) ?? menus[0];

  // The visitor's karaoke play/pause choice, kept here so it survives switching tabs.
  const [videoPaused, setVideoPaused] = useState<boolean | null>(null);

  // Colour fades are switched on only after the first paint (see .page[data-ready]).
  const [ready, setReady] = useState(false);

  // Deep links: /menu#brunch opens the Brunch tab, on load and on later hash
  // changes. A layout effect so the right menu shows before the first paint.
  useIsoLayoutEffect(() => {
    const sync = () => {
      const fromHash = window.location.hash.slice(1);
      if (isMenuId(fromHash)) setActive(fromHash);
    };
    sync();
    // Two frames: the first paints the deep-linked colours with no transition,
    // the second turns fades on. (One frame could apply both in the same style
    // pass and fade in from À la carte.)
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setReady(true));
    });
    window.addEventListener("hashchange", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const tabBarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep focused elements clear of the sticky tab bar (WCAG 2.4.11) while on this page.
  useEffect(() => {
    const bar = tabBarRef.current;
    if (!bar) return;
    const html = document.documentElement;
    const previous = html.style.scrollPaddingTop;
    // The bar's bottom padding is a see-through fade zone, so only its solid part counts.
    const update = () => {
      const fade = parseFloat(getComputedStyle(bar).paddingBottom) || 0;
      html.style.scrollPaddingTop = `${Math.max(0, bar.offsetHeight - fade)}px`;
    };
    update();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(bar);
    return () => {
      ro?.disconnect();
      html.style.scrollPaddingTop = previous;
    };
  }, []);

  const select = (id: MenuId) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    // Switching from deep in a long menu: start the new one at its top, just under the sticky tabs.
    const bar = tabBarRef.current;
    const panel = panelRef.current;
    if (!bar || !panel) return;
    const fade = parseFloat(getComputedStyle(bar).paddingBottom) || 0;
    const target = panel.getBoundingClientRect().top + window.scrollY - (bar.offsetHeight - fade);
    if (window.scrollY > target) jumpTo(target);
  };

  // The tab row is justified to exactly the width of the MENU title, so it is
  // re-measured whenever the title changes size (font load, resize).
  const titleRef = useRef<HTMLSpanElement>(null);
  const [titleWidth, setTitleWidth] = useState<number | null>(null);
  useIsoLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const measure = () => setTitleWidth(Math.round(el.getBoundingClientRect().width) || null);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tabRefs = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({});
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = ids.indexOf(active);
    const next =
      e.key === "ArrowRight" ? ids[(i + 1) % ids.length]
      : e.key === "ArrowLeft" ? ids[(i - 1 + ids.length) % ids.length]
      : e.key === "Home" ? ids[0]
      : e.key === "End" ? ids[ids.length - 1]
      : null;
    if (!next) return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <main
      className={styles.page}
      data-ready={ready || undefined}
      style={{ "--acc": menu.accent, "--bg": menu.background } as CSSProperties}
    >
      {/* Text colour comes from --acc (see .page > header); only the lion swaps for the dark Karaoke page. */}
      <SiteHeader variant="page" tone="ink" mark={menu.id === "karaoke" ? "paper" : "ink"} currentHref="/menu" />

      <div className={styles.titleWrap}>
        <h1 className={styles.title}>
          <span ref={titleRef} className={styles.titleText}>
            <MenuBadge />
          </span>
        </h1>
      </div>

      <div ref={tabBarRef} className={styles.tabBar}>
        <div
          role="tablist"
          aria-label="Choose a menu"
          className={styles.tabs}
          style={titleWidth ? { width: titleWidth } : undefined}
        >
          {menus.map((m) => (
            <button
              key={m.id}
              ref={(el) => {
                tabRefs.current[m.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${m.id}`}
              aria-selected={m.id === active}
              aria-controls="menu-panel"
              tabIndex={m.id === active ? 0 : -1}
              className={styles.tab}
              onClick={() => select(m.id)}
              onKeyDown={onTabKey}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Focusable: the panel starts with no focusable element, so Tab from the tabs lands here. */}
      <div
        ref={panelRef}
        id="menu-panel"
        role="tabpanel"
        aria-labelledby={`tab-${menu.id}`}
        tabIndex={0}
        className={styles.panel}
      >
        {menu.sheets.map((sh) => (
          <Sheet key={sh.label} sheet={sh} video={{ userPaused: videoPaused, onUserPausedChange: setVideoPaused }} />
        ))}
      </div>

      <div className={styles.cta}>
        <Link href="/contact" className={styles.book}>
          Book a table
        </Link>
      </div>
    </main>
  );
}
