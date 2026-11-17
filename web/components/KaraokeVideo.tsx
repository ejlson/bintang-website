"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSaveData } from "@/lib/useSaveData";
import styles from "./MenuPage.module.css";

/** Stand-in until karaoke footage is shot: the Home hero loop. */
export const KARAOKE_VIDEO = "/media/hero-loop.mp4";
export const KARAOKE_POSTER = "/media/hero-poster.jpg";

/**
 * Muted looping video for the Karaoke tab, with karaoke-style subtitles and a
 * pause control (motion over 5s needs one: WCAG 2.2.2). Reduced-motion and
 * data-saver visitors start paused and download nothing until they press play.
 */
type Props = {
  /** The visitor's own play/pause choice (null = untouched), kept by the parent so it survives tab switches. */
  userPaused: boolean | null;
  onUserPausedChange: (paused: boolean) => void;
};

export function KaraokeVideo({ userPaused, onUserPausedChange: setUserPaused }: Props) {
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const preferenceKnown = reducedMotion !== null && saveData !== null;
  const prefersStill = preferenceKnown ? reducedMotion || saveData : true;

  // null = untouched; follow the visitor's preferences.
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
  }, [paused, userPaused, preferenceKnown, setUserPaused]);

  return (
    <figure className={styles.video}>
      <video
        ref={ref}
        src={KARAOKE_VIDEO}
        poster={KARAOKE_POSTER}
        muted
        loop
        playsInline
        preload={paused ? "none" : "metadata"}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="karaoke-video"
      />
      <div className={styles.videoScrim} aria-hidden="true" />
      <figcaption className={styles.videoSubs} aria-hidden="true">
        <span>♪ Let’s sing! ♪</span>
        <span lang="tl">♪ Kantahan na! ♪</span>
      </figcaption>
      <button
        type="button"
        className={styles.videoPause}
        aria-pressed={paused}
        aria-label="Pause karaoke video"
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
