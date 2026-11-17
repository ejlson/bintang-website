import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { useEffect, useState, type ComponentProps } from "react";
import {
  OPEN_POST,
  PageTransition,
  SwipeBackGuard,
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

describe("SwipeBackGuard", () => {
  const root = document.documentElement;
  afterEach(() => {
    delete root.dataset.uaTransition;
  });
  const pop = (hasUAVisualTransition: boolean) => {
    const e = new PopStateEvent("popstate");
    Object.defineProperty(e, "hasUAVisualTransition", { value: hasUAVisualTransition });
    window.dispatchEvent(e);
  };

  it("flags back/forward swipes the browser already animated, and clears on the next click", () => {
    render(<SwipeBackGuard />);
    pop(true);
    expect(root.dataset.uaTransition).toBe("");
    document.body.click();
    expect(root.dataset.uaTransition).toBeUndefined();
  });

  it("leaves button-press back/forward to wipe normally", () => {
    render(<SwipeBackGuard />);
    pop(true);
    pop(false);
    expect(root.dataset.uaTransition).toBeUndefined();
  });

  it("removes its listeners on unmount", () => {
    const { unmount } = render(<SwipeBackGuard />);
    unmount();
    pop(true);
    expect(root.dataset.uaTransition).toBeUndefined();
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
