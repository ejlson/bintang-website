"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Props = { src: string; className?: string };

const play = (v: HTMLVideoElement) => {
  try {
    // Autoplay can be refused (Low Power Mode, data saver): the still stays.
    void v.play()?.catch(() => {});
  } catch {}
};

/**
 * A short muted clip laid over its still (the caller renders the still
 * underneath, so this is decorative). It only downloads and plays while on
 * screen, fades in once it is actually playing, and isn't rendered at all for
 * reduced motion, where the still stays.
 */
export function LoopVideo({ src, className }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (typeof IntersectionObserver === "undefined") {
      play(v);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) play(v);
        else v.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  if (reduce !== false) return null;
  return (
    <video
      ref={ref}
      className={className}
      src={src}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      data-testid="loop-video"
      onPlaying={(e) => e.currentTarget.setAttribute("data-playing", "")}
    />
  );
}
