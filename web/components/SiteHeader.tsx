"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { allLinks, bookLinks, exploreLinks, type NavLink } from "@/lib/nav";
import { site } from "@/lib/site";
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
  /** Highlights the current page's link. */
  currentHref?: string;
};

/** Matches the CSS breakpoint where the split nav replaces the menu button. */
const DESKTOP_QUERY = "(width >= 768px)";

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
  /** Overlay rows only: numbered 01, 02… and staggered in. */
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
      <span className={styles.tl} lang="tl">
        {link.tl}
      </span>
    </Link>
  );
}

export function SiteHeader({ variant = "overlay", tone = "paper", mark = "red", currentHref }: Props) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const markRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  const close = useCallback(() => {
    setOpen(false);
    // The toggle is hidden at desktop widths; focus the home mark there instead
    // so focus never drops to <body>.
    const desktop = window.matchMedia(DESKTOP_QUERY).matches;
    (desktop ? markRef.current : toggleRef.current)?.focus();
  }, []);

  // If the screen widens past the phone breakpoint while open (e.g. a tablet
  // rotates), the overlay no longer belongs: close it.
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) close();
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
    focusables()[0]?.focus();

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
        <img src={MARK_SRC[mark]} alt="" width={53} height={52} />
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
          onClick={() => setOpen(true)}
        >
          <span className={styles.sr}>Menu · Mga Pahina</span>
          <span className={styles.burger} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div ref={dialogRef} id={dialogId} className={styles.overlay} data-lenis-prevent role="dialog" aria-modal="true" aria-label="Site menu">
          <div className={styles.overlayBar}>
            {/* eslint-disable-next-line @next/next/no-img-element -- small vector mark, no optimisation needed */}
            <img className={styles.overlayMark} src={MARK_SRC.paper} alt="" width={53} height={52} />
            <button type="button" className={styles.close} onClick={close}>
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
                onClick={l.href === currentHref ? close : () => setOpen(false)}
              />
            ))}
          </nav>
          <div className={styles.overlayFoot}>
            <BookButton />
            <p className={styles.overlayInfo}>
              <a href={site.mapUrl} target="_blank" rel="noopener noreferrer">
                {site.street}, {site.postcode}
                <span className={styles.sr}> (map, opens in a new tab)</span>
              </a>
              <a href={`tel:${site.phoneIntl}`}>{site.phone}</a>
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
