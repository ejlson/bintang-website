import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Subtitles } from "@/components/Subtitles";
import { KARAOKE, lineSchedule } from "@/lib/karaoke";
import { subtitleLines, type SubtitleLine } from "@/lib/nav";
import type { SakugaFX } from "@/lib/sakuga";
import { fireMediaChange, motion } from "../vitest.setup";

// next/font only works inside the Next compiler.
vi.mock("next/font/google", () => ({ Yuji_Boku: () => ({ style: { fontFamily: "x" } }) }));

const { loadSakuga } = vi.hoisted(() => ({ loadSakuga: vi.fn() }));
vi.mock("@/lib/sakuga", () => ({ loadSakuga }));

/** One animation frame, as the fake clock schedules them. */
const FRAME_MS = 16;

const root = () => screen.getByTestId("subtitles");
const view = () => root().dataset.view;
const lineIndex = () => Number(root().dataset.line);
const shown = () => ({
  en: screen.getByTestId("subtitle-en").textContent,
  tl: screen.getByTestId("subtitle-tl").textContent,
});
/** The yellow (fill) layer next to a base layer; its clip-path is the wipe. */
const fill = (which: "en" | "tl") =>
  screen.getByTestId(`subtitle-${which}`).parentElement!.querySelector<HTMLElement>('[data-layer="fill"]')!;
/** Right inset of the wipe, in %: 100 = nothing lit, 0 = fully lit. */
const unlit = (which: "en" | "tl") => {
  const m = /inset\(\S+ ([\d.]+)%/.exec(fill(which).style.clipPath);
  return m ? Number(m[1]) : null;
};
const end = (l: SubtitleLine) => lineSchedule(l.en, l.tl).end;

/** Let the font check (a resolved promise in jsdom) and the effects import settle. */
const settle = () => act(async () => {});

/** Run animation frames for `seconds`, one act() per frame so React renders between them. */
async function run(seconds: number) {
  const frames = Math.ceil((seconds * 1000) / FRAME_MS);
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FRAME_MS);
    });
  }
}

/** Run frames until the view or line changes; returns the seconds that took. */
async function untilChange(maxSeconds = 30) {
  const before = `${view()}:${lineIndex()}`;
  for (let i = 1; i * FRAME_MS <= maxSeconds * 1000; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FRAME_MS);
    });
    if (`${view()}:${lineIndex()}` !== before) return (i * FRAME_MS) / 1000;
  }
  throw new Error(`no change from ${before} within ${maxSeconds}s`);
}

/** Render, let fonts resolve, and run the first frame (which switches to the live view). */
async function start(ui: React.ReactElement = <Subtitles />) {
  const r = render(ui);
  await settle();
  await run(FRAME_MS / 1000);
  return r;
}

/** Elapsed time should match the schedule to within a frame early (sampling) or a few frames late (loop latency). */
const nearly = (actual: number, expected: number) => {
  expect(actual).toBeGreaterThanOrEqual(expected - FRAME_MS / 1000);
  expect(actual).toBeLessThan(expected + (3 * FRAME_MS) / 1000);
};

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  });
  loadSakuga.mockReset();
  loadSakuga.mockResolvedValue(null);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("Subtitles", () => {
  it("is decorative (aria-hidden)", () => {
    render(<Subtitles />);
    expect(root()).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the still first line, fully lit, before the loop starts", () => {
    render(<Subtitles />);
    expect(view()).toBe("still");
    expect(lineIndex()).toBe(0);
    expect(root()).toHaveClass("still");
    expect(shown()).toEqual({ en: subtitleLines[0].en, tl: subtitleLines[0].tl });
    // No wipe applied: the fill layer covers the whole line.
    expect(fill("en").style.clipPath).toBe("");
    expect(fill("tl").style.clipPath).toBe("");
    expect(screen.queryByTestId("subtitle-score")).toBeNull();
  });

  it("enters the live line view on the first frame once fonts are ready", async () => {
    render(<Subtitles />);
    await settle();
    expect(view()).toBe("still");
    await run(FRAME_MS / 1000);
    expect(view()).toBe("line");
    expect(lineIndex()).toBe(0);
    expect(root()).not.toHaveClass("still");
    expect(shown()).toEqual({ en: subtitleLines[0].en, tl: subtitleLines[0].tl });
  });

  it("waits for document.fonts before starting", async () => {
    let fontsLoaded!: () => void;
    const fonts = {
      load: vi.fn(() => new Promise<void>((r) => (fontsLoaded = r))),
      ready: Promise.resolve(),
    };
    Object.defineProperty(document, "fonts", { configurable: true, value: fonts });
    try {
      render(<Subtitles />);
      await settle();
      await run(0.5);
      expect(fonts.load).toHaveBeenCalledWith(expect.stringContaining("aquavit"));
      expect(view()).toBe("still");

      fontsLoaded();
      await settle();
      await run(FRAME_MS / 1000);
      expect(view()).toBe("line");
    } finally {
      delete (document as { fonts?: unknown }).fonts;
    }
  });

  it("wipes English then Tagalog, word by word", async () => {
    await start();
    const S = lineSchedule(subtitleLines[0].en, subtitleLines[0].tl);

    await run(S.enStart - 0.1); // countdown
    expect(unlit("en")).toBe(100);
    expect(unlit("tl")).toBe(100);

    await run(S.enEnd - S.enStart + 0.2); // English done, Tagalog not started
    expect(unlit("en")).toBe(0);
    expect(unlit("tl")).toBe(100);

    await run(S.tlEnd - S.enEnd); // both lit during the hold
    expect(unlit("en")).toBe(0);
    expect(unlit("tl")).toBe(0);
    expect(lineIndex()).toBe(0);
  });

  it("advances to the next line after lineSchedule(...).end seconds", async () => {
    await start();
    nearly(await untilChange(), end(subtitleLines[0]));
    expect(view()).toBe("line");
    expect(lineIndex()).toBe(1);
    expect(shown()).toEqual({ en: subtitleLines[1].en, tl: subtitleLines[1].tl });
    // The new line starts unlit.
    await run(0.1);
    expect(unlit("en")).toBe(100);
  });

  it("plays every line in order, shows the score card, then wraps to line 0", async () => {
    await start();
    for (let i = 0; i < subtitleLines.length - 1; i++) {
      expect(lineIndex()).toBe(i);
      nearly(await untilChange(), end(subtitleLines[i]));
      expect(lineIndex()).toBe(i + 1);
      expect(shown().en).toBe(subtitleLines[i + 1].en);
    }

    nearly(await untilChange(), end(subtitleLines[subtitleLines.length - 1]));
    expect(view()).toBe("score");
    const score = screen.getByTestId("subtitle-score");
    expect(score).toHaveTextContent("100");
    expect(score).toHaveTextContent("Ang galing mo!");
    expect(score).toHaveTextContent("You’re a star!");
    // The lyric rows are hidden behind the card.
    expect(screen.getByTestId("subtitle-en").closest("[hidden]")).not.toBeNull();

    nearly(await untilChange(), KARAOKE.score + KARAOKE.exit);
    expect(view()).toBe("line");
    expect(lineIndex()).toBe(0);
    expect(screen.queryByTestId("subtitle-score")).toBeNull();
    expect(shown().en).toBe(subtitleLines[0].en);
    expect(screen.getByTestId("subtitle-en").closest("[hidden]")).toBeNull();
  });

  it("with scoreCard={false} wraps straight from the last line to the first", async () => {
    const lines = [
      { en: "A", tl: "a" },
      { en: "B", tl: "b" },
    ];
    await start(<Subtitles lines={lines} scoreCard={false} />);
    nearly(await untilChange(), end(lines[0]));
    expect(lineIndex()).toBe(1);
    nearly(await untilChange(), end(lines[1]));
    expect(view()).toBe("line");
    expect(lineIndex()).toBe(0);
    expect(shown().en).toBe("A");
    expect(screen.queryByTestId("subtitle-score")).toBeNull();
  });

  it("shows the still first line while paused from the start", async () => {
    render(<Subtitles paused />);
    await settle();
    await run(10);
    expect(view()).toBe("still");
    expect(lineIndex()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("freezes the current line when paused and resumes from where it stopped", async () => {
    const { rerender } = await start();
    await untilChange(); // now on line 1
    expect(lineIndex()).toBe(1);
    // Mid-way through the English wipe.
    const S = lineSchedule(subtitleLines[1].en, subtitleLines[1].tl);
    const into = (S.enStart + S.enEnd) / 2;
    await run(into);
    const litBefore = unlit("en");
    expect(litBefore).toBeGreaterThan(0);
    expect(litBefore).toBeLessThan(100);

    rerender(<Subtitles paused />);
    await settle();
    await run(30);
    expect(view()).toBe("line");
    expect(lineIndex()).toBe(1);
    expect(unlit("en")).toBe(litBefore);
    expect(vi.getTimerCount()).toBe(0);

    rerender(<Subtitles paused={false} />);
    await settle();
    // Only the rest of the line is left, not a fresh line.
    nearly(await untilChange(), end(subtitleLines[1]) - into);
    expect(lineIndex()).toBe(2);
  });

  it("cancels its animation frame on unmount", async () => {
    const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
    const { unmount } = await start();
    await run(0.5);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(cancel).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  describe("with prefers-reduced-motion: reduce", () => {
    beforeEach(() => {
      motion.reduce = true;
    });

    it("stays on the still first line, fully lit, and never starts the loop or loads effects", async () => {
      render(<Subtitles />);
      await settle();
      await run(20);
      expect(view()).toBe("still");
      expect(lineIndex()).toBe(0);
      expect(root()).toHaveClass("still");
      expect(shown()).toEqual({ en: subtitleLines[0].en, tl: subtitleLines[0].tl });
      expect(fill("en").style.clipPath).toBe("");
      expect(fill("tl").style.clipPath).toBe("");
      expect(screen.queryByTestId("subtitle-score")).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
      expect(loadSakuga).not.toHaveBeenCalled();
    });
  });

  describe("sakuga effects", () => {
    function fakeFx(): SakugaFX {
      return {
        paused: false,
        calm: false,
        at: vi.fn(() => ({ x: 100, y: 100, w: 200, h: 40 })),
        later: vi.fn(),
        clear: vi.fn(),
        sfx: vi.fn(),
        puff: vi.fn(),
        burst: vi.fn(),
        kira: vi.fn(),
        lines: vi.fn(),
      };
    }

    it("lands the line's sound word when the Tagalog wipe ends", async () => {
      const fx = fakeFx();
      loadSakuga.mockResolvedValue(fx);
      await start();
      const S = lineSchedule(subtitleLines[0].en, subtitleLines[0].tl);
      await run(S.tlEnd - 0.1);
      expect(fx.sfx).not.toHaveBeenCalled();
      await run(0.2);
      expect(fx.sfx).toHaveBeenCalledTimes(1);
      expect(vi.mocked(fx.sfx).mock.calls[0][0]).toBe("salamat"); // "welcome" line
    });

    it("mirrors the paused prop onto the effects core", async () => {
      const fx = fakeFx();
      loadSakuga.mockResolvedValue(fx);
      const { rerender } = await start();
      expect(fx.paused).toBe(false);
      rerender(<Subtitles paused />);
      expect(fx.paused).toBe(true);
      rerender(<Subtitles />);
      expect(fx.paused).toBe(false);
    });

    it("wipes the effects canvas and unpauses the core on unmount", async () => {
      const fx = fakeFx();
      loadSakuga.mockResolvedValue(fx);
      const { unmount, rerender } = await start();
      rerender(<Subtitles paused />);
      expect(fx.paused).toBe(true);
      unmount();
      expect(fx.clear).toHaveBeenCalledTimes(1);
      expect(fx.paused).toBe(false);
    });

    it("wipes the effects canvas when reduced motion switches on mid-line", async () => {
      const fx = fakeFx();
      loadSakuga.mockResolvedValue(fx);
      await start();
      await run(1);
      motion.reduce = true;
      await act(async () => fireMediaChange("(prefers-reduced-motion: reduce)", true));
      expect(fx.clear).toHaveBeenCalled();
      expect(screen.getByTestId("subtitles")).toHaveAttribute("data-view", "still");
    });

    it("works without the effects core (loadSakuga resolves null)", async () => {
      loadSakuga.mockResolvedValue(null);
      await start();
      nearly(await untilChange(), end(subtitleLines[0]));
      expect(lineIndex()).toBe(1);
    });
  });
});
