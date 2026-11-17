"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
// The server can't know the visitor's setting. `null` means "unknown yet":
// callers must not start motion until the client value arrives after hydration.
const getServerSnapshot = () => null;

/**
 * True when the visitor has asked the OS to reduce motion,
 * false when they haven't, null during server render and hydration.
 */
export function useReducedMotion(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);
}
