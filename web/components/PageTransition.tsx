"use client";

import { usePathname } from "next/navigation";
import { getLenis, jumpTo } from "@/components/SmoothScroll";
import { ViewTransition, useEffect, useLayoutEffect, useRef, type ReactNode, type ViewTransitionInstance } from "react";

/** Transition type set on links that open a journal post (see JournalPage). */
export const OPEN_POST = "open-post";

/** The wipe shapes in app/globals.css ("Page transitions"), set as data-wipe on <html>. */
export type WipeShape = "down" | "split" | "slant" | "iris";

const isMenu = (path: string) => path === "/menu" || path.startsWith("/menu/");

/**
 * Film-cut page wipe (after MáLà Project): the outgoing page is masked away at
 * a steady pace to reveal the new one, already finished, underneath. As on
 * their site the cut depends on the move:
 *  - opening a journal post from the list → iris from the centre (OPEN_POST)
 *  - leaving Home                          → split from the centre outwards
 *  - to or from the Menu                   → soft diagonal from the top-right
 *  - anything else                         → top-to-bottom wipe
 * Phones get a bottom-to-top wipe for everything but the iris (in CSS).
 */
export function wipeShapeFor(from: string, to: string, types: readonly string[] = []): WipeShape {
  if (types.includes(OPEN_POST)) return "iris";
  if (from === "/") return "split";
  if (isMenu(from) || isMenu(to)) return "slant";
  return "down";
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
 *
 * The shape is picked in onExit, when both ends are known: `pathname` is still
 * this (outgoing) page's, and the address bar already shows the destination.
 * At that moment every shape is still fully opaque, so nothing flashes.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition
      exit="page-out"
      enter="page-under"
      default="none"
      onExit={(instance, types) => {
        alignWipeToScreen(instance);
        document.documentElement.dataset.wipe = wipeShapeFor(pathname, window.location.pathname, types);
      }}
    >
      {children}
    </ViewTransition>
  );
}

/** Length of the wipe in app/globals.css (page-wipe and friends run 0.8s). */
const WIPE_MS = 800;

/** Until when (performance.now()) content that streams in late is settled too. */
let settleWindowEnd = Number.NEGATIVE_INFINITY;

/**
 * Whether a page wipe is under way: we're inside its update or it's animating.
 * document.activeViewTransition says so exactly where the browser has it;
 * otherwise fall back to whether the browser can run one at all.
 */
export function wipeRunning(doc: Document = document): boolean {
  const active = (doc as Document & { activeViewTransition?: unknown }).activeViewTransition;
  if (active !== undefined) return active !== null;
  return typeof (doc as Document & { startViewTransition?: unknown }).startViewTransition === "function";
}

/**
 * Put inside a Suspense boundary on a page: content that streams in while the
 * wipe is still running (e.g. a journal post whose article wasn't prefetched)
 * is shown finished too, instead of building itself under the iris. Content
 * that arrives after the wipe keeps its entrance.
 */
export function SettleOnReveal() {
  useLayoutEffect(() => {
    if (performance.now() < settleWindowEnd) settleEntrances();
  }, []);
  return null;
}

/**
 * Fast-forwards the timed entrance animations of a page that has just arrived
 * by in-app navigation, so the wipe uncovers a finished page as on MáLà's site
 * rather than an empty one that then builds itself. Called in the commit that
 * shows the page, before its snapshot is taken. Only touches CSS animations on
 * the document timeline that are finite and have only just started: the
 * scroll-driven reveals, endless loops and anything mid-flight are left alone.
 * A first visit or a reload never calls this, so those still get the entrance.
 */
export function settleEntrances(doc: Document = document): void {
  if (typeof doc.getAnimations !== "function") return;
  for (const animation of doc.getAnimations()) {
    if (animation.constructor.name !== "CSSAnimation") continue;
    if (animation.timeline !== doc.timeline) continue;
    const effect = animation.effect as KeyframeEffect | null;
    if (!effect || effect.pseudoElement?.startsWith("::view-transition")) continue;
    if (effect.getComputedTiming().iterations === Infinity) continue;
    const elapsed = Number(animation.currentTime ?? 0);
    if (elapsed > 50 || animation.playState === "finished") continue;
    animation.finish();
  }
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

  // On a route change with a wipe under way, show the new page finished.
  // Compared against the last path rather than a first-render flag so React's
  // development double-run on mount can't settle a first visit's entrance.
  const settledPath = useRef(pathname);
  useLayoutEffect(() => {
    if (settledPath.current === pathname) return;
    settledPath.current = pathname;
    if (!wipeRunning()) return; // no wipe (old browser, swiped back): keep the entrance
    settleEntrances();
    settleWindowEnd = performance.now() + WIPE_MS + 200;
  }, [pathname]);

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
