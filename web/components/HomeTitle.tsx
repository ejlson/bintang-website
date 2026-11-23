"use client";

import { useId, useLayoutEffect } from "react";
import { INTRO_MS, LOAD_MIN_MS, decideIntro, startPlay } from "@/lib/homeIntro";
import { ART, BODY_CLIP, PIVOT, TAIL_CLIP, VIEWBOX } from "./FooterLion";
import styles from "./HomeTitle.module.css";

/** Classes the Hero uses to hold its chrome back while the title runs (app/page.tsx imports the module for `home`). */
export const introClasses = { hud: styles.hud, film: styles.film };

// The loader's hand-over after a client-side navigation (see the effect).
let loadingTimer = 0;
// When HomeTitle last went away (unmounted, or hidden by the router); null if never.
let leftAt: number | null = null;

/**
 * Home loader and "Welcome to Bintang" poster title (Intro A on the design
 * canvas). Loading: on black, the full red lion, its tail swinging like the
 * footer's, over a red loading ring, until the site is ready (lib/homeIntro
 * decides when). Then the lion dissolves away, the black fades up slowly on
 * the dimmed film, the red title smash-cuts in word by word with its billing,
 * holds, then all cuts out at once as the film brightens, and the header
 * drops in and the pause button and thumbnail rise in. All CSS, keyed
 * off <html data-home-intro>; this component only decides (after a client-side
 * navigation), ends and skips it. Any click, tap or key press skips to the end.
 * Decorative: the H1 carries the words.
 */
export function HomeTitle() {
  const uid = useId().replace(/[^\w-]/g, "");
  const clipIds = { body: `intro-lion-body-${uid}`, tail: `intro-lion-tail-${uid}` };

  useLayoutEffect(() => {
    const root = document.documentElement;
    const now = performance.now();
    const read = () => root.dataset.homeIntro;
    let state = read();
    if (state !== "load" && state !== "play" && state !== "skip") {
      // Client-side navigation to Home: the site is already loaded, so the
      // loader only shows for its minimum before the sequence starts.
      state = root.dataset.homeIntro = decideIntro();
      if (state === "load") loadingTimer = window.setTimeout(startPlay, LOAD_MIN_MS);
    }
    // Back on Home after leaving mid-intro (the router hid the page, which
    // restarts its CSS): don't replay it. A dev StrictMode remount is instant.
    if (state !== "skip" && leftAt !== null && now - leftAt > 50) state = root.dataset.homeIntro = "skip";
    if (state === "skip") return;

    let endTimer = 0;
    const finish = () => {
      window.clearTimeout(loadingTimer);
      root.dataset.homeIntro = "skip";
    };
    // Once playing (now, or when the loader hands over), end at INTRO_MS from
    // the moment it started.
    const onState = () => {
      if (read() !== "play" || endTimer) return;
      const at = Number.parseFloat(root.dataset.homeIntroAt ?? "");
      const t = performance.now();
      const startedAt = Number.isFinite(at) && at <= t ? at : t;
      endTimer = window.setTimeout(finish, Math.max(0, INTRO_MS - (t - startedAt)));
    };
    onState();
    const watch = new MutationObserver(onState);
    watch.observe(root, { attributes: true, attributeFilter: ["data-home-intro"] });
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);
    return () => {
      leftAt = performance.now();
      watch.disconnect();
      window.clearTimeout(endTimer);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, []);

  return (
    <div className={styles.title} aria-hidden="true" data-testid="home-title">
      <div className={styles.dim} />
      <div className={styles.poster}>
        <div className={styles.stack}>
          <p className={`${styles.cut} ${styles.d1} ${styles.credit}`}>
            Brought to you by
            <br />
            <span className={styles.creditName}>Maginhawa Group</span>
          </p>
          <p className={`${styles.cut} ${styles.d2} ${styles.word} ${styles.welcome}`}>Welcome</p>
          <div className={styles.row}>
            <p className={`${styles.cut} ${styles.d4} ${styles.side} ${styles.sideLeft}`}>
              Since
              <br />
              1987
            </p>
            <p className={`${styles.cut} ${styles.d3} ${styles.word} ${styles.to}`}>To</p>
            <p className={`${styles.cut} ${styles.d4} ${styles.side}`}>
              Kentish
              <br />
              Town
            </p>
          </div>
          <p className={`${styles.cut} ${styles.d5} ${styles.word} ${styles.bintang}`}>Bintang</p>
          {/* Invisible twin of the credit, so the stack's middle is TO, not above it. */}
          <p className={`${styles.credit} ${styles.balance}`}>
            Brought to you by
            <br />
            <span className={styles.creditName}>Maginhawa Group</span>
          </p>
        </div>
        <p className={`${styles.cut} ${styles.d6} ${styles.billing}`}>
          A Maginhawa picture · Maligayang pagdating · London’s oldest Filipino restaurant
          <br />
          Kain tayo · Kantahan · Brunch · Karaoke · Private hire · Kentish Town
        </p>
      </div>
      <div className={styles.black} />
      <div className={styles.lionStage}>
        <svg className={styles.lion} viewBox={VIEWBOX} fill="currentColor">
          <defs>
            <clipPath id={clipIds.body}>
              <path clipRule="evenodd" d={BODY_CLIP} />
            </clipPath>
            <clipPath id={clipIds.tail}>
              <polygon points={TAIL_CLIP} />
            </clipPath>
          </defs>
          <use href={ART} clipPath={`url(#${clipIds.body})`} />
          {/* Moved to the pivot, turned, moved back: the tail turns on its base. */}
          <g transform={`translate(${PIVOT[0]} ${PIVOT[1]})`}>
            <g className={styles.tail}>
              <g transform={`translate(${-PIVOT[0]} ${-PIVOT[1]})`}>
                <use href={ART} clipPath={`url(#${clipIds.tail})`} />
              </g>
            </g>
          </g>
        </svg>
        <div className={styles.spinner} />
      </div>
    </div>
  );
}
