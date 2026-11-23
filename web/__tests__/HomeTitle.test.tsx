import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { INTRO_KEY, INTRO_MS, LOAD_MIN_MS, startPlay } from "@/lib/homeIntro";
import { motion } from "../vitest.setup";

const root = document.documentElement;
const intro = () => root.dataset.homeIntro;

/**
 * HomeTitle keeps `loadingTimer` and `leftAt` in module state (once per
 * document), so each test gets a fresh copy of the module.
 */
async function loadHomeTitle() {
  vi.resetModules();
  return (await import("@/components/HomeTitle")).HomeTitle;
}

/**
 * Advance fake time inside an async act, so the MutationObserver's callback
 * (a microtask in jsdom) runs before we look.
 */
const advance = (ms: number) =>
  act(async () => {
    vi.advanceTimersByTime(ms);
  });
/** Let pending MutationObserver callbacks run. */
const flush = () => act(async () => {});

/** What the head script does when it hands over: start time, then "play". */
function scriptPlays(at = performance.now()) {
  root.dataset.homeIntroAt = String(at);
  root.dataset.homeIntro = "play";
}

function reset() {
  delete root.dataset.homeIntro;
  delete root.dataset.homeIntroAt;
  sessionStorage.clear();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance", "Date"] });
  reset();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
  reset();
});

describe("HomeTitle markup", () => {
  it("renders the decorative poster, hidden from assistive tech", async () => {
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    const title = screen.getByTestId("home-title");
    expect(title).toHaveAttribute("aria-hidden", "true");
    for (const text of ["Welcome", "To", "Bintang", "Maginhawa Group", "Kentish", "1987"]) {
      expect(title).toHaveTextContent(text);
    }
    expect(title.querySelector("h1, h2, h3, a, button")).toBeNull();
  });

  it("renders the loader: the lion (body and tail clipped from the shared art) and a spinner", async () => {
    const { ART, VIEWBOX } = await import("@/components/FooterLion");
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    const title = screen.getByTestId("home-title");
    const svg = title.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", VIEWBOX);
    const clipIds = Array.from(svg.querySelectorAll("clipPath")).map((c) => c.id);
    expect(clipIds).toHaveLength(2);
    const uses = Array.from(svg.querySelectorAll("use"));
    expect(uses.map((u) => u.getAttribute("href"))).toEqual([ART, ART]);
    expect(uses.map((u) => u.getAttribute("clip-path"))).toEqual(clipIds.map((id) => `url(#${id})`));
    // Ids are safe inside url(#…): no colons or other characters React's useId adds.
    for (const id of clipIds) expect(id).toMatch(/^[\w-]+$/);
    expect(title.querySelector(".spinner")).not.toBeNull();
  });

  it("gives each instance its own clip-path ids", async () => {
    const HomeTitle = await loadHomeTitle();
    render(
      <>
        <HomeTitle />
        <HomeTitle />
      </>,
    );
    const ids = Array.from(document.querySelectorAll("clipPath")).map((c) => c.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it("server-renders without touching <html> (the head script decides first)", async () => {
    const HomeTitle = await loadHomeTitle();
    const html = renderToString(<HomeTitle />);
    expect(html).toContain('data-testid="home-title"');
    expect(intro()).toBeUndefined();
  });
});

describe("HomeTitle intro state", () => {
  it('unset (client navigation): "load", then "play" after LOAD_MIN_MS, then "skip" INTRO_MS later', async () => {
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    expect(intro()).toBe("load");
    expect(sessionStorage.getItem(INTRO_KEY)).toBe("1");

    await advance(LOAD_MIN_MS - 1);
    expect(intro()).toBe("load");
    await advance(1);
    expect(intro()).toBe("play");
    expect(Number(root.dataset.homeIntroAt)).toBe(LOAD_MIN_MS);

    await advance(INTRO_MS - 1);
    expect(intro()).toBe("play");
    await advance(1);
    expect(intro()).toBe("skip");
  });

  it("unset and already seen this session: skip", async () => {
    sessionStorage.setItem(INTRO_KEY, "1");
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    expect(intro()).toBe("skip");
    await advance(LOAD_MIN_MS + INTRO_MS);
    expect(intro()).toBe("skip");
  });

  it("unset and reduced motion: skip", async () => {
    motion.reduce = true;
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    expect(intro()).toBe("skip");
  });

  it('script-set "play" ends INTRO_MS after its data-home-intro-at, not after mount', async () => {
    await advance(1000);
    scriptPlays();
    await advance(2000);
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    await advance(INTRO_MS - 2000 - 1);
    expect(intro()).toBe("play");
    await advance(1);
    expect(intro()).toBe("skip");
  });

  it('script-set "play" past its INTRO_MS ends straight away', async () => {
    await advance(1000);
    scriptPlays();
    await advance(INTRO_MS + 500);
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    await advance(0);
    expect(intro()).toBe("skip");
  });

  it.each([
    ["missing", undefined],
    ["not a number", "soon"],
    ["in the future", "999999"],
  ])('"play" with a start time that is %s counts from mount', async (_label, at) => {
    await advance(500);
    root.dataset.homeIntro = "play";
    if (at !== undefined) root.dataset.homeIntroAt = at;
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    await advance(INTRO_MS - 1);
    expect(intro()).toBe("play");
    await advance(1);
    expect(intro()).toBe("skip");
  });

  it('script-set "load": HomeTitle leaves the hand-over to the script, then ends INTRO_MS after it', async () => {
    root.dataset.homeIntro = "load";
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    // No loader timer of its own: the script decides when loading is done.
    await advance(LOAD_MIN_MS * 3);
    expect(intro()).toBe("load");

    scriptPlays();
    await flush();
    await advance(INTRO_MS - 1);
    expect(intro()).toBe("play");
    await advance(1);
    expect(intro()).toBe("skip");
  });

  it("arms only one end timer however often the attribute changes", async () => {
    root.dataset.homeIntro = "load";
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    scriptPlays();
    await flush();
    // Writing "play" again (and a later start time) doesn't restart the clock.
    await advance(1000);
    scriptPlays();
    await flush();
    await advance(INTRO_MS - 1000);
    expect(intro()).toBe("skip");
  });

  it.each([
    ["keydown", () => fireEvent.keyDown(window, { key: "Escape" })],
    ["pointerdown", () => fireEvent.pointerDown(window)],
  ])("skips to the end on the first %s while playing", async (_name, fire) => {
    scriptPlays();
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    await advance(1000);
    expect(intro()).toBe("play");
    act(() => fire());
    expect(intro()).toBe("skip");
  });

  it.each([
    ["keydown", () => fireEvent.keyDown(window, { key: " " })],
    ["pointerdown", () => fireEvent.pointerDown(window)],
  ])("a %s during the loader skips, and its loader timer never flips it to play", async (_name, fire) => {
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    expect(intro()).toBe("load");
    await advance(500);
    act(() => fire());
    expect(intro()).toBe("skip");
    await advance(LOAD_MIN_MS + INTRO_MS);
    expect(intro()).toBe("skip");
    expect(root.dataset.homeIntroAt).toBeUndefined();
  });

  it("startPlay after a skip does nothing (the guard the loader timer relies on)", async () => {
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    fireEvent.keyDown(window, { key: "a" });
    startPlay();
    expect(intro()).toBe("skip");
  });

  it('leaves "skip" alone: no timers, no listeners, no visit recorded', async () => {
    root.dataset.homeIntro = "skip";
    const add = vi.spyOn(window, "addEventListener");
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    const types = add.mock.calls.map(([type]) => type);
    expect(types).not.toContain("keydown");
    expect(types).not.toContain("pointerdown");
    expect(vi.getTimerCount()).toBe(0);
    expect(sessionStorage.getItem(INTRO_KEY)).toBeNull();
    // Not watching <html> either: a later "play" is not ended by it.
    scriptPlays();
    await advance(INTRO_MS * 2);
    expect(intro()).toBe("play");
  });

  it("removes its timer, listeners and observer on unmount", async () => {
    root.dataset.homeIntro = "load";
    const remove = vi.spyOn(window, "removeEventListener");
    const HomeTitle = await loadHomeTitle();
    const { unmount } = render(<HomeTitle />);
    unmount();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(["keydown", "pointerdown"]));
    // The observer is gone: a later "play" arms nothing.
    scriptPlays();
    await advance(INTRO_MS * 2);
    expect(intro()).toBe("play");
    fireEvent.keyDown(window, { key: "a" });
    expect(intro()).toBe("play");
  });

  it("survives a StrictMode double effect run: one visit, one loader, one end", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const HomeTitle = await loadHomeTitle();
    render(
      <StrictMode>
        <HomeTitle />
      </StrictMode>,
    );
    expect(intro()).toBe("load");
    expect(setItem).toHaveBeenCalledTimes(1);
    await advance(LOAD_MIN_MS);
    expect(intro()).toBe("play");
    await advance(INTRO_MS - 1);
    expect(intro()).toBe("play");
    await advance(1);
    expect(intro()).toBe("skip");
  });
});

describe("HomeTitle re-mount (back on Home mid-intro)", () => {
  it.each(["load", "play"])('skips at once when re-mounted more than 50ms after leaving during "%s"', async (state) => {
    if (state === "play") scriptPlays();
    else root.dataset.homeIntro = "load";
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />).unmount();
    await advance(51);
    render(<HomeTitle />);
    expect(intro()).toBe("skip");
  });

  it("keeps going when re-mounted within 50ms, ending on the original schedule", async () => {
    scriptPlays();
    const HomeTitle = await loadHomeTitle();
    const first = render(<HomeTitle />);
    await advance(400);
    first.unmount();
    await advance(50);
    render(<HomeTitle />);
    expect(intro()).toBe("play");
    await advance(INTRO_MS - 450 - 1);
    expect(intro()).toBe("play");
    await advance(1);
    expect(intro()).toBe("skip");
  });

  it("a first mount is never treated as a re-mount", async () => {
    await advance(10_000);
    scriptPlays();
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />);
    expect(intro()).toBe("play");
  });

  it('a re-mount after the intro ended leaves "skip" as is', async () => {
    scriptPlays();
    const HomeTitle = await loadHomeTitle();
    render(<HomeTitle />).unmount();
    root.dataset.homeIntro = "skip";
    await advance(5000);
    render(<HomeTitle />);
    expect(intro()).toBe("skip");
    expect(vi.getTimerCount()).toBe(0);
  });
});
