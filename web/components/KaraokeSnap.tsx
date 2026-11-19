"use client";

import Snap from "lenis/snap";
import { useEffect, useRef } from "react";
import { onLenis } from "./SmoothScroll";
import styles from "./KaraokePage.module.css";

/**
 * A marker where the information starts, plus scroll assistance: when the
 * visitor stops near the top or near the view where the information has come to rest at
 * the foot of the video, the page eases the rest of the way there (Lenis snap,
 * "proximity", so free scrolling elsewhere is left alone). Only while Lenis runs: not for
 * reduced motion, and touch keeps native scrolling.
 */
export function KaraokeSnap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let snap: Snap | null = null;
    let removers: (() => void)[] = [];

    const points = () => {
      const spacer = ref.current;
      const info = spacer?.nextElementSibling as HTMLElement | null;
      if (!spacer || !info) return [0];
      // The information comes to rest when its top reaches its sticky offset.
      const restAt = spacer.offsetTop + spacer.offsetHeight - (parseFloat(getComputedStyle(info).top) || 0);
      return [0, Math.max(0, Math.round(restAt))];
    };

    const place = () => {
      if (!snap) return;
      removers.forEach((remove) => remove());
      removers = points().map((y) => snap!.add(y));
    };

    const stop = onLenis((lenis) => {
      snap?.destroy();
      snap = null;
      removers = [];
      if (!lenis) return;
      snap = new Snap(lenis, {
        type: "proximity",
        distanceThreshold: "45%",
        duration: 1.2,
        // Ease out (quint): a soft, slowing glide into place.
        easing: (t) => 1 - Math.pow(1 - t, 5),
        debounce: 200,
      });
      place();
    });

    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      stop();
      snap?.destroy();
    };
  }, []);

  return <div ref={ref} className={styles.spacer} aria-hidden="true" data-testid="karaoke-spacer" />;
}
