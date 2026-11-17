import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { act as reactAct } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { HERO_LANDSCAPE, HERO_PORTRAIT, Hero, PORTRAIT_QUERY } from "@/components/Hero";
import { lineSchedule } from "@/lib/karaoke";
import { subtitleLines } from "@/lib/nav";
import { fireMediaChange, mediaListeners, motion } from "../vitest.setup";

// next/font only works inside the Next compiler; the subtitles' effects core is optional.
vi.mock("next/font/google", () => ({ Yuji_Boku: () => ({ style: { fontFamily: "x" } }) }));
vi.mock("@/lib/sakuga", () => ({ loadSakuga: () => Promise.resolve(null) }));

const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
const pause = HTMLMediaElement.prototype.pause as unknown as ReturnType<typeof vi.fn>;

const heroVideo = () => screen.getByTestId("hero-video") as HTMLVideoElement;
const thumbVideo = () => screen.getByRole("link", { name: "Watch our story" }).querySelector("video") as HTMLVideoElement;
const pauseButton = () => screen.getByRole("button", { name: /background video/ });
const subtitleEn = () => screen.getByTestId("subtitle-en").textContent;
const subtitleView = () => screen.getByTestId("subtitles").dataset.view;

/**
 * Seconds of animation that take the subtitles from the first line to the second:
 * the first line's schedule, plus slack for the start frame and loop latency.
 */
const FIRST_LINE = lineSchedule(subtitleLines[0].en, subtitleLines[0].tl).end + 0.2;

/** Run requestAnimationFrame frames for `seconds`, one act() per 16ms frame so React renders between them. */
async function animate(seconds: number) {
  for (let ms = 0; ms < seconds * 1000; ms += 16) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });
  }
}

/** Let pending promise rejections (play().catch) settle inside act. */
const flush = () => act(async () => {});

const heroCss = () => readFileSync(join(process.cwd(), "components", "Hero.module.css"), "utf8");

/** Stub navigator.connection (Network Information API) with the given saveData flag. */
function stubConnection(saveData: boolean) {
  const connection = Object.assign(new EventTarget(), { saveData });
  vi.spyOn(connection, "addEventListener");
  vi.spyOn(connection, "removeEventListener");
  Object.defineProperty(navigator, "connection", { configurable: true, value: connection });
  return connection;
}
function unstubConnection() {
  delete (navigator as Navigator & { connection?: unknown }).connection;
}

/** Server-render <Hero /> and parse the HTML the browser would receive. */
function serverMarkup() {
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Hero />);
  return container;
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  });
  play.mockClear();
  pause.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  motion.reduce = false;
});

describe("Hero", () => {
  it("has a visually hidden H1 with the restaurant message", () => {
    render(<Hero />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Bintang — London’s oldest Filipino restaurant, Camden Town since 1987");
    expect(h1).toHaveClass("sr-only");
    expect(screen.getByRole("region", { name: /Bintang/ })).toContainElement(h1);
  });

  it("renders a looping, inline, decorative hero video with no poster attribute (CSS background is the poster)", () => {
    render(<Hero />);
    const v = heroVideo();
    expect(v.loop).toBe(true);
    expect(v).toHaveAttribute("playsinline");
    expect(v).not.toHaveAttribute("poster");
    expect(serverMarkup().querySelector('[data-testid="hero-video"]')).not.toHaveAttribute("poster");
    expect(v).toHaveAttribute("aria-hidden", "true");
    const sources = Array.from(v.querySelectorAll("source")).map((s) => [s.getAttribute("src"), s.getAttribute("media")]);
    expect(sources).toEqual([
      ["/media/hero-loop-portrait.mp4", "(max-aspect-ratio: 1/1)"],
      ["/media/hero-loop.mp4", null],
    ]);
    expect([HERO_PORTRAIT, HERO_LANDSCAPE, PORTRAIT_QUERY]).toEqual([
      "/media/hero-loop-portrait.mp4",
      "/media/hero-loop.mp4",
      "(max-aspect-ratio: 1/1)",
    ]);
    expect(v.querySelector('source[src*="720"]')).toBeNull();
  });

  it("ships the muted attribute in the server HTML for both videos (autoplay needs it before hydration)", () => {
    // React's client renderer only sets the `muted` property, which setPlaying() also
    // does; the server HTML is where the JSX `muted` prop becomes a real attribute.
    const html = serverMarkup();
    const videos = Array.from(html.querySelectorAll("video"));
    expect(videos).toHaveLength(2);
    for (const v of videos) {
      expect(v).toHaveAttribute("muted");
      expect(v.defaultMuted).toBe(true);
    }
  });

  it("links the thumbnail to /about", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Watch our story" })).toHaveAttribute("href", "/about");
    expect(thumbVideo().muted).toBe(true);
  });

  it("only references media files that exist in public/ (markup and CSS posters)", () => {
    render(<Hero />);
    const markupUrls = Array.from(document.querySelectorAll("video, source")).flatMap((el) =>
      ["src", "poster"].map((a) => el.getAttribute(a)).filter((u): u is string => !!u),
    );
    expect(markupUrls).toHaveLength(4);
    const cssUrls = Array.from(heroCss().matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g), (m) => m[1]);
    expect(cssUrls).toEqual(expect.arrayContaining(["/media/hero-poster.jpg", "/media/hero-poster-portrait.jpg"]));
    for (const u of [...markupUrls, ...cssUrls]) expect(existsSync(join(process.cwd(), "public", u)), u).toBe(true);
  });

  it("swaps the CSS poster with the same orientation query the video uses", () => {
    const css = heroCss();
    const block = css.slice(css.indexOf(`@media ${PORTRAIT_QUERY}`));
    expect(block).not.toBe(css); // the query is present
    expect(block.slice(0, block.indexOf("}"))).toContain('url("/media/hero-poster-portrait.jpg")');
  });

  it("gives the thumbnail video its own poster", () => {
    render(<Hero />);
    expect(thumbVideo()).toHaveAttribute("poster", "/media/about-thumb-poster.jpg");
    expect(thumbVideo()).toHaveAttribute("src", "/media/about-thumb.mp4");
  });

  it("plays both videos on mount when motion is allowed", () => {
    render(<Hero />);
    const played = play.mock.contexts;
    expect(played).toContain(heroVideo());
    expect(played).toContain(thumbVideo());
    expect(pause).not.toHaveBeenCalled();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(pauseButton()).toHaveAccessibleName("Pause background video");
  });

  it("pause button pauses both videos, flips aria-pressed (fixed label) and freezes subtitles", async () => {
    render(<Hero />);
    await animate(FIRST_LINE);
    expect(subtitleEn()).toBe(subtitleLines[1].en);

    play.mockClear();
    fireEvent.click(pauseButton());

    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    // State is conveyed by aria-pressed only; the name never changes.
    expect(pauseButton()).toHaveAccessibleName("Pause background video");
    expect(pause.mock.contexts).toContain(heroVideo());
    expect(pause.mock.contexts).toContain(thumbVideo());
    expect(play).not.toHaveBeenCalled();

    await animate(FIRST_LINE * 4);
    expect(subtitleEn()).toBe(subtitleLines[1].en);
    expect(subtitleView()).toBe("line");
  });

  it("pressing again resumes both videos and subtitle cycling", async () => {
    render(<Hero />);
    fireEvent.click(pauseButton());
    play.mockClear();
    pause.mockClear();

    fireEvent.click(pauseButton());
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(pauseButton()).toHaveAccessibleName("Pause background video");
    expect(play.mock.contexts).toContain(heroVideo());
    expect(play.mock.contexts).toContain(thumbVideo());
    expect(pause).not.toHaveBeenCalled();

    await animate(FIRST_LINE);
    expect(subtitleEn()).toBe(subtitleLines[1].en);
  });

  it("pausing mid-line and resuming continues from the frozen line", async () => {
    render(<Hero />);
    await animate(FIRST_LINE);
    expect(subtitleEn()).toBe(subtitleLines[1].en);

    fireEvent.click(pauseButton());
    await animate(FIRST_LINE * 4);
    expect(subtitleEn()).toBe(subtitleLines[1].en);

    fireEvent.click(pauseButton());
    const second = lineSchedule(subtitleLines[1].en, subtitleLines[1].tl).end;
    await animate(second + 0.2);
    expect(subtitleEn()).toBe(subtitleLines[2].en);
  });

  it("attaches a catch handler to play() so autoplay rejections are swallowed", () => {
    const rejected = Promise.reject(new DOMException("blocked", "NotAllowedError"));
    const catchSpy = vi.spyOn(rejected, "catch");
    play.mockReturnValueOnce(rejected);
    render(<Hero />);
    expect(catchSpy).toHaveBeenCalledTimes(1);
    // The handler must not rethrow.
    expect(() => (catchSpy.mock.calls[0][0] as (e: unknown) => unknown)(new Error("x"))).not.toThrow();
  });

  it("shows paused state when the browser refuses playback (NotAllowedError)", async () => {
    play.mockReturnValueOnce(Promise.reject(new DOMException("blocked", "NotAllowedError")));
    render(<Hero />);
    pause.mockClear();
    await flush();

    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    expect(pause.mock.contexts).toContain(heroVideo());
    expect(pause.mock.contexts).toContain(thumbVideo());
    await animate(FIRST_LINE * 3);
    expect(subtitleEn()).toBe(subtitleLines[0].en);
    expect(subtitleView()).toBe("still");

    // The visitor can still try again: pressing resumes.
    play.mockClear();
    fireEvent.click(pauseButton());
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(play.mock.contexts).toContain(heroVideo());
  });

  it("ignores AbortError from play(): stays playing and subtitles keep cycling", async () => {
    play.mockReturnValueOnce(Promise.reject(new DOMException("interrupted", "AbortError")));
    render(<Hero />);
    await flush();

    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(pause).not.toHaveBeenCalled();
    await animate(FIRST_LINE);
    expect(subtitleEn()).toBe(subtitleLines[1].en);
  });

  it("treats a plain Error rejection as blocked: shows paused state", async () => {
    play.mockReturnValueOnce(Promise.reject(new Error("decode failed")));
    render(<Hero />);
    await flush();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
  });

  it("treats a NotSupportedError (missing/unsupported file) as blocked", async () => {
    play.mockReturnValueOnce(Promise.reject(new DOMException("no source", "NotSupportedError")));
    render(<Hero />);
    pause.mockClear();
    await flush();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    expect(pause.mock.contexts).toContain(heroVideo());
    await animate(FIRST_LINE * 2);
    expect(subtitleEn()).toBe(subtitleLines[0].en);
    expect(subtitleView()).toBe("still");
  });

  it("only ignores AbortError when it is a DOMException (plain Error named AbortError blocks)", async () => {
    const err = new Error("interrupted");
    err.name = "AbortError";
    play.mockReturnValueOnce(Promise.reject(err));
    render(<Hero />);
    await flush();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
  });

  describe("orientation change", () => {
    const load = vi.fn();
    const portraitListeners = () => mediaListeners.get(PORTRAIT_QUERY)?.size ?? 0;
    const setCurrentSrc = (v: HTMLVideoElement, url: string) =>
      Object.defineProperty(v, "currentSrc", { configurable: true, get: () => url });

    const originalLoad = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "load")!;

    beforeEach(() => {
      load.mockClear();
      Object.defineProperty(HTMLMediaElement.prototype, "load", { configurable: true, writable: true, value: load });
    });
    afterEach(() => {
      Object.defineProperty(HTMLMediaElement.prototype, "load", originalLoad);
    });

    it("swaps to the landscape file, reloads and resumes playback when rotated to landscape", () => {
      render(<Hero />);
      const v = heroVideo();
      setCurrentSrc(v, `http://localhost:3000${HERO_PORTRAIT}`);
      play.mockClear();

      act(() => fireMediaChange(PORTRAIT_QUERY, false));

      expect(v.getAttribute("src")).toBe(HERO_LANDSCAPE);
      expect(load).toHaveBeenCalledTimes(1);
      expect(load.mock.contexts[0]).toBe(v);
      expect(play.mock.contexts).toEqual([v]);
      expect(v.muted).toBe(true);
    });

    it("swaps to the portrait file when rotated to portrait", () => {
      render(<Hero />);
      const v = heroVideo();
      setCurrentSrc(v, `http://localhost:3000${HERO_LANDSCAPE}`);
      act(() => fireMediaChange(PORTRAIT_QUERY, true));
      expect(v.getAttribute("src")).toBe(HERO_PORTRAIT);
      expect(load).toHaveBeenCalledTimes(1);
    });

    it("reloads but does not play when the visitor has paused", () => {
      render(<Hero />);
      fireEvent.click(pauseButton());
      const v = heroVideo();
      setCurrentSrc(v, `http://localhost:3000${HERO_PORTRAIT}`);
      play.mockClear();
      pause.mockClear();

      act(() => fireMediaChange(PORTRAIT_QUERY, false));

      expect(v.getAttribute("src")).toBe(HERO_LANDSCAPE);
      expect(load).toHaveBeenCalledTimes(1);
      expect(play).not.toHaveBeenCalled();
      expect(pause.mock.contexts).toContain(v);
    });

    it("reloads but does not play for a reduced-motion visitor who never pressed play", () => {
      motion.reduce = true;
      render(<Hero />);
      const v = heroVideo();
      setCurrentSrc(v, `http://localhost:3000${HERO_PORTRAIT}`);
      act(() => fireMediaChange(PORTRAIT_QUERY, false));
      expect(load).toHaveBeenCalledTimes(1);
      expect(play).not.toHaveBeenCalled();
    });

    it("does nothing when the current file already matches the new orientation", () => {
      render(<Hero />);
      const v = heroVideo();
      setCurrentSrc(v, `http://localhost:3000${HERO_LANDSCAPE}`);
      play.mockClear();

      act(() => fireMediaChange(PORTRAIT_QUERY, false));

      expect(load).not.toHaveBeenCalled();
      expect(play).not.toHaveBeenCalled();
      expect(v).not.toHaveAttribute("src");
    });

    it("shows paused state if play() after the swap is refused", async () => {
      render(<Hero />);
      const v = heroVideo();
      setCurrentSrc(v, `http://localhost:3000${HERO_PORTRAIT}`);
      play.mockReturnValueOnce(Promise.reject(new DOMException("blocked", "NotAllowedError")));
      act(() => fireMediaChange(PORTRAIT_QUERY, false));
      await flush();
      expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    });

    it("subscribes once and removes the listener on unmount", () => {
      const { rerender, unmount } = render(<Hero />);
      expect(portraitListeners()).toBe(1);
      fireEvent.click(pauseButton());
      fireEvent.click(pauseButton());
      rerender(<Hero />);
      expect(portraitListeners()).toBe(1);
      unmount();
      expect(portraitListeners()).toBe(0);
    });
  });

  describe("with data saver on (navigator.connection.saveData)", () => {
    afterEach(unstubConnection);

    it("starts paused: no play, videos paused, button pressed", async () => {
      stubConnection(true);
      render(<Hero />);
      expect(play).not.toHaveBeenCalled();
      expect(pause.mock.contexts).toContain(heroVideo());
      expect(pause.mock.contexts).toContain(thumbVideo());
      expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
      await animate(FIRST_LINE * 3);
      expect(subtitleEn()).toBe(subtitleLines[0].en);
      expect(subtitleView()).toBe("still");
    });

    it("lets the visitor opt in to playback, which starts the subtitles", async () => {
      stubConnection(true);
      render(<Hero />);
      fireEvent.click(pauseButton());
      expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
      expect(play.mock.contexts).toContain(heroVideo());
      await animate(FIRST_LINE);
      expect(subtitleEn()).toBe(subtitleLines[1].en);
    });

    it("plays when saveData is false", () => {
      stubConnection(false);
      render(<Hero />);
      expect(play.mock.contexts).toContain(heroVideo());
      expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    });

    it("follows a live saveData change and unsubscribes on unmount", () => {
      const connection = stubConnection(true);
      const { unmount } = render(<Hero />);
      expect(connection.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
      expect(play).not.toHaveBeenCalled();

      connection.saveData = false;
      act(() => connection.dispatchEvent(new Event("change")));
      expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
      expect(play.mock.contexts).toContain(heroVideo());

      unmount();
      expect(connection.removeEventListener).toHaveBeenCalledWith(
        "change",
        vi.mocked(connection.addEventListener).mock.calls[0][1],
      );
    });
  });

  describe("with prefers-reduced-motion: reduce", () => {
    beforeEach(() => {
      motion.reduce = true;
    });

    it("starts paused: no play, videos paused, button pressed", () => {
      render(<Hero />);
      expect(play).not.toHaveBeenCalled();
      expect(pause.mock.contexts).toContain(heroVideo());
      expect(pause.mock.contexts).toContain(thumbVideo());
      expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
      expect(pauseButton()).toHaveAccessibleName("Pause background video");
    });

    it("shows the first subtitle line without cycling", async () => {
      render(<Hero />);
      await animate(FIRST_LINE * 5);
      expect(subtitleEn()).toBe(subtitleLines[0].en);
      expect(subtitleView()).toBe("still");
    });

    it("lets the visitor opt in to playback, but the subtitles stay still", async () => {
      render(<Hero />);
      fireEvent.click(pauseButton());
      expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
      expect(play.mock.contexts).toContain(heroVideo());
      // SPEC item 6: reduced motion always shows the still first line, even when the video plays.
      await animate(FIRST_LINE * 2);
      expect(subtitleEn()).toBe(subtitleLines[0].en);
      expect(subtitleView()).toBe("still");
    });
  });
});

describe("Hero hydration", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;
  let onRecoverableError: ReturnType<typeof vi.fn<(error: unknown) => void>>;

  /** SSR the Hero (server snapshot: preference unknown), then hydrate it on the "client". */
  async function ssrThenHydrate() {
    container = document.createElement("div");
    container.innerHTML = renderToString(<Hero />);
    document.body.appendChild(container);
    // Server HTML: preference unknown, so the control starts pressed (paused).
    expect(container.querySelector("button")).toHaveAttribute("aria-pressed", "true");
    onRecoverableError = vi.fn<(error: unknown) => void>();
    await reactAct(async () => {
      root = hydrateRoot(container, <Hero />, { onRecoverableError });
    });
  }

  afterEach(() => {
    reactAct(() => root?.unmount());
    root = undefined;
    container?.remove();
  });

  it("never calls play() on either video for a reduced-motion visitor", async () => {
    motion.reduce = true;
    await ssrThenHydrate();
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();

    const [hero, thumb] = Array.from(container.querySelectorAll("video"));
    expect(pause.mock.contexts).toContain(hero);
    expect(pause.mock.contexts).toContain(thumb);
    expect(container.querySelector("button")).toHaveAttribute("aria-pressed", "true");

    await animate(FIRST_LINE * 3);
    expect(container.querySelector('[data-testid="subtitle-en"]')).toHaveTextContent(subtitleLines[0].en);
    expect(container.querySelector('[data-testid="subtitles"]')).toHaveAttribute("data-view", "still");
  });

  it("never calls play() on either video for a data-saver visitor", async () => {
    stubConnection(true);
    try {
      await ssrThenHydrate();
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(play).not.toHaveBeenCalled();

      const [hero, thumb] = Array.from(container.querySelectorAll("video"));
      expect(pause.mock.contexts).toContain(hero);
      expect(pause.mock.contexts).toContain(thumb);
      expect(container.querySelector("button")).toHaveAttribute("aria-pressed", "true");

      await animate(FIRST_LINE * 3);
      expect(play).not.toHaveBeenCalled();
      expect(container.querySelector('[data-testid="subtitles"]')).toHaveAttribute("data-view", "still");
    } finally {
      unstubConnection();
    }
  });

  it("calls play() on both videos after hydration when motion is allowed", async () => {
    motion.reduce = false;
    await ssrThenHydrate();
    expect(onRecoverableError).not.toHaveBeenCalled();

    const [hero, thumb] = Array.from(container.querySelectorAll("video"));
    expect(play.mock.contexts).toContain(hero);
    expect(play.mock.contexts).toContain(thumb);
    expect(pause).not.toHaveBeenCalled();
    expect(container.querySelector("button")).toHaveAttribute("aria-pressed", "false");

    await animate(FIRST_LINE);
    expect(container.querySelector('[data-testid="subtitle-en"]')).toHaveTextContent(subtitleLines[1].en);
  });
});
