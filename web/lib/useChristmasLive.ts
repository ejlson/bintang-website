"use client";

import { useSyncExternalStore } from "react";
import { isChristmasLive } from "./promo";

// The date doesn't need watching while the page is open: it's read once, after hydration.
const subscribe = () => () => {};
const getSnapshot = () => isChristmasLive();
// The server can't know the visitor's date (and Home is prerendered at build).
const getServerSnapshot = () => null;

/**
 * True while the Christmas 2026 promotion is live, false after it, and null
 * during server render and hydration (show neither the promo nor what it
 * replaces until it's known).
 */
export function useChristmasLive(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);
}
