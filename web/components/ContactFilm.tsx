"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSaveData } from "@/lib/useSaveData";
import styles from "./ContactPage.module.css";

export const CONTACT_FILM = "/media/hero-loop-portrait.mp4";
export const CONTACT_FILM_POSTER = "/media/hero-poster-portrait.jpg";

/** The column the film sits in is hidden at 900px and below (ContactPage.module.css). */
const SHOWN = "(min-width: 901px)";

function subscribeShown(onChange: () => void) {
  const mql = window.matchMedia(SHOWN);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const isShown = () => window.matchMedia(SHOWN).matches;

/**
 * The Home film's portrait loop in the Contact page's left column, cropped to
 * the box the photo had. Muted and looping with a pause control (WCAG 2.2.2),
 * like the About and Karaoke films. Reduced-motion and data-saver visitors
 * start paused on the poster and download nothing until they press play, and
 * nothing downloads on narrow screens, where the column is hidden.
 */
export function ContactFilm() {
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const preferenceKnown = reducedMotion !== null && saveData !== null;
  const prefersStill = preferenceKnown ? reducedMotion || saveData : true;

  const shown = useSyncExternalStore(subscribeShown, isShown, () => false);

  // null = untouched; follow the visitor's preferences.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? prefersStill;
  const playing = shown && !paused;
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || (userPaused === null && !preferenceKnown)) return;
    video.muted = true;
    if (!playing) {
      video.pause();
      return;
    }
    void video.play()?.catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Autoplay refused or file unplayable: show the true state.
      setUserPaused(true);
    });
  }, [playing, userPaused, preferenceKnown]);

  return (
    <figure className={styles.photo}>
      <video
        ref={ref}
        src={CONTACT_FILM}
        poster={CONTACT_FILM_POSTER}
        muted
        loop
        playsInline
        preload={playing ? "metadata" : "none"}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="contact-film"
      />
      <figcaption>93 Kentish Town Road · since 1987</figcaption>
      <button
        type="button"
        className={styles.pause}
        aria-pressed={paused}
        aria-label="Pause film"
        onClick={() => setUserPaused(!paused)}
      >
        {paused ? (
          <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
            <path d="M1 1l10 6-10 6z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
            <rect x="0" y="0" width="3" height="12" fill="currentColor" />
            <rect x="7" y="0" width="3" height="12" fill="currentColor" />
          </svg>
        )}
      </button>
    </figure>
  );
}
