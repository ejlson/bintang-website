"use client";

import { useEffect, useRef, useState } from "react";
import { BOOKING_URL } from "@/lib/nav";
import { loadSakugaButton } from "@/lib/sakuga-button";
import type { SakugaFX } from "@/lib/sakuga";
import styles from "./SiteHeader.module.css";

const LABEL = "Book a table on OpenTable (opens in a new tab)";

/** The impact burst behind the button, in px (the component's default is 98). */
const BURST_RADIUS = "150";

/** Long enough for the impact frame and ドン to land before the new tab takes over. */
const IMPACT_MS = 320;

/** Open OpenTable in a new tab; if a popup blocker stops it, go there in this tab instead. */
function openBooking() {
  const w = window.open(BOOKING_URL, "_blank");
  if (w) w.opener = null;
  else window.location.assign(BOOKING_URL);
}

/**
 * The header's Book button. Server-renders as a plain link to OpenTable, then
 * upgrades to the Sakuga VFX button (impact frame on click) once its script
 * loads. If the script can't load, the link stays.
 */
export function BookButton() {
  const [fx, setFx] = useState<SakugaFX | null>(null);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let alive = true;
    void loadSakugaButton().then((loaded) => {
      if (alive && loaded) setFx(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fx) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The home video pauses the shared effects clock. A press then would freeze
    // the button mid-squash, so skip the reaction and just open the page.
    // Stopping the event also skips onClick below, so the guard opens the page itself.
    const guard = (e: Event) => {
      if (!fx.paused) return;
      e.stopPropagation();
      if (e.type === "click") openBooking();
    };
    const onClick = () => {
      clearTimeout(timer);
      if (fx.calm) openBooking();
      else timer = setTimeout(openBooking, IMPACT_MS);
    };
    el.addEventListener("pointerdown", guard, { capture: true });
    el.addEventListener("click", guard, { capture: true });
    el.addEventListener("click", onClick);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("pointerdown", guard, { capture: true });
      el.removeEventListener("click", guard, { capture: true });
      el.removeEventListener("click", onClick);
    };
  }, [fx]);

  if (!fx) {
    return (
      <a href={BOOKING_URL} className={styles.book} target="_blank" rel="noopener noreferrer" aria-label={LABEL}>
        Book
      </a>
    );
  }

  return (
    <sakuga-button ref={ref} className={styles.sakuga} burst={BURST_RADIUS}>
      Book
      <span className={styles.sr}>{" a table on OpenTable (opens in a new tab)"}</span>
    </sakuga-button>
  );
}
