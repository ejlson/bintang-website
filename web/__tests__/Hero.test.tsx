import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { act as reactAct } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { HERO_LANDSCAPE, HERO_PORTRAIT, Hero, PORTRAIT_QUERY } from "@/components/Hero";
import { CHRISTMAS_ENDS } from "@/lib/promo";
import { fireMediaChange, mediaListeners, motion } from "../vitest.setup";

/** After the Christmas 2026 promotion: the About thumbnail is back in the corner. */
const AFTER_CHRISTMAS = new Date("2027-01-02T12:00:00Z");

const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
const pause = HTMLMediaElement.prototype.pause as unknown as ReturnType<typeof vi.fn>;

const heroVideo = () => screen.getByTestId("hero-video") as HTMLVideoElement;
const thumbVideo = () => screen.getByRole("link", { name: "Watch our story" }).querySelector("video") as HTMLVideoElement;
const pauseButton = () => screen.getByRole("button", { name: /background video/ });

/** Seconds of animation/timers to run in "stays paused" checks (several former subtitle lines' worth). */
const A_WHILE = 6;

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
  // The thumbnail tests below describe Home outside the Christmas promotion
  // (see "Christmas 2026 promotion" for the corner mini that replaces it).
  vi.setSystemTime(AFTER_CHRISTMAS);
  play.mockClear();
  pause.mockClear();
  // Hero renders HomeTitle, which records the intro on <html> and in sessionStorage.
  delete document.documentElement.dataset.homeIntro;
  sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  motion.reduce = false;
  delete document.documentElement.dataset.homeIntro;
  sessionStorage.clear();
});

describe("Hero", () => {
  it("has a visually hidden H1 with the restaurant message", () => {
    render(<Hero />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Welcome to Bintang — London’s oldest Filipino restaurant, Kentish Town since 1987");
    expect(h1).not.toHaveTextContent(/Camden/);
    expect(h1).toHaveClass("sr-only");
    expect(screen.getByRole("region", { name: /Welcome to Bintang/ })).toContainElement(h1);
  });

  it("does not render the karaoke subtitles (they live on the Karaoke page only)", () => {
    render(<Hero />);
    expect(screen.queryByTestId("subtitles")).toBeNull();
    expect(screen.queryByTestId("subtitle-en")).toBeNull();
    expect(serverMarkup().querySelector('[data-testid="subtitles"]')).toBeNull();
  });

  it("renders the decorative HomeTitle poster inside the hero region", () => {
    render(<Hero />);
    const title = screen.getByTestId("home-title");
    expect(title).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("region", { name: /Welcome to Bintang/ })).toContainElement(title);
    // Only one H1: the poster's words are decorative paragraphs.
    expect(screen.getAllByRole("heading")).toHaveLength(1);
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

  it("ships the muted attribute in the server HTML for the hero video (autoplay needs it before hydration)", () => {
    // React's client renderer only sets the `muted` property, which setPlaying() also
    // does; the server HTML is where the JSX `muted` prop becomes a real attribute.
    // The thumbnail isn't in the server HTML at all: whether it or the Christmas
    // mini shows is decided from the visitor's clock after hydration.
    const html = serverMarkup();
    const videos = Array.from(html.querySelectorAll("video"));
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveAttribute("data-testid", "hero-video");
    for (const v of videos) {
      expect(v).toHaveAttribute("muted");
      expect(v.defaultMuted).toBe(true);
    }
    expect(html.querySelector('a[href="/about"]')).toBeNull();
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
    expect(cssUrls).toEqual(expect.arrayContaining(["/media/hero-poster.webp", "/media/hero-poster-portrait.webp"]));
    for (const u of [...markupUrls, ...cssUrls]) expect(existsSync(join(process.cwd(), "public", u)), u).toBe(true);
  });

  it("swaps the CSS poster with the same orientation query the video uses", () => {
    const css = heroCss();
    const block = css.slice(css.indexOf(`@media ${PORTRAIT_QUERY}`));
    expect(block).not.toBe(css); // the query is present
    expect(block.slice(0, block.indexOf("}"))).toContain('url("/media/hero-poster-portrait.webp")');
  });

  it("gives the thumbnail video its own poster", () => {
    render(<Hero />);
    expect(thumbVideo()).toHaveAttribute("poster", "/media/about-thumb-poster.webp");
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

  it("pause button pauses both videos and flips aria-pressed (fixed label)", async () => {
    render(<Hero />);
    play.mockClear();
    fireEvent.click(pauseButton());

    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    // State is conveyed by aria-pressed only; the name never changes.
    expect(pauseButton()).toHaveAccessibleName("Pause background video");
    expect(pause.mock.contexts).toContain(heroVideo());
    expect(pause.mock.contexts).toContain(thumbVideo());
    expect(play).not.toHaveBeenCalled();

    // Stays paused: nothing restarts playback on its own.
    await animate(A_WHILE);
    expect(play).not.toHaveBeenCalled();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
  });

  it("pressing again resumes both videos", async () => {
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
    await animate(A_WHILE);
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");

    // The visitor can still try again: pressing resumes.
    play.mockClear();
    fireEvent.click(pauseButton());
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(play.mock.contexts).toContain(heroVideo());
  });

  it("ignores AbortError from play(): stays playing", async () => {
    play.mockReturnValueOnce(Promise.reject(new DOMException("interrupted", "AbortError")));
    render(<Hero />);
    await flush();

    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(pause).not.toHaveBeenCalled();
    await animate(A_WHILE);
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
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
    await animate(A_WHILE);
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
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
      await animate(A_WHILE);
      expect(play).not.toHaveBeenCalled();
      expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    });

    it("lets the visitor opt in to playback", async () => {
      stubConnection(true);
      render(<Hero />);
      fireEvent.click(pauseButton());
      expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
      expect(play.mock.contexts).toContain(heroVideo());
      expect(play.mock.contexts).toContain(thumbVideo());
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

    it("stays paused over time (nothing autoplays later)", async () => {
      render(<Hero />);
      await animate(A_WHILE);
      expect(play).not.toHaveBeenCalled();
      expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    });

    it("lets the visitor opt in to playback", () => {
      render(<Hero />);
      fireEvent.click(pauseButton());
      expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
      expect(play.mock.contexts).toContain(heroVideo());
      expect(play.mock.contexts).toContain(thumbVideo());
    });

    it("skips the Home title intro", () => {
      render(<Hero />);
      expect(document.documentElement.dataset.homeIntro).toBe("skip");
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

    await animate(A_WHILE);
    expect(play).not.toHaveBeenCalled();
    expect(container.querySelector("button")).toHaveAttribute("aria-pressed", "true");
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

      await animate(A_WHILE);
      expect(play).not.toHaveBeenCalled();
      expect(container.querySelector("button")).toHaveAttribute("aria-pressed", "true");
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
    expect(container.querySelector('[data-testid="subtitles"]')).toBeNull();
    expect(container.querySelector('[data-testid="home-title"]')).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Hero: Christmas 2026 promotion", () => {
  const mini = () => screen.queryByRole("button", { name: "Christmas at Bintang: see the offer" });
  const thumbLink = () => screen.queryByRole("link", { name: "Watch our story" });

  it("shows the Christmas corner mini instead of the About thumbnail while live", () => {
    vi.setSystemTime(CHRISTMAS_ENDS - 1); // 23:59:59.999 on 31 Dec 2026 (GMT)
    render(<Hero />);
    expect(mini()).toBeInTheDocument();
    // It keeps the thumbnail's intro behaviour.
    expect(mini()).toHaveClass("hud");
    expect(thumbLink()).toBeNull();
    // Only the hero film: no thumbnail video while the promo is live.
    expect(document.querySelectorAll("video")).toHaveLength(1);
    expect(play.mock.contexts).toEqual([heroVideo()]);
  });

  it("brings the About thumbnail back from midnight on 1 January 2027", () => {
    vi.setSystemTime(CHRISTMAS_ENDS);
    render(<Hero />);
    expect(mini()).toBeNull();
    expect(thumbLink()).toHaveAttribute("href", "/about");
    expect(play.mock.contexts).toContain(thumbVideo());
  });

  it("puts neither the mini nor the thumbnail in the server HTML, live or not", () => {
    for (const now of [CHRISTMAS_ENDS - 1, CHRISTMAS_ENDS]) {
      vi.setSystemTime(now);
      const html = serverMarkup();
      expect(html.querySelector('a[href="/about"]')).toBeNull();
      expect(html.querySelector('[aria-haspopup="dialog"]')).toBeNull();
    }
  });

  it("hydrates without a mismatch and then shows the mini while live", async () => {
    vi.setSystemTime(new Date("2026-12-01T12:00:00Z"));
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Hero />);
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();
    let root: Root | undefined;
    try {
      await reactAct(async () => {
        root = hydrateRoot(container, <Hero />, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector('[aria-haspopup="dialog"]')).toHaveAccessibleName(
        "Christmas at Bintang: see the offer",
      );
      expect(container.querySelector('a[href="/about"]')).toBeNull();
    } finally {
      reactAct(() => root?.unmount());
      container.remove();
    }
  });
});

describe("Hero: the Christmas mini follows the film's paused state (data-still)", () => {
  const mini = () => screen.getByRole("button", { name: "Christmas at Bintang: see the offer" });
  beforeEach(() => {
    vi.setSystemTime(CHRISTMAS_ENDS - 1);
  });

  it("sways while the film plays, and stills when the visitor presses pause (and back)", () => {
    render(<Hero />);
    expect(mini()).not.toHaveAttribute("data-still");
    fireEvent.click(pauseButton());
    expect(mini()).toHaveAttribute("data-still", "true");
    fireEvent.click(pauseButton());
    expect(mini()).not.toHaveAttribute("data-still");
  });

  it("starts still for a reduced-motion visitor", () => {
    motion.reduce = true;
    render(<Hero />);
    expect(mini()).toHaveAttribute("data-still", "true");
  });

  it("starts still for a data-saver visitor", () => {
    stubConnection(true);
    try {
      render(<Hero />);
      expect(mini()).toHaveAttribute("data-still", "true");
    } finally {
      unstubConnection();
    }
  });

  it("stills when the browser refuses playback", async () => {
    play.mockReturnValueOnce(Promise.reject(new DOMException("blocked", "NotAllowedError")));
    render(<Hero />);
    await flush();
    expect(mini()).toHaveAttribute("data-still", "true");
  });
});
