"use client";

import { getLenis } from "./SmoothScroll";

/** Scrolls to the top (eased by Lenis when it's on), then hands focus to the home mark. */
export function BackToTop({ className }: { className?: string }) {
  function toTop() {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>('a[aria-label="Bintang home"]')?.focus({ preventScroll: true });
  }

  return (
    <button type="button" className={className} onClick={toTop}>
      Back to top <span aria-hidden="true">↑</span>
    </button>
  );
}
