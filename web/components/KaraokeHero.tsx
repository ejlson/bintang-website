"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSaveData } from "@/lib/useSaveData";
import { Subtitles } from "./Subtitles";
import styles from "./KaraokePage.module.css";

export const KARAOKE_LANDSCAPE = "/media/karaoke/karaoke-loop.mp4";
export const KARAOKE_PORTRAIT = "/media/karaoke/karaoke-loop-portrait.mp4";
/** Must match the poster swap in KaraokePage.module.css. */
const PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)";

/** Play or pause a muted inline video; `onBlocked` when the browser refuses. */
function setPlaying(video: HTMLVideoElement | null, playing: boolean, onBlocked: () => void) {
  if (!video) return;
  video.muted = true;
  if (!playing) {
    video.pause();
    return;
  }
  void video.play()?.catch((err: unknown) => {
    if (err instanceof DOMException && err.name === "AbortError") return;
    onBlocked();
  });
}

/**
 * The Karaoke stage: a full-bleed, full-screen loop of the karaoke room (cut from the
 * Home film), pinned (sticky) while the page's information and then the footer scroll up
 * over it. The Home page's videoke subtitles play until the visitor scrolls; then they
 * fade out and pause, and the room dims so the yellow information reads over it.
 * One button pauses the video and the subtitles (WCAG 2.2.2). Like the
 * Home hero, reduced-motion and data-saver visitors start paused on the poster and
 * download no video until they press play.
 */
export function KaraokeHero() {
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const preferenceKnown = reducedMotion !== null && saveData !== null;
  const prefersStill = preferenceKnown ? reducedMotion || saveData : true;

  // null = untouched; follow the visitor's preferences.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? prefersStill;

  // Scrolled 40% of a screen: the subtitles have faded out (the fade ends at 35%), so take
  // them off the page. Unmounting also wipes their sakuga effects layer, which would
  // otherwise freeze mid-effect over the information. Back at the top they start again.
  const [away, setAway] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      setAway(window.scrollY > window.innerHeight * 0.4);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const ref = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (userPaused === null && !preferenceKnown) return;
    setPlaying(ref.current, !paused, () => setUserPaused(true));
  }, [paused, userPaused, preferenceKnown]);

  // <source media> is only read once, so swap files when a phone rotates.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const mql = window.matchMedia(PORTRAIT_QUERY);
    const sync = (portrait: boolean) => {
      const next = portrait ? KARAOKE_PORTRAIT : KARAOKE_LANDSCAPE;
      if (video.currentSrc.endsWith(next)) return;
      video.src = next;
      video.load();
      setPlaying(video, !pausedRef.current, () => setUserPaused(true));
    };
    if (video.currentSrc) sync(mql.matches);
    const onChange = (e: MediaQueryListEvent) => sync(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <section className={styles.hero} aria-label="Karaoke at Bintang">
      {/* No poster attribute: the orientation-aware background on .hero shows through until a frame arrives. */}
      <video
        ref={ref}
        className={styles.video}
        muted
        loop
        playsInline
        preload={paused ? "none" : "metadata"}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="karaoke-video"
      >
        <source src={KARAOKE_PORTRAIT} type="video/mp4" media={PORTRAIT_QUERY} />
        <source src={KARAOKE_LANDSCAPE} type="video/mp4" />
      </video>
      <div className={styles.shade} aria-hidden="true" />

      <div className={`${styles.subs} ${away ? styles.away : ""}`} data-testid="karaoke-subtitles">
        {!away && <Subtitles paused={paused} />}
      </div>

      {/* The room dims once the visitor scrolls, so the yellow information reads over it. */}
      <div className={`${styles.dim} ${away ? styles.in : ""}`} aria-hidden="true" data-testid="karaoke-dim" />

      {/* Fixed label + aria-pressed: "Pause video, pressed" = paused. */}
      <button
        type="button"
        className={styles.pause}
        aria-pressed={paused}
        aria-label="Pause video"
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
    </section>
  );
}
