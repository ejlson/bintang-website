"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { allLinks, bookLinks, exploreLinks, type NavLink } from "@/lib/nav";
import { site, socials } from "@/lib/site";
import { SOCIAL_ICON_PATHS } from "@/lib/socialIcons";
import { BookButton } from "./BookButton";
import { getLenis } from "./SmoothScroll";
import styles from "./SiteHeader.module.css";

type Props = {
  /** "overlay" floats over a hero; "page" sits in normal flow. */
  variant?: "overlay" | "page";
  /** Text colour of the bar. */
  tone?: "paper" | "ink" | "yellow" | "red";
  /** Which lion head to show in the centre. */
  mark?: "red" | "paper" | "ink" | "yellow";
  /** Phones only: the Bintang wordmark (paper) in place of the lion. */
  wordmark?: boolean;
  /** Highlights the current page's link. */
  currentHref?: string;
};

/** Matches the CSS breakpoint where the split nav replaces the menu button. */
const DESKTOP_QUERY = "(width >= 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** How long the overlay stays on screen to play its way out (SiteHeader.module.css › .leaving). */
const LEAVE_MS = 500;

const MARK_SRC = {
  red: "/brand/lion-head-red.svg",
  paper: "/brand/lion-head-paper.svg",
  ink: "/brand/lion-head-ink.svg",
  yellow: "/brand/lion-head-yellow.svg",
} as const;

function NavItem({
  link,
  current,
  onClick,
  index,
}: {
  link: NavLink;
  current: boolean;
  onClick?: () => void;
  /** Overlay rows only: numbered 01, 02…, English only, staggered in. */
  index?: number;
}) {
  return (
    <Link
      href={link.href}
      className={styles.link}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      style={index === undefined ? undefined : ({ "--i": index } as CSSProperties)}
    >
      {index !== undefined && (
        <span className={styles.num} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className={styles.en}>{link.en}</span>
      {index === undefined && (
        <span className={styles.tl} lang="tl">
          {link.tl}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader({ variant = "overlay", tone = "paper", mark = "red", wordmark = false, currentHref }: Props) {
  const [open, setOpen] = useState(false);
  // After closing, the overlay stays mounted (inert, hidden from assistive
  // tech, no longer a dialog) just long enough to animate out.
  const [leaving, setLeaving] = useState(false);
  // Bumped on every open so a reopen mid-exit remounts the overlay and its
  // entrance plays from the start.
  const [openCount, setOpenCount] = useState(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const markRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  /** Closes the menu; the overlay animates out unless motion is reduced or `instant`. */
  const hide = useCallback((instant = false) => {
    setOpen(false);
    setLeaving(!instant && !window.matchMedia(REDUCED_MOTION_QUERY).matches);
  }, []);

  const close = useCallback((instant = false) => {
    hide(instant);
    // The toggle is hidden at desktop widths; focus the home mark there instead
    // so focus never drops to <body>.
    const desktop = window.matchMedia(DESKTOP_QUERY).matches;
    (desktop ? markRef.current : toggleRef.current)?.focus();
  }, [hide]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => setLeaving(false), LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);

  // If the screen widens past the phone breakpoint while open (e.g. a tablet
  // rotates), the overlay no longer belongs: close it.
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      // The overlay no longer belongs at this width: drop it at once.
      if (e.matches) close(true);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [open, close]);

  // While the overlay is open: lock page scroll, move focus in, trap Tab, close on Esc.
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    const focusables = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    // Start on the close button (the lion home link comes before it).
    (dialog?.querySelector<HTMLElement>("button") ?? focusables()[0])?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      getLenis()?.start();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <header className={`${styles.header} ${variant === "overlay" ? styles.floating : styles.inflow} ${styles[tone]}`}>
      <nav aria-label="Explore" className={`${styles.list} ${styles.left}`}>
        {exploreLinks.map((l) => (
          <NavItem key={l.href} link={l} current={l.href === currentHref} />
        ))}
      </nav>

      <Link ref={markRef} href="/" className={styles.mark} aria-label="Bintang home">
        {/* eslint-disable-next-line @next/next/no-img-element -- small vector mark, no optimisation needed */}
        <img className={wordmark ? styles.lionWhenWordmark : undefined} src={MARK_SRC[mark]} alt="" width={53} height={52} />
        {wordmark && (
          // eslint-disable-next-line @next/next/no-img-element -- small vector mark
          <img className={styles.wordmark} src="/brand/bintang-wordmark-paper.svg" alt="" width={243} height={105} />
        )}
      </Link>

      <div className={styles.end}>
        <nav aria-label="Enquire" className={`${styles.list} ${styles.right}`}>
          {bookLinks.map((l) => (
            <NavItem key={l.href} link={l} current={l.href === currentHref} />
          ))}
        </nav>

        <BookButton />

        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={() => {
            setLeaving(false);
            setOpenCount((n) => n + 1);
            setOpen(true);
          }}
        >
          <span className={styles.sr}>Menu · Mga Pahina</span>
          <span className={styles.burger} aria-hidden="true" />
        </button>
      </div>

      {/* Rendered on <body>, not inside the header: pages put the header in
          stacking contexts of their own (Karaoke's sticky bar is z-index 3
          under a z-index 4 footer), which would trap the menu beneath them. */}
      {(open || leaving) &&
        createPortal(
          <div
            key={openCount}
            ref={dialogRef}
            id={dialogId}
            className={`${styles.overlay} ${open ? "" : styles.leaving}`}
            data-lenis-prevent
            role={open ? "dialog" : undefined}
            aria-modal={open ? "true" : undefined}
            aria-label={open ? "Site menu" : undefined}
            aria-hidden={open ? undefined : "true"}
            inert={!open}
          >
            <div className={styles.overlayBar}>
              <Link
                href="/"
                className={styles.overlayHome}
                aria-label="Bintang home"
                // Already home: no navigation happens, so close and hand focus back.
                onClick={window.location.pathname === "/" ? () => close() : () => hide()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small vector mark, no optimisation needed */}
                <img className={styles.overlayMark} src={MARK_SRC.paper} alt="" width={53} height={52} />
              </Link>
              <button type="button" className={styles.close} onClick={() => close()}>
                <span className={styles.sr}>Close menu · Isara</span>
                <span className={styles.cross} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="All pages" className={styles.overlayList}>
              {allLinks.map((l, i) => (
                <NavItem
                  key={l.href}
                  link={l}
                  index={i}
                  current={l.href === currentHref}
                  // Same-page link: no navigation happens, so hand focus back explicitly.
                  onClick={l.href === currentHref ? () => close() : () => hide()}
                />
              ))}
            </nav>
            <div className={styles.overlayFoot}>
              <p className={styles.overlayInfo}>
                <a href={site.mapUrl} target="_blank" rel="noopener noreferrer">
                  {site.street}
                  <span className={styles.sr}>, {site.postcode} (map, opens in a new tab)</span>
                </a>
                <a href={`tel:${site.phoneIntl}`}>{site.phone}</a>
              </p>
              <div className={styles.overlayEnd}>
                <ul aria-label="Follow Bintang" className={styles.socials}>
                  {socials.map((s) => (
                    <li key={s.name}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.social}>
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                          <path d={SOCIAL_ICON_PATHS[s.name]} fill="currentColor" />
                        </svg>
                        <span className={styles.sr}>{s.name} (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <BookButton />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
