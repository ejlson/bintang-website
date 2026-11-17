"use client";

import { usePathname } from "next/navigation";
import { getLenis, jumpTo } from "@/components/SmoothScroll";
import { ViewTransition, useEffect, useLayoutEffect, useRef, type ReactNode, type ViewTransitionInstance } from "react";

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

/** The Y translation of a computed `transform` (matrix or matrix3d); 0 for none. */
export function translateYOf(transform: string | undefined): number {
  const m = transform?.match(/^matrix(3d)?\(([^)]+)\)$/);
  if (!m) return 0;
  const values = m[2].split(",").map(Number);
  const y = m[1] ? values[13] : values[5];
  return Number.isFinite(y) ? y : 0;
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

type NavigationLike = {
  currentEntry: { key: string } | null;
  addEventListener(type: "currententrychange", fn: (e: Event & { navigationType?: string }) => void): void;
  removeEventListener(type: "currententrychange", fn: (e: Event & { navigationType?: string }) => void): void;
};

type HistoryWipeState = {
  /** Scroll position per history entry (Navigation API entry key). */
  positions: Record<string, number>;
  /** The entry whose page is on screen; scroll is recorded against it. */
  activeKey: string | null;
  /** Set between a back/forward and the commit that shows its page. */
  pendingKey: string | null;
  /** Pathname of the page on screen. */
  shownPath: string;
  nav: NavigationLike;
};

const SCROLL_STORE = "bintang:scroll";
const REPLAY = "__bintangReplay";

/**
 * Lets Back/Forward wipe like a link click.
 *
 * React commits a navigation made during the browser's popstate event at once
 * (so the browser's scroll restore lands on the new page), and that eager path
 * never starts a view transition. So we hold the real popstate back and hand
 * Next a copy on the next task, where it runs as an ordinary transition.
 *
 * The browser restores scroll straight after popstate, which would now hit the
 * old page, so scroll restoration is switched to manual and done here instead:
 * positions are kept per history entry and applied in the commit that shows
 * the page, before the incoming snapshot is taken.
 *
 * Skipped (plain cut, browser behaviour unchanged in spirit):
 *  - when the browser already animated the swipe itself (hasUAVisualTransition);
 *  - hash-only steps within the same page;
 *  - browsers without the Navigation API (no stable entry keys to save against).
 */
export function useHistoryWipe() {
  const pathname = usePathname();
  const stateRef = useRef<HistoryWipeState | null>(null);

  useEffect(() => {
    const nav = (window as Window & { navigation?: NavigationLike }).navigation;
    if (!nav?.currentEntry) return;

    let positions: Record<string, number> = {};
    try {
      positions = JSON.parse(sessionStorage.getItem(SCROLL_STORE) ?? "{}") ?? {};
    } catch {
      /* storage blocked or corrupt: start fresh */
    }
    const state: HistoryWipeState = {
      positions,
      activeKey: nav.currentEntry.key,
      pendingKey: null,
      shownPath: window.location.pathname,
      nav,
    };
    stateRef.current = state;

    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    // With manual restoration a reload no longer restores scroll by itself.
    const saved = state.activeKey ? positions[state.activeKey] : undefined;
    if (saved) jumpTo(saved);

    let frame = 0;
    let replayTimer: number | undefined;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (state.activeKey) state.positions[state.activeKey] = Math.round(window.scrollY);
      });
    };
    // Pushes and replaces (links, hash updates): the new entry is on screen.
    // Traversals are handled by onPop, once their page has actually rendered.
    const onEntryChange = (e: Event & { navigationType?: string }) => {
      if (e.navigationType === "traverse") return;
      state.activeKey = nav.currentEntry?.key ?? null;
    };
    const onPop = (e: PopStateEvent) => {
      if ((e as PopStateEvent & { [REPLAY]?: boolean })[REPLAY]) return;
      const key = nav.currentEntry?.key ?? null;
      const y = key ? (state.positions[key] ?? 0) : 0;
      if (window.location.pathname === state.shownPath) {
        // Same page (e.g. a menu tab in the hash): no wipe, just restore scroll.
        state.activeKey = key;
        requestAnimationFrame(() => {
          getLenis()?.resize();
          jumpTo(y);
        });
        return;
      }
      state.pendingKey = key;
      if ((e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) return;
      e.stopImmediatePropagation();
      // Next reads location.href when the replay runs, so a newer traversal that
      // lands first must replace this one, or its URL would pair with our state.
      clearTimeout(replayTimer);
      const replay = new PopStateEvent("popstate", { state: e.state });
      Object.defineProperty(replay, REPLAY, { value: true });
      replayTimer = window.setTimeout(() => window.dispatchEvent(replay));
    };
    const save = () => {
      try {
        sessionStorage.setItem(SCROLL_STORE, JSON.stringify(state.positions));
      } catch {
        /* storage full or blocked: positions just won't survive a reload */
      }
    };

    // Capture: on window this runs before Next's (bubble-phase) popstate listener.
    window.addEventListener("popstate", onPop, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    nav.addEventListener("currententrychange", onEntryChange);
    return () => {
      window.removeEventListener("popstate", onPop, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
      nav.removeEventListener("currententrychange", onEntryChange);
      cancelAnimationFrame(frame);
      clearTimeout(replayTimer);
      history.scrollRestoration = previousRestoration;
      stateRef.current = null;
    };
  }, []);

  // Runs in the commit that shows the new page, inside the view transition's
  // update, so the incoming snapshot is taken at the restored position.
  useLayoutEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    state.shownPath = pathname;
    const key = state.pendingKey;
    if (key === null) return; // link navigation: Next handles its own scroll
    state.pendingKey = null;
    const current = state.nav.currentEntry?.key ?? null;
    state.activeKey = current;
    // A link click (or another traversal) can overtake a slow Back; then this
    // commit shows some other entry, which keeps Next's scroll handling.
    if (key !== current) return;
    // Through Lenis, so a glide still in flight can't drag the page back. It
    // re-measures first: its size is still the previous page's, which would
    // clamp the jump short of a spot further down this one.
    getLenis()?.resize();
    jumpTo(state.positions[key] ?? 0);
  }, [pathname]);
}

/** Mounted once in the root layout; renders nothing. */
export function HistoryWipe() {
  useHistoryWipe();
  return null;
}
