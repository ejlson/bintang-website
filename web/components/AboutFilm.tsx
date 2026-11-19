"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSaveData } from "@/lib/useSaveData";
import styles from "./AboutPage.module.css";

export const ABOUT_FILM = "/media/about/film.mp4";
export const ABOUT_FILM_POSTER = "/media/about/film-poster.jpg";

/**
 * The then-and-now film: muted, looping, portrait. Like the Home hero and the
 * Karaoke video it has a pause control (motion over 5s needs one: WCAG 2.2.2),
 * and reduced-motion and data-saver visitors start paused and download nothing
 * until they press play.
 */
export function AboutFilm() {
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const preferenceKnown = reducedMotion !== null && saveData !== null;
  const prefersStill = preferenceKnown ? reducedMotion || saveData : true;

  // null = untouched; follow the visitor's preferences.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? prefersStill;
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || (userPaused === null && !preferenceKnown)) return;
    video.muted = true;
    if (paused) {
      video.pause();
      return;
    }
    void video.play()?.catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Autoplay refused or file unplayable: show the true state.
      setUserPaused(true);
    });
  }, [paused, userPaused, preferenceKnown]);

  return (
    <figure className={styles.film}>
      <div className={styles.filmFrame}>
        <video
          ref={ref}
          src={ABOUT_FILM}
          poster={ABOUT_FILM_POSTER}
          muted
          loop
          playsInline
          preload={paused ? "none" : "metadata"}
          aria-hidden="true"
          tabIndex={-1}
          data-testid="about-film"
        />
        <button
          type="button"
          className={styles.filmPause}
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
      </div>
      <figcaption className={styles.cap}>
        Then and now · <span lang="tl">Noon at ngayon</span>
      </figcaption>
    </figure>
  );
}
