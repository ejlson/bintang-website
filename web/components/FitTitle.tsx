"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns during server render; it only matters in the browser.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Vertical squish applied to page titles, matching the MENU title. */
const SQUISH = 0.85;
/** Font size in SVG units; the viewBox scales it to the container. */
const SIZE = 100;

type Box = { x: number; y: number; w: number; h: number };

/** First-paint guess for an uppercase word in Aquavit Black (~0.68em per letter, ~0.7em cap height). */
function estimate(text: string, squish: number): Box {
  return { x: 0, y: -70 * squish, w: Math.max(1, text.length) * 68, h: 70 * squish };
}

type Props = {
  /** The title. It's shown uppercase; screen readers get it as written. */
  text: string;
  className?: string;
  /** Vertical scale of the letters; 1 is the font as drawn. Defaults to the MENU title's squish. */
  squish?: number;
};

/**
 * A one-line display title that spans exactly the width of its container.
 * The word is measured in its real font and the SVG viewBox is cropped to the
 * ink, so nothing is stretched and there's no empty band above the letters.
 */
export function FitTitle({ text, className, squish = SQUISH }: Props) {
  const textRef = useRef<SVGTextElement>(null);
  const [box, setBox] = useState<Box>(() => estimate(text, squish));

  useIsoLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${SIZE}px ${cs.fontFamily}`;
      const m = ctx.measureText(text.toUpperCase());
      const left = m.actualBoundingBoxLeft ?? 0;
      const right = m.actualBoundingBoxRight ?? m.width;
      const ascent = m.actualBoundingBoxAscent ?? SIZE * 0.7;
      const descent = m.actualBoundingBoxDescent ?? 0;
      if (!(right + left > 0) || !(ascent + descent > 0)) return;
      setBox({ x: -left, y: -ascent * squish, w: left + right, h: (ascent + descent) * squish });
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [text, squish]);

  return (
    <svg
      className={className}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      role="img"
      aria-label={text}
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
    >
      <text
        ref={textRef}
        transform={`scale(1 ${squish})`}
        fill="currentColor"
        aria-hidden="true"
        style={{ fontSize: SIZE, textTransform: "uppercase" }}
      >
        {text}
      </text>
    </svg>
  );
}
