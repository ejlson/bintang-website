"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { menus, type MenuId, type MenuItem, type MenuSheet } from "@/lib/menu";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
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

function Sheet({ sheet }: { sheet: MenuSheet }) {
  return (
    <article className={styles.sheet} aria-label={sheet.label}>
      <h2 className={styles.band}>{sheet.label}</h2>

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
 * MENU, stretched to exactly the content width (textLength) and squished
 * vertically. An SVG so the word fills the column whatever font loads; the
 * viewBox is cropped to the letters so there is no empty band above them.
 */
function MenuTitle() {
  return (
    <svg className={styles.titleSvg} viewBox="0 22 1000 224" role="img" aria-label="Menu">
      <text
        className={styles.titleWord}
        transform="translate(0 238) scale(1 0.85)"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        aria-hidden="true"
      >
        MENU
      </text>
    </svg>
  );
}

/** The Menu page: À la carte, Brunch, Desserts and Karaoke as tabs, one accent colour each. */
export function MenuPage() {
  const [active, setActive] = useState<MenuId>("carte");
  const menu = menus.find((m) => m.id === active) ?? menus[0];

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
      style={
        {
          "--acc": menu.accent,
          "--bg": menu.background,
          // Cream on Karaoke's red is only ~3.9:1, so its tabs aren't dimmed (SPEC › Buttons).
          // …and its Book fills cream on hover, so the word turns ink, not red (~3.9:1).
          ...(menu.id === "karaoke" && { "--tab-dim": "100%", "--menu-book-on": "var(--ink)" }),
        } as CSSProperties
      }
    >
      {/* Text colour comes from --acc (see .page > header); only the lion swaps, to white on red Karaoke like About. */}
      <SiteHeader variant="page" tone="ink" mark={menu.id === "karaoke" ? "paper" : "ink"} currentHref="/menu" />

      <div className={styles.titleWrap}>
        <h1 className={styles.title}>
          <span ref={titleRef} className={styles.titleText}>
            <MenuTitle />
          </span>
          <span className="sr-only"> — Bintang Filipino restaurant, Camden</span>
        </h1>
      </div>

      {/* Bounds the sticky tab bar, so it lets go before the footer. */}
      <div>
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
            <Sheet key={sh.label} sheet={sh} />
          ))}
        </div>

        <div className={styles.cta}>
          <Link href="/contact" className="cine-book">
            <span className="cine-frame">Book a table</span>
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
