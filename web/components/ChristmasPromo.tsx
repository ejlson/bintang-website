"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BOOKING_URL } from "@/lib/nav";
import {
  CHRISTMAS_ART,
  CHRISTMAS_MINI,
  CHRISTMAS_PROMO_KEY,
  PROMO_DELAY_MS,
} from "@/lib/promo";
import { getLenis } from "./SmoothScroll";
import styles from "./ChristmasPromo.module.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Must match the exit animation in ChristmasPromo.module.css. */
const LEAVE_MS = 200;

/** Has the Home title intro finished, or been skipped? (lib/homeIntro: "skip" is also its end state.) */
const introDone = () => document.documentElement.dataset.homeIntro === "skip";

/** Another dialog (the phone nav menu, say) is open: the pop-up waits rather than stacking over it. */
const otherDialogOpen = () =>
  document.querySelector('[aria-modal="true"]') !== null;
/** How often to look again while another dialog is open. */
const RETRY_MS = 500;

/** Remember that the pop-up has been seen this visit, so it doesn't open by itself again. */
function markSeen() {
  try {
    sessionStorage.setItem(CHRISTMAS_PROMO_KEY, "1");
  } catch {
    // Storage blocked: opening once is still fine.
  }
}

/**
 * The Christmas 2026 pop-up on Home and the corner mini that reopens it
 * (SPEC.md › Christmas 2026 promotion). Hero renders this only while the
 * promotion is live. The pop-up opens by itself once per visit, after the title
 * intro; the mini sits where the About thumbnail usually is.
 */
export function ChristmasPromo({
  hudClassName = "",
  still = false,
}: {
  hudClassName?: string;
  /** Freeze the mini's twinkle and sway (the hero film is paused: WCAG 2.2.2). */
  still?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // After closing, the dialog stays mounted (inert, hidden) just long enough to fade out.
  const [leaving, setLeaving] = useState(false);
  const miniRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Set once the pop-up has opened this visit (by itself or from the mini), so
  // a pending automatic open never pops it up again right after it was closed.
  const seenRef = useRef(false);

  const show = useCallback(() => {
    seenRef.current = true;
    markSeen();
    setLeaving(false);
    setOpen(true);
  }, []);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    setLeaving(!window.matchMedia(REDUCED_MOTION_QUERY).matches);
    if (returnFocus) miniRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => setLeaving(false), LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);

  // Open by itself once per visit, once the title intro is out of the way.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHRISTMAS_PROMO_KEY)) return;
    } catch {
      return; // Storage blocked: it couldn't stop reopening on every visit to Home, so leave it to the mini.
    }
    let timer = 0;
    const attempt = () => {
      if (seenRef.current) return; // Already opened from the mini.
      if (otherDialogOpen()) {
        timer = window.setTimeout(attempt, RETRY_MS);
        return;
      }
      show();
    };
    const schedule = () => {
      if (timer || !introDone()) return;
      timer = window.setTimeout(attempt, PROMO_DELAY_MS);
    };
    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-home-intro"],
    });
    return () => {
      mo.disconnect();
      window.clearTimeout(timer);
    };
  }, [show]);

  // While open: lock page scroll, move focus to ×, trap Tab, close on Esc.
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    closeRef.current?.focus();
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) ?? [],
      );

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
    <>
      <button
        ref={miniRef}
        type="button"
        className={`${styles.mini} ${hudClassName}`}
        data-still={still || undefined}
        aria-haspopup="dialog"
        aria-label="Christmas at Bintang: see the offer"
        onClick={show}
      >
        {/* A bauble hanging from the corner: thread, gold cap with holly, gold-rimmed ball, twinkling stars. */}
        <span className={styles.ornament} aria-hidden="true">
          <span className={styles.thread} />
          <span className={styles.cap} />
          <svg className={styles.holly} viewBox="0 0 40 30">
            <path
              d="M18 16 C10 4, 2 10, 0 6 C2 14, 6 14, 4 20 C10 18, 14 22, 18 16 Z"
              fill="#1D7A3E"
              stroke="#0F4A24"
              strokeWidth="1"
            />
            <path
              d="M22 16 C30 4, 38 10, 40 6 C38 14, 34 14, 36 20 C30 18, 26 22, 22 16 Z"
              fill="#2E8A4E"
              stroke="#0F4A24"
              strokeWidth="1"
            />
            <circle cx="17" cy="19" r="3.4" fill="#D92E36" />
            <circle cx="23" cy="19" r="3.4" fill="#C8202A" />
            <circle cx="20" cy="14" r="3.4" fill="#E6414A" />
          </svg>
          <span className={styles.ball}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a tiny, pre-cropped still */}
            <img
              src={CHRISTMAS_MINI.src}
              alt=""
              width={CHRISTMAS_MINI.width}
              height={CHRISTMAS_MINI.height}
            />
          </span>
          {[styles.star1, styles.star2, styles.star3].map((pos) => (
            <svg
              key={pos}
              className={`${styles.star} ${pos}`}
              viewBox="0 0 20 20"
            >
              <polygon
                points="10,0 12.4,7.6 20,10 12.4,12.4 10,20 7.6,12.4 0,10 7.6,7.6"
                fill="#FFF4C2"
              />
            </svg>
          ))}
        </span>
      </button>

      {/* Rendered on <body>, above the header and the hero's stacking context. */}
      {(open || leaving) &&
        createPortal(
          <div
            ref={dialogRef}
            className={`${styles.root} ${open ? "" : styles.leaving}`}
            data-lenis-prevent
            role={open ? "dialog" : undefined}
            aria-modal={open ? "true" : undefined}
            aria-labelledby={open ? titleId : undefined}
            aria-hidden={open ? undefined : "true"}
            inert={!open}
          >
            <div
              className={styles.veil}
              aria-hidden="true"
              onClick={() => close()}
            />
            <div className={styles.card}>
              <h2 id={titleId} className="sr-only">
                Christmas at Bintang
              </h2>
              <a
                className={styles.art}
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- fixed artwork, already sized and compressed */}
                <img
                  src={CHRISTMAS_ART.src}
                  alt={CHRISTMAS_ART.alt}
                  width={CHRISTMAS_ART.width}
                  height={CHRISTMAS_ART.height}
                />{" "}
                <span className="sr-only">
                  Book a table on OpenTable (opens in a new tab)
                </span>
              </a>
              <div className={styles.bar}>
                <p className={styles.when}>
                  Christmas at Bintang
                  <small>Group set menu £47 · Sharing set menu £42</small>
                </p>
                <Link
                  href="/menu#christmas"
                  className={styles.link}
                  onClick={() => close(false)}
                >
                  See the Christmas menus
                </Link>
                <a
                  className={styles.book}
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book your feast{" "}
                  <span className="sr-only">
                    on OpenTable (opens in a new tab)
                  </span>
                </a>
              </div>
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                aria-label="Close"
                onClick={() => close()}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    d="M2 2l12 12M14 2L2 14"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  />
                </svg>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
