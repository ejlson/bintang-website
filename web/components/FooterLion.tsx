"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import styles from "./SiteFooter.module.css";

/**
 * The footer's lion, its tail swinging as one solid piece (the "Option A — Solid
 * swing" board on the Claude Design canvas). Cutting the tail into jointed pieces
 * showed seams, so it has no joints: it turns on its base, where it meets the rump.
 *
 * Drawing: /brand/lion-full-art.svg#art, the full lion with no fill of its own,
 * so it takes the footer's text colour. It's used twice: the body (everything but
 * the tail) and the tail. The tail piece reaches 8 units further down into the
 * rump than the body's cut-out, so its base stays covered as it turns.
 *
 * Fade: three copies of that (sharp, slightly soft, soft), each shown in a band
 * of the lion's height, so it fades away towards the bottom.
 *
 * Motion: one 4.4s swing (under WCAG 2.2.2's 5s) each time the lion scrolls
 * into view (35% visible, coming in, not going out), and when a mouse moves onto
 * it. A trigger mid-swing is ignored, so it never snaps back. None with reduced
 * motion.
 *
 * The drawing, clips and pivot are shared with the Home loader (HomeTitle).
 */

export const ART = "/brand/lion-full-art.svg#art";
export const VIEWBOX = "218.17 174.79 156.29 116.77";

/**
 * Tail outline, in the drawing's units: it follows the gap between tail and body,
 * then cuts across the tail's base. The body leaves out the tail down to y=262;
 * the tail piece reaches down to y=270, overlapping the rump.
 */
const tailOutline = (baseY: number) => `306,174 376,174 376,${baseY} 361,${baseY} 356,240 348,228 336,218 322,212 306,210`;
export const BODY_CLIP = `M210 170H380V300H210Z M${tailOutline(262).split(" ").join(" L")}Z`;
export const TAIL_CLIP = tailOutline(270);

/** The tail turns around the middle of its base. */
export const PIVOT = [366, 262] as const;

/**
 * The band masks reach EXT px above the lion so the tail can swing up without
 * being clipped; `at(p)` is a stop p (0–1) of the lion's height on that taller box.
 */
const EXT = 60;
const at = (p: number) => `calc(${EXT}px + ${p} * (100% - ${EXT}px))`;

const FADES: { blur: number; mask: string }[] = [
  { blur: 0, mask: `linear-gradient(to bottom, #000 ${at(0.3)}, transparent ${at(0.56)})` },
  { blur: 0.4, mask: `linear-gradient(to bottom, transparent ${at(0.3)}, #000 ${at(0.5)}, transparent ${at(0.74)})` },
  { blur: 1, mask: `linear-gradient(to bottom, transparent ${at(0.5)}, rgb(0 0 0 / 0.7) ${at(0.68)}, transparent ${at(0.9)})` },
];

/** How much of the lion must be on screen for it to count as "in view". */
const IN_VIEW = 0.35;

function Lion({ clipIds }: { clipIds: { body: string; tail: string } }) {
  const [x, y] = PIVOT;
  return (
    <svg className={styles.drawing} viewBox={VIEWBOX} fill="currentColor">
      <use href={ART} clipPath={`url(#${clipIds.body})`} />
      {/* Moved to the pivot, turned, moved back: the tail turns on its base. */}
      <g transform={`translate(${x} ${y})`}>
        <g className={styles.swing}>
          <g transform={`translate(${-x} ${-y})`}>
            <use href={ART} clipPath={`url(#${clipIds.tail})`} />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function FooterLion() {
  const ref = useRef<HTMLDivElement>(null);
  // While true, [data-swaying] runs the swing; animationend clears it, so the
  // next trigger starts a fresh swing. Triggers during a swing are ignored.
  const [swaying, setSwaying] = useState(false);
  // Unique per footer: the router keeps earlier pages (and their footers) in the DOM, hidden.
  const uid = useId().replace(/[^\w-]/g, "");
  const clipIds = { body: `footer-lion-body-${uid}`, tail: `footer-lion-tail-${uid}` };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let wasIn = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        const isIn = entry.isIntersecting && entry.intersectionRatio >= IN_VIEW;
        if (isIn && !wasIn) setSwaying(true); // coming into view, not leaving
        wasIn = isIn;
      },
      { threshold: [0, IN_VIEW] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A native listener (React's onAnimationEnd depends on AnimationEvent existing).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const end = () => setSwaying(false);
    el.addEventListener("animationend", end);
    return () => el.removeEventListener("animationend", end);
  }, []);

  return (
    <div
      ref={ref}
      className={styles.lion}
      data-swaying={swaying || undefined}
      aria-hidden="true"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setSwaying(true);
      }}
    >
      <svg className={styles.defs} width="0" height="0">
        <defs>
          <clipPath id={clipIds.body}>
            <path clipRule="evenodd" d={BODY_CLIP} />
          </clipPath>
          <clipPath id={clipIds.tail}>
            <polygon points={TAIL_CLIP} />
          </clipPath>
        </defs>
      </svg>
      {FADES.map(({ blur, mask }, k) => (
        <div key={k} className={styles.band} data-band="" style={{ WebkitMaskImage: mask, maskImage: mask } as CSSProperties}>
          {/* Blur first, then cut the band: masking before blurring smears the band's edges. */}
          <div className={styles.layer} style={{ filter: blur ? `blur(calc(var(--lion-blur) * ${blur}))` : undefined }}>
            <Lion clipIds={clipIds} />
          </div>
        </div>
      ))}
    </div>
  );
}
