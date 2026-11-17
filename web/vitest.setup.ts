import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

/**
 * Tests flip these to simulate media-query state:
 * - `reduce`: the OS "reduce motion" setting.
 * - `desktop`: viewport at or above the 768px breakpoint ("(width >= 768px)").
 */
export const motion = { reduce: false, desktop: false };

type MediaListener = (e: { matches: boolean; media: string }) => void;

/** "change" listeners registered via matchMedia(query).addEventListener, keyed by query. */
export const mediaListeners = new Map<string, Set<MediaListener>>();

/** Call every stored "change" listener for `query` with the given `matches`. */
export function fireMediaChange(query: string, matches: boolean) {
  for (const l of [...(mediaListeners.get(query) ?? [])]) l({ matches, media: query });
}

function evaluate(query: string) {
  if (query.includes("prefers-reduced-motion")) return motion.reduce;
  if (query.includes("width >= 768px") || query.includes("min-width: 768px")) return motion.desktop;
  return false;
}

afterEach(() => {
  motion.reduce = false;
  motion.desktop = false;
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => {
    const listeners = () => {
      if (!mediaListeners.has(query)) mediaListeners.set(query, new Set());
      return mediaListeners.get(query)!;
    };
    return {
      matches: evaluate(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn((type: string, l: MediaListener) => {
        if (type === "change") listeners().add(l);
      }),
      removeEventListener: vi.fn((type: string, l: MediaListener) => {
        if (type === "change") listeners().delete(l);
      }),
      addListener: vi.fn((l: MediaListener) => listeners().add(l)),
      removeListener: vi.fn((l: MediaListener) => listeners().delete(l)),
      dispatchEvent: vi.fn(),
    };
  },
});

// jsdom has no media playback; record calls instead.
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: vi.fn(() => Promise.resolve()),
});
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
});

// The Book button's Sakuga script draws on canvas, which jsdom lacks: keep the
// plain-link fallback in tests unless a test file mocks this itself.
vi.mock("@/lib/sakuga-button", () => ({ loadSakugaButton: () => Promise.resolve(null) }));
