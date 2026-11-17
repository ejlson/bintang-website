"use client";

import { useSyncExternalStore } from "react";

type NetworkInformation = EventTarget & { saveData?: boolean };

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function subscribe(onChange: () => void) {
  const c = connection();
  c?.addEventListener("change", onChange);
  return () => c?.removeEventListener("change", onChange);
}

// Browsers without the Network Information API (Safari, Firefox) report false.
const getSnapshot = () => connection()?.saveData === true;
// Unknown on the server, as with useReducedMotion.
const getServerSnapshot = () => null;

/** True when the visitor has turned on their browser's data-saver mode; null before hydration. */
export function useSaveData(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);
}
