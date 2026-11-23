"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSaveData } from "@/lib/useSaveData";
import { HomeTitle, introClasses } from "./HomeTitle";
import styles from "./Hero.module.css";

export const HERO_LANDSCAPE = "/media/hero-loop.mp4";
export const HERO_PORTRAIT = "/media/hero-loop-portrait.mp4";
/** Must match the poster swap in Hero.module.css. */
export const PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)";

/**
 * Play or pause a muted inline video. If the browser refuses or can't play it
 * (autoplay policy, Low Power Mode, missing/unsupported file), `onBlocked` is
 * called so the controls show the true state.
 */
function setPlaying(video: HTMLVideoElement | null, playing: boolean, onBlocked: () => void) {
  if (!video) return;
  // Autoplay policies require the element to be muted before play().
  video.muted = true;
  if (!playing) {
    video.pause();
    return;
  }
  void video.play()?.catch((err: unknown) => {
    // AbortError only means a later pause()/load() interrupted this play().
    if (err instanceof DOMException && err.name === "AbortError") return;
    onBlocked();
  });
}

export function Hero() {
  // Both are null until hydration finishes; nothing moves until they're known.
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const preferenceKnown = reducedMotion !== null && saveData !== null;
  // Reduced motion and data-saver visitors start paused (and download no video
  // until they press play, via preload="none").
  const prefersStill = preferenceKnown ? reducedMotion || saveData : true;

  // null = visitor hasn't touched the control; follow their preferences.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? prefersStill;

  const heroRef = useRef<HTMLVideoElement>(null);
  const thumbRef = useRef<HTMLVideoElement>(null);
  // Latest paused state for the rotation handler, which subscribes once.
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    // During hydration preferences are unknown: leave the poster alone rather
    // than starting a download we might have to cancel.
    if (userPaused === null && !preferenceKnown) return;
    const onBlocked = () => setUserPaused(true);
    setPlaying(heroRef.current, !paused, onBlocked);
    setPlaying(thumbRef.current, !paused, onBlocked);
  }, [paused, userPaused, preferenceKnown]);

  // <source media> is only evaluated once, so swap files when a phone rotates.
  useEffect(() => {
    const video = heroRef.current;
    if (!video) return;
    const mql = window.matchMedia(PORTRAIT_QUERY);
    const sync = (portrait: boolean) => {
      const next = portrait ? HERO_PORTRAIT : HERO_LANDSCAPE;
      if (video.currentSrc.endsWith(next)) return;
      video.src = next;
      video.load();
      setPlaying(video, !pausedRef.current, () => setUserPaused(true));
    };
    // Chrome/Firefox 111–119 ignore <source media> and always take the first
    // (portrait) file; correct that once on mount if a source was already chosen.
    if (video.currentSrc) sync(mql.matches);
    const onChange = (e: MediaQueryListEvent) => sync(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <h1 id="home-title" className="sr-only">
        Welcome to Bintang — London’s oldest Filipino restaurant, Kentish Town since 1987
      </h1>

      {/* No poster attribute: the video is transparent until it has a frame,
          so the orientation-aware CSS background on .hero acts as the poster. */}
      <video
        ref={heroRef}
        className={`${styles.video} ${introClasses.film}`}
        muted
        loop
        playsInline
        preload={paused ? "none" : "metadata"}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="hero-video"
      >
        <source src={HERO_PORTRAIT} type="video/mp4" media={PORTRAIT_QUERY} />
        <source src={HERO_LANDSCAPE} type="video/mp4" />
      </video>
      <div className={styles.scrim} aria-hidden="true" />

      {/* Fixed label + aria-pressed: "Pause background video, pressed" = paused. */}
      <button
        type="button"
        className={`${styles.pause} ${introClasses.hud}`}
        aria-pressed={paused}
        aria-label="Pause background video"
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

      <Link href="/about" className={`${styles.thumb} ${introClasses.hud}`} aria-label="Watch our story">
        <video
          ref={thumbRef}
          src="/media/about-thumb.mp4"
          poster="/media/about-thumb-poster.jpg"
          muted
          loop
          playsInline
          preload={paused ? "none" : "metadata"}
          aria-hidden="true"
          tabIndex={-1}
        />
      </Link>

      <HomeTitle />
    </section>
  );
}
