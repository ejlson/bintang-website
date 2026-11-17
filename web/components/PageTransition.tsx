"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";

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

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    // Keyed by path so every navigation is an exit + enter pair; the layout
    // itself persists, so without the key nothing would animate.
    <ViewTransition
      key={pathname}
      exit={{ [OPEN_POST]: "wipe-iris", default: exitWipeFor(pathname) }}
      enter="page-under"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
