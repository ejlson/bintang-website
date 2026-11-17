import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { useEffect, useState, type ComponentProps } from "react";
import {
  OPEN_POST,
  PageTransition,
  HistoryWipe,
  alignWipeToScreen,
  exitWipeFor,
  translateYOf,
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

describe("exitWipeFor", () => {
  it.each(["/menu", "/menu/", "/menu/drinks", "/menu/a/b"])("uses the slanted wipe when leaving %s", (path) => {
    expect(exitWipeFor(path)).toBe("wipe-slant");
  });

  it.each(["/", "/about", "/journal", "/journal/karaoke-nights", "/contact/groups", "/gallery"])(
    "uses the top-to-bottom wipe when leaving %s",
    (path) => {
      expect(exitWipeFor(path)).toBe("wipe-down");
    },
  );

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
  ])("does not treat %j as the menu", (path) => {
    expect(exitWipeFor(path)).toBe("wipe-down");
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

  it.each([
    ["/", "wipe-down"],
    ["/journal", "wipe-down"],
    ["/menu", "wipe-slant"],
    ["/menu/drinks", "wipe-slant"],
  ])("on %s passes exit/enter/default classes to ViewTransition (default exit %s)", (path, wipe) => {
    nav.pathname = path;
    render(<PageTransition>x</PageTransition>);
    const props = lastViewTransition();
    expect(props.exit).toEqual({ [OPEN_POST]: "wipe-iris", default: wipe });
    expect(props.enter).toBe("page-under");
    expect(props.default).toBe("none");
  });

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
    expect(lastViewTransition().exit).toEqual({ [OPEN_POST]: "wipe-iris", default: "wipe-slant" });
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

  it("is wired to the ViewTransition's onExit", () => {
    render(<PageTransition>x</PageTransition>);
    expect(lastViewTransition().onExit).toBe(alignWipeToScreen);
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
