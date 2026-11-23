import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { useEffect, useState, type ComponentProps } from "react";
import {
  OPEN_POST,
  PageTransition,
  HistoryWipe,
  SettleOnReveal,
  wipeRunning,
  alignWipeToScreen,
  settleEntrances,
  translateYOf,
  wipeShapeFor,
} from "@/components/PageTransition";
import { JournalPage } from "@/components/JournalPage";
import { posts } from "@/lib/journal";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

// Pass-through wrappers that record props, so we can check what reaches
// <ViewTransition> and next/link while still rendering the real components.
const recorded = vi.hoisted(() => ({ viewTransition: [] as unknown[], link: [] as unknown[] }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const Real = actual.ViewTransition;
  function ViewTransition(props: ComponentProps<typeof Real>) {
    recorded.viewTransition.push(props);
    return actual.createElement(Real, props);
  }
  return { ...actual, ViewTransition };
});

vi.mock("next/link", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/link")>();
  const React = await import("react");
  const Real = actual.default;
  function Link(props: ComponentProps<typeof Real>) {
    recorded.link.push(props);
    return React.createElement(Real, props);
  }
  return { ...actual, default: Link };
});

type VTProps = ComponentProps<typeof import("react").ViewTransition>;
type LinkProps = ComponentProps<typeof import("next/link").default>;
const lastViewTransition = () => recorded.viewTransition.at(-1) as VTProps;

afterEach(() => {
  nav.pathname = "/";
  recorded.viewTransition.length = 0;
  recorded.link.length = 0;
});

describe("wipeShapeFor", () => {
  it.each([
    ["/about", "/journal"],
    ["/journal", "/about"],
    ["/journal/karaoke-nights", "/journal"],
    ["/contact", "/gallery"],
    ["/about", "/"],
    ["/journal", "/"],
  ])("%s → %s is the top-to-bottom wipe", (from, to) => {
    expect(wipeShapeFor(from, to)).toBe("down");
  });

  it.each([
    ["/", "/about"],
    ["/", "/journal"],
    ["/", "/contact"],
    // Leaving Home wins over the menu rule.
    ["/", "/menu"],
    ["/", "/menu/drinks"],
    // Same-page navigations off Home are still "leaving Home" to this helper.
    ["/", "/"],
  ])("%s → %s splits from the centre (leaving Home)", (from, to) => {
    expect(wipeShapeFor(from, to)).toBe("split");
  });

  it.each([
    ["/menu", "/about"],
    ["/menu/drinks", "/journal"],
    ["/menu/", "/"],
    ["/about", "/menu"],
    ["/journal/karaoke-nights", "/menu/drinks"],
    ["/menu", "/menu/drinks"],
    ["/menu/drinks", "/menu"],
  ])("%s → %s is the slanted wipe (to or from the Menu)", (from, to) => {
    expect(wipeShapeFor(from, to)).toBe("slant");
  });

  it.each([
    // Prefix lookalikes are different routes, not the menu.
    "/menu-specials",
    "/menus",
    "/menuitem",
    // Only an exact /menu segment at the root counts.
    "/journal/menu",
    "/about/menu/",
    // Case-sensitive, like Next's routing.
    "/Menu",
    "/MENU/drinks",
    // Not a pathname Next would hand us, but must not throw.
    "",
    "menu",
  ])("does not treat %j as the menu, from either end", (path) => {
    expect(wipeShapeFor(path, "/about")).toBe("down");
    expect(wipeShapeFor("/about", path)).toBe("down");
  });

  it.each([
    ["/journal", "/journal/karaoke-nights"],
    ["/", "/journal/karaoke-nights"],
    ["/menu", "/journal/karaoke-nights"],
    ["/about", "/menu"],
  ])("OPEN_POST makes %s → %s an iris, over every other rule", (from, to) => {
    expect(wipeShapeFor(from, to, [OPEN_POST])).toBe("iris");
    expect(wipeShapeFor(from, to, ["other", OPEN_POST])).toBe("iris");
  });

  it("ignores unrelated transition types", () => {
    expect(wipeShapeFor("/about", "/journal", ["something-else"])).toBe("down");
    expect(wipeShapeFor("/", "/about", [])).toBe("split");
  });
});

describe("PageTransition", () => {
  it("OPEN_POST is the open-post transition type", () => {
    expect(OPEN_POST).toBe("open-post");
  });

  it("renders its children", () => {
    nav.pathname = "/about";
    render(
      <PageTransition>
        <main>
          <h1>About</h1>
        </main>
      </PageTransition>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("adds no wrapper element of its own around the children", () => {
    const { container } = render(
      <PageTransition>
        <p>one</p>
        <p>two</p>
      </PageTransition>,
    );
    expect([...container.children].map((el) => el.outerHTML)).toEqual(["<p>one</p>", "<p>two</p>"]);
  });

  it.each(["/", "/journal", "/menu", "/menu/drinks"])(
    "on %s passes exit/enter/default classes to ViewTransition",
    (path) => {
      nav.pathname = path;
      render(<PageTransition>x</PageTransition>);
      const props = lastViewTransition();
      expect(props.exit).toBe("page-out");
      expect(props.enter).toBe("page-under");
      expect(props.default).toBe("none");
      expect(props.update).toBeUndefined();
      expect(props.share).toBeUndefined();
      expect(typeof props.onExit).toBe("function");
    },
  );

  it("keeps the page mounted across pathname changes (route templates do the remounting)", () => {
    // Keying by pathname here would throw away the routes Next keeps alive for
    // back/forward. The template mounted per route segment gives exit + enter.
    let mounts = 0;
    function Page({ label }: { label: string }) {
      const [initial] = useState(label);
      useEffect(() => {
        mounts++;
      }, []);
      return <p>{initial}</p>;
    }

    nav.pathname = "/journal";
    const { rerender } = render(
      <PageTransition>
        <Page label="journal" />
      </PageTransition>,
    );
    nav.pathname = "/menu";
    rerender(
      <PageTransition>
        <Page label="menu" />
      </PageTransition>,
    );
    expect(mounts).toBe(1);
    expect(screen.getByText("journal")).toBeInTheDocument();
    expect(lastViewTransition().exit).toBe("page-out");
  });
});

describe("route templates", () => {
  it.each(["@/app/template", "@/app/contact/template", "@/app/journal/template"])("%s is PageTransition", async (path) => {
    const mod = await import(/* @vite-ignore */ path);
    expect(mod.default).toBe(PageTransition);
  });
});

describe("alignWipeToScreen", () => {
  const root = document.documentElement;
  afterEach(() => root.style.removeProperty("--vt-y"));
  const instance = (transform: string) =>
    ({ name: "_t_0_", group: { getComputedStyle: () => ({ transform }) } }) as unknown as Parameters<
      typeof alignWipeToScreen
    >[0];

  it.each([
    ["matrix(1, 0, 0, 1, 0, -1192)", "1192px"],
    ["matrix(1, 0, 0, 1, 0, -1192.4)", "1192px"],
    ["matrix(1, 0, 0, 1, 0, 0)", "0px"],
    ["matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -640, 0, 1)", "640px"],
    ["none", "0px"],
  ])("snapshot group at %s puts the mask at %s", (transform, expected) => {
    alignWipeToScreen(instance(transform));
    expect(root.style.getPropertyValue("--vt-y")).toBe(expected);
  });

  it("falls back to the top when the instance has no group pseudo-element", () => {
    alignWipeToScreen({ name: "x" } as Parameters<typeof alignWipeToScreen>[0]);
    expect(root.style.getPropertyValue("--vt-y")).toBe("0px");
  });

});

describe("PageTransition onExit", () => {
  const root = document.documentElement;
  type OnExit = NonNullable<VTProps["onExit"]>;
  const instance = (transform: string) =>
    ({ name: "_t_0_", group: { getComputedStyle: () => ({ transform }) } }) as unknown as Parameters<OnExit>[0];
  // The address bar already shows the destination when onExit runs.
  const setLocation = (path: string) => window.history.replaceState(window.history.state, "", path);
  const exitFrom = (from: string) => {
    nav.pathname = from;
    render(<PageTransition>x</PageTransition>);
    return lastViewTransition().onExit as OnExit;
  };
  afterEach(() => {
    delete root.dataset.wipe;
    root.style.removeProperty("--vt-y");
    setLocation("/");
  });

  it.each([
    ["/about", "/journal", [], "down"],
    ["/", "/about", [], "split"],
    ["/", "/menu", [], "split"],
    ["/menu", "/about", [], "slant"],
    ["/about", "/menu/drinks", [], "slant"],
    ["/about", "/menu-specials", [], "down"],
    ["/journal", "/journal/karaoke-nights", [OPEN_POST], "iris"],
    ["/", "/journal/karaoke-nights", [OPEN_POST], "iris"],
  ] as const)("%s → %s with types %j sets data-wipe=%s", (from, to, types, shape) => {
    const onExit = exitFrom(from);
    setLocation(to);
    onExit(instance("matrix(1, 0, 0, 1, 0, -800)"), [...types]);
    expect(root.dataset.wipe).toBe(shape);
    expect(root.getAttribute("data-wipe")).toBe(shape);
    expect(root.style.getPropertyValue("--vt-y")).toBe("800px");
  });

  it("aligns the mask to the screen too (--vt-y from the snapshot group)", () => {
    const onExit = exitFrom("/journal");
    setLocation("/about");
    onExit(instance("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -640, 0, 1)"), []);
    expect(root.style.getPropertyValue("--vt-y")).toBe("640px");
    expect(root.dataset.wipe).toBe("down");
  });

  it("reads the destination from window.location at exit time, not at render", () => {
    setLocation("/journal");
    const onExit = exitFrom("/about");
    setLocation("/menu"); // navigation happens after render
    onExit(instance("none"), []);
    expect(root.dataset.wipe).toBe("slant");
    expect(root.style.getPropertyValue("--vt-y")).toBe("0px");
  });

  it("overwrites the previous navigation's shape", () => {
    root.dataset.wipe = "iris";
    const onExit = exitFrom("/about");
    setLocation("/journal");
    onExit(instance("none"), []);
    expect(root.dataset.wipe).toBe("down");
  });
});

describe("settleEntrances", () => {
  // jsdom has no Web Animations API, so drive it with fakes. A class named
  // CSSAnimation gives the constructor.name the real ones have.
  const docTimeline = { kind: "document" };
  type Init = {
    timeline?: unknown;
    pseudoElement?: string | null;
    iterations?: number;
    currentTime?: number | null;
    playState?: string;
    effect?: null;
  };
  class CSSAnimation {
    finish = vi.fn();
    timeline: unknown;
    currentTime: number | null;
    playState: string;
    effect: { pseudoElement: string | null; getComputedTiming: () => { iterations: number } } | null;
    constructor(init: Init = {}) {
      this.timeline = "timeline" in init ? init.timeline : docTimeline;
      this.currentTime = "currentTime" in init ? (init.currentTime ?? null) : 0;
      this.playState = init.playState ?? "running";
      this.effect =
        "effect" in init
          ? null
          : { pseudoElement: init.pseudoElement ?? null, getComputedTiming: () => ({ iterations: init.iterations ?? 1 }) };
    }
  }
  class CSSTransition extends CSSAnimation {}
  class Animation extends CSSAnimation {}
  const fakeDoc = (animations: CSSAnimation[]) =>
    ({ timeline: docTimeline, getAnimations: () => animations }) as unknown as Document;

  it("finishes a finite CSS animation on the document timeline that has just started", () => {
    const a = new CSSAnimation();
    const b = new CSSAnimation({ currentTime: 50, iterations: 3 });
    const c = new CSSAnimation({ currentTime: null }); // pending: not started yet
    const d = new CSSAnimation({ pseudoElement: "::before" });
    settleEntrances(fakeDoc([a, b, c, d]));
    for (const x of [a, b, c, d]) expect(x.finish).toHaveBeenCalledTimes(1);
  });

  it.each<[string, () => CSSAnimation]>([
    ["a CSS transition", () => new CSSTransition()],
    ["a script (Web Animations) animation", () => new Animation()],
    ["a scroll-driven animation (other timeline)", () => new CSSAnimation({ timeline: { kind: "scroll" } })],
    ["an animation with no timeline", () => new CSSAnimation({ timeline: null })],
    ["an animation with no effect", () => new CSSAnimation({ effect: null })],
    ["a ::view-transition pseudo-element", () => new CSSAnimation({ pseudoElement: "::view-transition-old(root)" })],
    ["the ::view-transition root", () => new CSSAnimation({ pseudoElement: "::view-transition" })],
    ["an endless loop", () => new CSSAnimation({ iterations: Infinity })],
    ["one already mid-flight (> 50ms)", () => new CSSAnimation({ currentTime: 51 })],
    ["one well under way", () => new CSSAnimation({ currentTime: 800 })],
    ["one already finished", () => new CSSAnimation({ playState: "finished" })],
  ])("leaves %s alone", (_, make) => {
    const skipped = make();
    const settled = new CSSAnimation();
    settleEntrances(fakeDoc([skipped, settled]));
    expect(skipped.finish).not.toHaveBeenCalled();
    expect(settled.finish).toHaveBeenCalledTimes(1);
  });

  it("does nothing (and does not throw) without document.getAnimations", () => {
    expect(() => settleEntrances({ timeline: docTimeline } as unknown as Document)).not.toThrow();
    expect(() => settleEntrances(document)).not.toThrow(); // jsdom itself
  });

  it("copes with an empty animation list", () => {
    expect(() => settleEntrances(fakeDoc([]))).not.toThrow();
  });

  it("defaults to the global document", () => {
    const a = new CSSAnimation();
    const getAnimations = vi.fn(() => [a]);
    Object.defineProperty(document, "getAnimations", { value: getAnimations, configurable: true });
    Object.defineProperty(document, "timeline", { value: docTimeline, configurable: true });
    try {
      settleEntrances();
      expect(getAnimations).toHaveBeenCalledTimes(1);
      expect(a.finish).toHaveBeenCalledTimes(1);
    } finally {
      delete (document as { getAnimations?: unknown }).getAnimations;
      delete (document as { timeline?: unknown }).timeline;
    }
  });
});

describe("translateYOf", () => {
  it.each([
    [undefined, 0],
    ["", 0],
    ["none", 0],
    ["matrix(1, 0, 0, 1, 12, 34)", 34],
    ["matrix(1, 0, 0, 1, 0, garbage)", 0],
  ])("%s → %s", (input, out) => {
    expect(translateYOf(input)).toBe(out);
  });
});

describe("HistoryWipe (Back/Forward wipes)", () => {
  type Listener = (e: Event & { navigationType?: string }) => void;
  let entryKey = "a";
  let entryListeners: Listener[] = [];
  const fakeNavigation = {
    get currentEntry() {
      return { key: entryKey };
    },
    addEventListener: (_: string, fn: Listener) => entryListeners.push(fn),
    removeEventListener: (_: string, fn: Listener) => (entryListeners = entryListeners.filter((f) => f !== fn)),
  };
  const setPath = (path: string) => {
    window.history.replaceState(window.history.state, "", path);
    nav.pathname = path;
  };
  const entryChange = (key: string, navigationType: string) => {
    entryKey = key;
    const e = Object.assign(new Event("currententrychange"), { navigationType });
    entryListeners.forEach((fn) => fn(e));
  };
  const pop = (init: { hasUAVisualTransition?: boolean } = {}) => {
    const e = new PopStateEvent("popstate", { state: { __NA: true } });
    if (init.hasUAVisualTransition) Object.defineProperty(e, "hasUAVisualTransition", { value: true });
    window.dispatchEvent(e);
  };
  // Stand-in for Next's own (bubble-phase) popstate listener.
  let nextSaw: PopStateEvent[] = [];
  const nextListener = (e: PopStateEvent) => nextSaw.push(e);
  let scrollTo: ReturnType<typeof vi.fn>;

  const setup = () => {
    Object.defineProperty(window, "navigation", { value: fakeNavigation, configurable: true });
    scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 1));
    sessionStorage.clear();
    history.scrollRestoration = "auto";
    entryKey = "a";
    entryListeners = [];
    nextSaw = [];
    window.addEventListener("popstate", nextListener);
    setPath("/journal");
  };
  afterEach(() => {
    window.removeEventListener("popstate", nextListener);
    delete (window as { navigation?: unknown }).navigation;
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setPath("/");
  });
  const recordScroll = (y: number) => {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  };

  it("does nothing without the Navigation API", () => {
    setup();
    delete (window as { navigation?: unknown }).navigation;
    render(<HistoryWipe />);
    expect(history.scrollRestoration).toBe("auto");
    setPath("/menu");
    pop();
    expect(nextSaw).toHaveLength(1);
  });

  it("takes over scroll restoration, and hands it back on unmount", () => {
    setup();
    const { unmount } = render(<HistoryWipe />);
    expect(history.scrollRestoration).toBe("manual");
    unmount();
    expect(history.scrollRestoration).toBe("auto");
  });

  it("holds Back to another page and replays it to Next on the next task", () => {
    vi.useFakeTimers();
    setup();
    render(<HistoryWipe />);
    entryKey = "b";
    setPath("/journal/the-garden");
    pop();
    expect(nextSaw).toHaveLength(0); // not during the popstate event itself
    vi.runAllTimers();
    expect(nextSaw).toHaveLength(1);
    expect(nextSaw[0].state).toEqual({ __NA: true });
  });

  it("lets the browser's own swipe animation through untouched (plain cut)", () => {
    setup();
    render(<HistoryWipe />);
    setPath("/menu");
    pop({ hasUAVisualTransition: true });
    expect(nextSaw).toHaveLength(1);
  });

  it("restores the saved scroll in the commit that shows the page", () => {
    vi.useFakeTimers();
    setup();
    const { rerender } = render(<HistoryWipe />);
    recordScroll(1192); // on /journal (entry a)

    entryChange("b", "push"); // click into a post
    setPath("/journal/the-garden");
    rerender(<HistoryWipe />);
    recordScroll(0);
    scrollTo.mockClear();

    entryKey = "a"; // Back
    setPath("/journal");
    pop();
    expect(scrollTo).not.toHaveBeenCalled(); // nothing moves before the commit
    vi.runAllTimers();
    rerender(<HistoryWipe />); // Next commits /journal
    expect(scrollTo).toHaveBeenCalledWith({ top: 1192 });
  });

  it("does not move scroll on link navigations (Next scrolls those itself)", () => {
    setup();
    const { rerender } = render(<HistoryWipe />);
    scrollTo.mockClear();
    entryChange("b", "push");
    setPath("/menu");
    rerender(<HistoryWipe />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("hash-only steps on the same page restore scroll without a wipe", () => {
    setup();
    render(<HistoryWipe />);
    recordScroll(400);
    entryChange("b", "push"); // e.g. a menu tab written to the hash
    recordScroll(50);
    scrollTo.mockClear();
    entryKey = "a";
    pop();
    expect(nextSaw).toHaveLength(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 400 });
  });

  it("a link that overtakes a slow Back keeps Next's scroll, and later scroll is saved to the right entry", () => {
    vi.useFakeTimers();
    setup();
    const { rerender } = render(<HistoryWipe />);
    recordScroll(1192); // /journal, entry a
    entryChange("b", "push");
    setPath("/about");
    rerender(<HistoryWipe />);

    entryKey = "a"; // Back towards /journal…
    setPath("/journal");
    pop();
    vi.runAllTimers();
    entryChange("c", "push"); // …but a link to /menu commits first
    setPath("/menu");
    scrollTo.mockClear();
    rerender(<HistoryWipe />);
    expect(scrollTo).not.toHaveBeenCalled();

    recordScroll(250); // scrolling /menu must not overwrite /journal's spot
    entryKey = "a";
    setPath("/journal");
    pop();
    vi.runAllTimers();
    rerender(<HistoryWipe />);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1192 });
  });

  it("a second quick Back replaces the first one's pending replay", () => {
    vi.useFakeTimers();
    setup();
    render(<HistoryWipe />);
    setPath("/about");
    pop();
    setPath("/menu");
    pop();
    vi.runAllTimers();
    expect(nextSaw).toHaveLength(1);
  });

  it("keeps positions across a reload via sessionStorage", () => {
    setup();
    const { unmount } = render(<HistoryWipe />);
    recordScroll(321);
    window.dispatchEvent(new Event("pagehide"));
    unmount();
    scrollTo.mockClear();
    render(<HistoryWipe />);
    expect(scrollTo).toHaveBeenCalledWith({ top: 321 });
  });

  describe("settling entrances on route change", () => {
    let getAnimations: ReturnType<typeof vi.fn>;
    const spyAnimations = () => {
      getAnimations = vi.fn(() => []);
      Object.defineProperty(document, "getAnimations", { value: getAnimations, configurable: true });
    };
    // jsdom has no view transitions; say whether one is under way.
    const wipeActive = (active: boolean) =>
      Object.defineProperty(document, "activeViewTransition", { value: active ? {} : null, configurable: true });
    afterEach(() => {
      delete (document as { getAnimations?: unknown }).getAnimations;
      delete (document as { timeline?: unknown }).timeline;
      delete (document as { activeViewTransition?: unknown }).activeViewTransition;
    });

    it("keeps the entrance when no wipe is running (old browsers, a swipe-back the browser animated)", () => {
      setup();
      wipeActive(false);
      spyAnimations();
      const { rerender } = render(<HistoryWipe />);
      setPath("/menu");
      rerender(<HistoryWipe />);
      expect(getAnimations).not.toHaveBeenCalled();
    });

    it("a repeat of the mount effect for the same page (Strict Mode) does not settle", () => {
      setup();
      wipeActive(true);
      spyAnimations();
      const { unmount } = render(<HistoryWipe />);
      unmount();
      render(<HistoryWipe />);
      expect(getAnimations).not.toHaveBeenCalled();
    });

    it("does not settle on the first render (first visits and reloads keep the entrance)", () => {
      setup();
      spyAnimations();
      render(<HistoryWipe />);
      expect(getAnimations).not.toHaveBeenCalled();
    });

    it("settles once per pathname change, and not on re-renders of the same page", () => {
      setup();
      wipeActive(true);
      spyAnimations();
      const { rerender } = render(<HistoryWipe />);
      rerender(<HistoryWipe />);
      expect(getAnimations).not.toHaveBeenCalled();

      setPath("/menu");
      rerender(<HistoryWipe />);
      expect(getAnimations).toHaveBeenCalledTimes(1);
      rerender(<HistoryWipe />);
      expect(getAnimations).toHaveBeenCalledTimes(1);

      setPath("/about");
      rerender(<HistoryWipe />);
      expect(getAnimations).toHaveBeenCalledTimes(2);
    });

    it("settles even without the Navigation API", () => {
      setup();
      wipeActive(true);
      delete (window as { navigation?: unknown }).navigation;
      spyAnimations();
      const { rerender } = render(<HistoryWipe />);
      setPath("/menu");
      rerender(<HistoryWipe />);
      expect(getAnimations).toHaveBeenCalledTimes(1);
    });

    it("finishes the new page's just-started entrance animations", () => {
      setup();
      const timeline = {};
      class CSSAnimation {
        timeline = timeline;
        currentTime = 0;
        playState = "running";
        effect = { pseudoElement: null, getComputedTiming: () => ({ iterations: 1 }) };
        finish = vi.fn();
      }
      const entrance = new CSSAnimation();
      wipeActive(true);
      Object.defineProperty(document, "timeline", { value: timeline, configurable: true });
      Object.defineProperty(document, "getAnimations", { value: () => [entrance], configurable: true });
      const { rerender } = render(<HistoryWipe />);
      expect(entrance.finish).not.toHaveBeenCalled();
      setPath("/journal/the-garden");
      rerender(<HistoryWipe />);
      expect(entrance.finish).toHaveBeenCalledTimes(1);
    });
  });
});

describe("JournalPage transition types", () => {
  it("every journal card link opens its post with the OPEN_POST transition type", () => {
    render(<JournalPage />);
    const cardLinks = (recorded.link as LinkProps[]).filter((p) => String(p.href).startsWith("/journal/"));
    expect(cardLinks.map((p) => p.href)).toEqual(posts.map((p) => `/journal/${p.slug}`));
    for (const p of cardLinks) expect(p.transitionTypes).toEqual([OPEN_POST]);

    // Still a plain anchor in the DOM: the prop doesn't leak as an attribute.
    const first = within(screen.getByRole("main")).getByRole("link", { name: posts[0].title });
    expect(first).not.toHaveAttribute("transitionTypes");
    expect(first).not.toHaveAttribute("transitiontypes");
  });

  it("other journal links (header, Book a table) keep the default page wipe", () => {
    render(<JournalPage />);
    const others = (recorded.link as LinkProps[]).filter((p) => !String(p.href).startsWith("/journal/"));
    expect(others.length).toBeGreaterThan(0);
    for (const p of others) expect(p.transitionTypes).toBeUndefined();
  });
});

describe("wipeRunning", () => {
  it("uses document.activeViewTransition where the browser has it", () => {
    expect(wipeRunning({ activeViewTransition: {} } as unknown as Document)).toBe(true);
    expect(wipeRunning({ activeViewTransition: null } as unknown as Document)).toBe(false);
  });
  it("otherwise falls back to whether view transitions exist at all", () => {
    expect(wipeRunning({ startViewTransition: () => {} } as unknown as Document)).toBe(true);
    expect(wipeRunning({} as Document)).toBe(false);
  });
});

describe("SettleOnReveal (content streamed in during the wipe)", () => {
  afterEach(() => {
    delete (document as { getAnimations?: unknown }).getAnimations;
    delete (document as { activeViewTransition?: unknown }).activeViewTransition;
    vi.useRealTimers();
  });

  it("does nothing when no navigation has happened recently (e.g. a first visit)", () => {
    // Earlier tests navigate; move the clock well past any window they opened.
    vi.useFakeTimers({ toFake: ["performance"] });
    vi.advanceTimersByTime(1e9);
    const getAnimations = vi.fn(() => []);
    Object.defineProperty(document, "getAnimations", { value: getAnimations, configurable: true });
    render(<SettleOnReveal />);
    expect(getAnimations).not.toHaveBeenCalled();
  });

  it("settles content revealed while the wipe runs, but not content that arrives after it", () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    Object.defineProperty(document, "activeViewTransition", { value: {}, configurable: true });
    const getAnimations = vi.fn(() => []);
    Object.defineProperty(document, "getAnimations", { value: getAnimations, configurable: true });
    nav.pathname = "/journal";
    const { rerender } = render(<HistoryWipe />);
    nav.pathname = "/journal/a-post"; // navigation with a wipe: opens the window
    rerender(<HistoryWipe />);
    getAnimations.mockClear();

    vi.advanceTimersByTime(500);
    render(<SettleOnReveal />);
    expect(getAnimations).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    getAnimations.mockClear();
    render(<SettleOnReveal />);
    expect(getAnimations).not.toHaveBeenCalled();
  });
});

