"use client";

import { Yuji_Boku } from "next/font/google";

/**
 * Sound-word lettering face for the Sakuga VFX core. Only drawn on a canvas,
 * so it isn't preloaded; the core asks for it when it starts.
 */
const sfxFont = Yuji_Boku({ weight: "400", subsets: ["latin"], display: "swap", preload: false });

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
    window.BINTANG_SFX_FONT = sfxFont.style.fontFamily;
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
