"use client";

/**
 * Sound-word lettering face for the Sakuga VFX core: Yuji Boku (OFL), Latin
 * subset only, self-hosted. It's only drawn on a canvas and every word is
 * plain Latin, so it's registered here when the core starts rather than via
 * next/font, whose CSS carried ~120 @font-face rules for the whole CJK set
 * in the stylesheet every page waits on.
 */
const SFX_FAMILY = "Yuji Boku";
const SFX_LATIN_RANGE =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

function registerSfxFont() {
  if (typeof FontFace === "undefined" || !document.fonts) return;
  try {
    const face = new FontFace(SFX_FAMILY, 'url("/fonts/yuji-boku-latin.woff2") format("woff2")', {
      weight: "400",
      style: "normal",
      unicodeRange: SFX_LATIN_RANGE,
    });
    document.fonts.add(face);
  } catch {
    // The core falls back to drawing nothing until a face is ready; effects are optional.
  }
}

type Opts = Record<string, unknown>;
type Fx = (x: number, y: number, opts?: Opts) => void;

/** The parts of the vendored core's `window.SakugaFX` that the site uses. */
export type SakugaFX = {
  paused: boolean;
  /** True while the visitor asks for reduced motion; effects are skipped. */
  readonly calm: boolean;
  /** Page coordinates of a point inside an element (fx, fy are 0–1 fractions of its box). */
  at: (el: Element, fx?: number, fy?: number) => { x: number; y: number; w: number; h: number };
  /** Run `f` after `ms` milliseconds of the core's own clock (it stops while paused). */
  later: (ms: number, f: () => void) => void;
  /** Drop every live effect and pending timer and wipe the canvas. */
  clear: () => void;
  sfx: (name: SoundWord, x: number, y: number, opts?: Opts) => void;
  puff: Fx;
  burst: Fx;
  kira: Fx;
  lines: Fx;
};

/** Sound words in the Bintang build of the core (see BAY in lib/vendor/sakuga-core.js). */
export type SoundWord = "don" | "kachi" | "shu" | "pon" | "zuza" | "gogo" | "salamat" | "sarap";

declare global {
  interface Window {
    SakugaFX?: SakugaFX;
    BINTANG_SFX_FONT?: string;
  }
}

let loading: Promise<SakugaFX | null> | null = null;

/** Load the effects core once, on the client. Resolves null if it can't load; the subtitles work without it. */
export function loadSakuga(): Promise<SakugaFX | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.SakugaFX) return Promise.resolve(window.SakugaFX);
  loading ??= (async () => {
    registerSfxFont();
    window.BINTANG_SFX_FONT = `"${SFX_FAMILY}"`;
    try {
      await import("./vendor/sakuga-core.js");
      return window.SakugaFX ?? null;
    } catch {
      loading = null;
      return null;
    }
  })();
  return loading;
}
