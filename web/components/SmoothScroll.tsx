"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

let instance: Lenis | null = null;

/** The running Lenis instance, or null (server, reduced motion, before mount). */
export function getLenis(): Lenis | null {
  return instance;
}

/**
 * Jump the page to `top` with no easing. Goes through Lenis when it is running
 * so its own target doesn't drag the page back mid-glide.
 */
export function jumpTo(top: number): void {
  if (instance) instance.scrollTo(top, { immediate: true, force: true });
  else window.scrollTo({ top });
}

/**
 * Smooth (eased) window scrolling via Lenis. Mounted once in the root layout;
 * renders nothing. Off when the visitor asks for reduced motion, so they get
 * the browser's native scroll. Touch keeps native scrolling (Lenis default).
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (reduced !== false) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.1 });
    instance = lenis;
    return () => {
      lenis.destroy();
      if (instance === lenis) instance = null;
    };
  }, [reduced]);

  // A route change hands the scroll position to Next (top of the new page, or
  // the restored spot on back/forward). Drop any glide still in flight so Lenis
  // picks up from there instead of finishing the old page's scroll.
  useEffect(() => {
    const lenis = instance;
    if (!lenis || lenis.isStopped) return;
    lenis.stop();
    lenis.start();
  }, [pathname]);

  return null;
}
