import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  INTRO_KEY,
  INTRO_MS,
  INTRO_SCRIPT,
  LOAD_MAX_MS,
  LOAD_MIN_MS,
  VIDEO_WAIT_MS,
  decideIntro,
  startPlay,
} from "@/lib/homeIntro";
import { motion } from "../vitest.setup";

const root = document.documentElement;
const intro = () => root.dataset.homeIntro;
const introAt = () => root.dataset.homeIntroAt;

/** Window listeners the script adds; removed after each test so one run can't leak into the next. */
let added: [string, EventListenerOrEventListenerObject][] = [];

/** Run the <head> script as the browser would, against jsdom's globals. */
const runScript = () => new Function(INTRO_SCRIPT)();
const advance = (ms: number) => vi.advanceTimersByTime(ms);
const fireLoad = () => window.dispatchEvent(new Event("load"));

/** A stand-in for Hero's video, with the given readyState (jsdom's is always 0). */
function heroVideo(readyState: number) {
  const v = document.createElement("video");
  v.dataset.testid = "hero-video";
  Object.defineProperty(v, "readyState", { configurable: true, get: () => readyState });
  document.body.append(v);
  return v;
}

/** Pretend the tab is in the background (or shown again). */
function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  if (!hidden) document.dispatchEvent(new Event("visibilitychange"));
}

function reset() {
  delete root.dataset.homeIntro;
  delete root.dataset.homeIntroAt;
  sessionStorage.clear();
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
}

beforeEach(() => {
  reset();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance", "Date"] });
  added = [];
  const real = window.addEventListener.bind(window);
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    if (listener) added.push([type, listener]);
    real(type, listener, options);
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  setHidden(false);
  for (const [type, listener] of added) window.removeEventListener(type, listener);
  vi.clearAllTimers();
  vi.useRealTimers();
  reset();
});

describe("homeIntro constants", () => {
  it("has the documented timings", () => {
    expect({ INTRO_MS, LOAD_MIN_MS, LOAD_MAX_MS, VIDEO_WAIT_MS }).toEqual({
      INTRO_MS: 6500,
      LOAD_MIN_MS: 1600,
      LOAD_MAX_MS: 8000,
      VIDEO_WAIT_MS: 2500,
    });
  });

  it("embeds the same key and timings in the head script", () => {
    expect(INTRO_SCRIPT).toContain(JSON.stringify(INTRO_KEY));
    for (const ms of [LOAD_MIN_MS, LOAD_MAX_MS, VIDEO_WAIT_MS]) expect(INTRO_SCRIPT).toContain(String(ms));
  });
});

describe("decideIntro", () => {
  it('returns "load" the first time in a session and records it', () => {
    expect(decideIntro()).toBe("load");
    expect(sessionStorage.getItem(INTRO_KEY)).toBe("1");
  });

  it("skips once it has been seen this session", () => {
    expect(decideIntro()).toBe("load");
    expect(decideIntro()).toBe("skip");
  });

  it("skips for reduced motion without recording a visit", () => {
    motion.reduce = true;
    expect(decideIntro()).toBe("skip");
    expect(sessionStorage.getItem(INTRO_KEY)).toBeNull();
  });

  it("skips when sessionStorage throws on read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(decideIntro()).toBe("skip");
  });

  it("skips when sessionStorage throws on write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(decideIntro()).toBe("skip");
  });

  it("does not touch <html> (the caller does)", () => {
    decideIntro();
    expect(intro()).toBeUndefined();
    expect(introAt()).toBeUndefined();
  });
});

describe("startPlay", () => {
  it('moves "load" to "play" and records when', () => {
    root.dataset.homeIntro = "load";
    advance(1234);
    startPlay();
    expect(intro()).toBe("play");
    expect(Number(introAt())).toBe(performance.now());
  });

  it("in a background tab, waits until the tab is shown and times from then", () => {
    root.dataset.homeIntro = "load";
    setHidden(true);
    startPlay();
    advance(4000);
    expect(intro()).toBe("load");
    setHidden(false);
    expect(intro()).toBe("play");
    expect(Number(introAt())).toBe(performance.now());
  });

  it.each([undefined, "skip", "play"])("does nothing when the state is %s", (state) => {
    if (state) root.dataset.homeIntro = state;
    if (state === "play") root.dataset.homeIntroAt = "5";
    advance(100);
    startPlay();
    expect(intro()).toBe(state);
    expect(introAt()).toBe(state === "play" ? "5" : undefined);
  });
});

describe("INTRO_SCRIPT", () => {
  it("is valid JavaScript that runs without throwing", () => {
    expect(runScript).not.toThrow();
  });

  it('sets "load" on Home the first time, records the visit, and no start time yet', () => {
    runScript();
    expect(intro()).toBe("load");
    expect(introAt()).toBeUndefined();
    expect(sessionStorage.getItem(INTRO_KEY)).toBe("1");
  });

  it('sets "skip" on Home once seen this session, and never plays', () => {
    sessionStorage.setItem(INTRO_KEY, "1");
    runScript();
    expect(intro()).toBe("skip");
    fireLoad();
    advance(LOAD_MAX_MS * 2);
    expect(intro()).toBe("skip");
    expect(introAt()).toBeUndefined();
  });

  it('sets "skip" for reduced motion and records nothing', () => {
    motion.reduce = true;
    runScript();
    expect(intro()).toBe("skip");
    expect(sessionStorage.getItem(INTRO_KEY)).toBeNull();
    advance(LOAD_MAX_MS * 2);
    expect(intro()).toBe("skip");
  });

  it('sets "skip" when storage throws', () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    runScript();
    expect(intro()).toBe("skip");
  });

  it.each(["/menu", "/about", "/menu/"])("does nothing on %s: undecided, nothing recorded, no listeners or timers", (path) => {
    window.history.replaceState(null, "", path);
    runScript();
    expect(intro()).toBeUndefined();
    expect(sessionStorage.getItem(INTRO_KEY)).toBeNull();
    expect(added).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("agrees with decideIntro: a visit recorded by the script makes decideIntro skip", () => {
    runScript();
    expect(decideIntro()).toBe("skip");
  });

  describe("load → play", () => {
    it("waits for LOAD_MIN_MS when the page and film are ready early", () => {
      heroVideo(2);
      runScript();
      advance(300);
      fireLoad();
      advance(LOAD_MIN_MS - 300 - 1);
      expect(intro()).toBe("load");
      advance(1);
      expect(intro()).toBe("play");
      expect(Number(introAt())).toBe(LOAD_MIN_MS);
    });

    it("plays as soon as the page loads after LOAD_MIN_MS (film already has a frame)", () => {
      heroVideo(4);
      runScript();
      advance(3000);
      expect(intro()).toBe("load");
      fireLoad();
      advance(0);
      expect(intro()).toBe("play");
      expect(Number(introAt())).toBe(3000);
    });

    it("plays on window load when there is no hero video at all", () => {
      runScript();
      advance(2000);
      fireLoad();
      advance(0);
      expect(intro()).toBe("play");
    });

    it("does not play before window load, even if the film is ready", () => {
      heroVideo(4);
      runScript();
      advance(LOAD_MAX_MS - 1);
      expect(intro()).toBe("load");
    });

    it("waits for loadeddata when the film has no frame at load", () => {
      const v = heroVideo(1);
      runScript();
      advance(2000);
      fireLoad();
      advance(1000);
      expect(intro()).toBe("load");
      v.dispatchEvent(new Event("loadeddata"));
      advance(0);
      expect(intro()).toBe("play");
      expect(Number(introAt())).toBe(3000);
    });

    it("still honours LOAD_MIN_MS when loadeddata comes early", () => {
      const v = heroVideo(0);
      runScript();
      fireLoad();
      advance(500);
      v.dispatchEvent(new Event("loadeddata"));
      advance(LOAD_MIN_MS - 500 - 1);
      expect(intro()).toBe("load");
      advance(1);
      expect(intro()).toBe("play");
    });

    it("gives up on the film VIDEO_WAIT_MS after window load", () => {
      heroVideo(0);
      runScript();
      advance(1000);
      fireLoad();
      advance(VIDEO_WAIT_MS - 1);
      expect(intro()).toBe("load");
      advance(1);
      // The fallback marks the film ready, then hands over on a 0ms timeout
      // (which fake timers run 1ms later when it is set inside a tick).
      advance(1);
      expect(intro()).toBe("play");
      expect(Number(introAt()) - (1000 + VIDEO_WAIT_MS)).toBeLessThanOrEqual(1);
    });

    it("plays at LOAD_MAX_MS however slow the page is", () => {
      heroVideo(0);
      runScript();
      advance(LOAD_MAX_MS - 1);
      expect(intro()).toBe("load");
      advance(1);
      expect(intro()).toBe("play");
      expect(Number(introAt())).toBe(LOAD_MAX_MS);
    });

    it("caps at LOAD_MAX_MS even if window load fired but the film is still waiting", () => {
      heroVideo(0);
      runScript();
      advance(7000);
      fireLoad();
      advance(LOAD_MAX_MS - 7000);
      expect(intro()).toBe("play");
      expect(Number(introAt())).toBe(LOAD_MAX_MS);
    });

    it("sets the start time once: later triggers don't move it", () => {
      const v = heroVideo(0);
      runScript();
      fireLoad();
      advance(VIDEO_WAIT_MS + 1);
      expect(intro()).toBe("play");
      const at = introAt();
      v.dispatchEvent(new Event("loadeddata"));
      fireLoad();
      advance(LOAD_MAX_MS);
      expect(intro()).toBe("play");
      expect(introAt()).toBe(at);
    });

    it("in a background tab, holds the loader until the tab is shown", () => {
      heroVideo(4);
      setHidden(true);
      runScript();
      fireLoad();
      advance(LOAD_MAX_MS * 2);
      expect(intro()).toBe("load");
      setHidden(false);
      expect(intro()).toBe("play");
      expect(Number(introAt())).toBe(performance.now());
    });

    it.each(["pointerdown", "keydown"])("a %s skips from the first frame, before React loads", (type) => {
      runScript();
      window.dispatchEvent(new Event(type));
      expect(intro()).toBe("skip");
      fireLoad();
      advance(LOAD_MAX_MS * 2);
      expect(intro()).toBe("skip");
    });

    it("a click after the intro has ended leaves it ended", () => {
      runScript();
      root.dataset.homeIntro = "skip";
      window.dispatchEvent(new Event("pointerdown"));
      expect(intro()).toBe("skip");
    });

    it("never plays once skipped during loading", () => {
      const v = heroVideo(0);
      runScript();
      advance(500);
      root.dataset.homeIntro = "skip";
      fireLoad();
      v.dispatchEvent(new Event("loadeddata"));
      advance(LOAD_MAX_MS * 2);
      expect(intro()).toBe("skip");
      expect(introAt()).toBeUndefined();
    });
  });
});
