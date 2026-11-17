"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./ColourSweep.module.css";

/** Same length and curve as Mala Project's background sweep. */
export const SWEEP_MS = 1000;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Where the sweep band starts and ends, as translateY of a layer 200vh tall.
 * Down: it starts above the screen and slides down, soft edge first.
 * Up: it starts below the screen and slides up. Both end at -50vh, where the
 * band's solid part covers the whole screen.
 */
export const SWEEP_FROM = { down: "-200vh", up: "100vh" } as const;
export const SWEEP_TO = "-50vh";

type Props = {
  /** The element whose `[data-sweep]` children each carry a background colour. */
  root: RefObject<HTMLElement | null>;
};

/**
 * A fixed background behind the page that changes colour section by section.
 * Each section names its colour in `data-sweep`. When a section crosses the
 * middle of the screen, its colour sweeps in as a soft-edged band: down from
 * the top when you scroll down, up from the bottom when you scroll back up.
 * With reduced motion (or no Web Animations API) the colour just changes.
 */
export function ColourSweep({ root }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const base = baseRef.current;
    const band = bandRef.current;
    const container = root.current;
    if (!base || !band || !container) return;

    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-sweep]"));
    if (sections.length === 0) return;
    base.style.background = sections[0].dataset.sweep!;
    // Very old browsers: the first section's colour stays for the whole page.
    if (typeof IntersectionObserver === "undefined") return;

    let current = 0;
    let anim: Animation | null = null;

    const settle = (colour: string) => {
      base.style.background = colour;
      band.hidden = true;
      anim = null;
    };

    const go = (index: number) => {
      if (index === current) return;
      const direction = index > current ? "down" : "up";
      current = index;
      const colour = sections[index].dataset.sweep!;

      // A sweep still running: let its colour land now, then start the next.
      if (anim) {
        const landed = band.style.getPropertyValue("--sweep");
        anim.cancel();
        settle(landed);
      }

      if (reduce !== false || typeof band.animate !== "function") {
        settle(colour);
        return;
      }

      band.style.setProperty("--sweep", colour);
      band.dataset.direction = direction;
      band.hidden = false;
      anim = band.animate(
        [{ transform: `translateY(${SWEEP_FROM[direction]})` }, { transform: `translateY(${SWEEP_TO})` }],
        { duration: SWEEP_MS, easing: EASE, fill: "forwards" },
      );
      const mine = anim;
      mine.onfinish = () => {
        if (anim === mine) settle(colour);
      };
    };

    // A section counts once it covers the middle line of the screen. The first
    // report (on load, or after a restored scroll position) sets the colour
    // without a sweep.
    let first = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const index = sections.indexOf(e.target as HTMLElement);
          if (first) {
            current = index;
            settle(sections[index].dataset.sweep!);
          } else go(index);
        }
        first = false;
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));

    return () => {
      io.disconnect();
      anim?.cancel();
    };
  }, [root, reduce]);

  return (
    <div className={styles.layer} aria-hidden="true" data-testid="colour-sweep">
      <div ref={baseRef} className={styles.base} />
      <div ref={bandRef} className={styles.band} hidden />
    </div>
  );
}
