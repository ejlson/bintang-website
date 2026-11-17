"use client";

import { loadSakuga, type SakugaFX } from "./sakuga";

/** The parts of `<sakuga-button>` the site uses (see lib/vendor/sakuga-button.js). */
export type SakugaButtonElement = HTMLElement & { impact: () => void; done: (hold?: number) => void };

type SakugaButtonProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  /** Radius of the impact burst in px (default 98). */
  burst?: string;
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic elements are declared on this namespace
  namespace JSX {
    interface IntrinsicElements {
      "sakuga-button": SakugaButtonProps;
    }
  }
}

let loading: Promise<SakugaFX | null> | null = null;

/**
 * Load the effects core and define `<sakuga-button>` once, on the client.
 * Resolves the core, or null if either part can't load (callers keep their plain fallback).
 */
export function loadSakugaButton(): Promise<SakugaFX | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  loading ??= (async () => {
    const fx = await loadSakuga();
    if (!fx) return null;
    try {
      await import("./vendor/sakuga-button.js");
    } catch {
      return null;
    }
    return customElements.get("sakuga-button") ? fx : null;
  })().then((fx) => {
    if (!fx) loading = null;
    return fx;
  });
  return loading;
}
