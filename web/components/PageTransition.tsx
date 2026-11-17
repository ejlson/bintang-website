"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, useEffect, type ReactNode, type ViewTransitionInstance } from "react";

/** Transition type set on links that open a journal post (see JournalPage). */
export const OPEN_POST = "open-post";

/**
 * Film-cut page wipe (after MáLà Project): the outgoing page is masked away to
 * reveal the new one already sitting underneath. The wipe is chosen by the page
 * being left, so each page exits in its own way:
 *  - /menu           → slanted wipe
 *  - everything else → top-to-bottom wipe (bottom-to-top on phones, in CSS)
 * Opening a journal post from the list is an iris instead (OPEN_POST type).
 * Keyframes live in app/globals.css under "Page transitions".
 */
export function exitWipeFor(pathname: string): string {
  if (pathname === "/menu" || pathname.startsWith("/menu/")) return "wipe-slant";
  return "wipe-down";
}

/**
 * The outgoing snapshot is the whole page, which can be many screens tall, but
 * the wipe should cross the screen. When the exit starts, the snapshot's group
 * has been placed where the page sat on screen (translateY = -scrolled
 * distance), so read that and hand the mask its offset via --vt-y on <html>.
 * Reading it here rather than on click/popstate means it is right however the
 * navigation began: links, back/forward with the browser's scroll restore,
 * slow loads the user scrolled during, or router.push.
 */
/** The Y translation of a computed `transform` (matrix or matrix3d); 0 for none. */
export function translateYOf(transform: string | undefined): number {
  const m = transform?.match(/^matrix(3d)?\(([^)]+)\)$/);
  if (!m) return 0;
  const values = m[2].split(",").map(Number);
  const y = m[1] ? values[13] : values[5];
  return Number.isFinite(y) ? y : 0;
}

export function alignWipeToScreen(instance: ViewTransitionInstance): void {
  const pseudo = instance as ViewTransitionInstance & { group?: { getComputedStyle(): CSSStyleDeclaration } };
  const transform = pseudo.group?.getComputedStyle().transform;
  const y = translateYOf(transform);
  document.documentElement.style.setProperty("--vt-y", `${Math.round(-y)}px`);
}

/**
 * Used as the route template (app/template.tsx and the nested ones), not in the
 * layout: Next mounts a template per route segment and keeps recent routes
 * alive but hidden for back/forward, so each page gets a real exit + enter
 * without throwing that saved state away.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition
      exit={{ [OPEN_POST]: "wipe-iris", default: exitWipeFor(pathname) }}
      enter="page-under"
      default="none"
      onExit={alignWipeToScreen}
    >
      {children}
    </ViewTransition>
  );
}

/**
 * Marks <html> with data-ua-transition when the browser has already animated a
 * back/forward swipe itself (iOS Safari, Android predictive back), so the CSS
 * turns our wipe into a plain cut instead of playing it on top. The next click
 * clears it.
 */
export function useSwipeBackGuard() {
  useEffect(() => {
    const root = document.documentElement;
    const onClick = () => {
      delete root.dataset.uaTransition;
    };
    const onPop = (e: PopStateEvent) => {
      if ((e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) {
        root.dataset.uaTransition = "";
      } else {
        delete root.dataset.uaTransition;
      }
    };
    // Capture phase: runs before Next's own handlers start the navigation.
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop, true);
    };
  }, []);
}

/** Mounted once in the root layout; renders nothing. */
export function SwipeBackGuard() {
  useSwipeBackGuard();
  return null;
}
