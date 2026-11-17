import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MenuPage } from "@/components/MenuPage";
import MenuRoute, { metadata } from "@/app/menu/page";
import { menus } from "@/lib/menu";

const tabs = () => screen.getAllByRole("tab");
const tab = (name: string) => screen.getByRole("tab", { name });
const selectedTab = () => tabs().find((t) => t.getAttribute("aria-selected") === "true")!;
const main = () => screen.getByRole("main");
const flush = () => act(async () => {});

beforeEach(() => {
  window.history.replaceState(null, "", "/menu");
});
afterEach(() => {
  window.history.replaceState(null, "", "/menu");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MenuPage", () => {
  it("renders the H1 and four tabs in order, À la carte selected by default", () => {
    render(<MenuPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("tablist", { name: "Choose a menu" })).toBeInTheDocument();
    expect(tabs().map((t) => t.textContent)).toEqual(["À la carte", "Brunch", "Desserts", "Karaoke"]);
    expect(tabs().map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false", "false", "false"]);
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    for (const t of tabs()) expect(t).toHaveAttribute("aria-controls", "menu-panel");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", "menu-panel");
    expect(panel).toHaveAttribute("aria-labelledby", "tab-carte");
    expect(screen.getByRole("heading", { level: 2, name: "À la carte · Food" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "À la carte · Drinks" })).toBeInTheDocument();
  });

  it("app/menu/page renders MenuPage with title metadata", () => {
    render(<MenuRoute />);
    expect(screen.getByRole("heading", { level: 1, name: "Menu" })).toBeInTheDocument();
    expect(metadata.title).toBe("Menu");
  });

  it("marks the Menu link in the SiteHeader as current and only that one", () => {
    render(<MenuPage />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.length).toBeGreaterThan(0);
    expect(new Set(current.map((a) => a.getAttribute("href")))).toEqual(new Set(["/menu"]));
  });

  it("clicking Brunch selects it, updates the hash and swaps the content", () => {
    const replace = vi.spyOn(window.history, "replaceState");
    render(<MenuPage />);
    expect(screen.getByText("Pandesal Slider")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "Silogs" })).not.toBeInTheDocument();

    fireEvent.click(tab("Brunch"));

    expect(tab("Brunch")).toHaveAttribute("aria-selected", "true");
    expect(tab("À la carte")).toHaveAttribute("aria-selected", "false");
    expect(tab("Brunch").tabIndex).toBe(0);
    expect(tab("À la carte").tabIndex).toBe(-1);
    expect(replace).toHaveBeenCalledWith(null, "", "#brunch");
    expect(window.location.hash).toBe("#brunch");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "tab-brunch");
    expect(screen.getByRole("heading", { level: 3, name: "Silogs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Bottomless drinks" })).toBeInTheDocument();
    expect(screen.queryByText("Pandesal Slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "À la carte · Food" })).not.toBeInTheDocument();
  });

  it("arrow keys move selection and focus, wrapping at both ends; Home/End jump", () => {
    render(<MenuPage />);
    tab("À la carte").focus();

    fireEvent.keyDown(tab("À la carte"), { key: "ArrowRight" });
    expect(selectedTab()).toBe(tab("Brunch"));
    expect(tab("Brunch")).toHaveFocus();
    expect(window.location.hash).toBe("#brunch");

    fireEvent.keyDown(tab("Brunch"), { key: "End" });
    expect(selectedTab()).toBe(tab("Karaoke"));
    expect(tab("Karaoke")).toHaveFocus();

    fireEvent.keyDown(tab("Karaoke"), { key: "ArrowRight" });
    expect(selectedTab()).toBe(tab("À la carte"));
    expect(tab("À la carte")).toHaveFocus();

    fireEvent.keyDown(tab("À la carte"), { key: "ArrowLeft" });
    expect(selectedTab()).toBe(tab("Karaoke"));
    expect(tab("Karaoke")).toHaveFocus();

    fireEvent.keyDown(tab("Karaoke"), { key: "ArrowLeft" });
    expect(selectedTab()).toBe(tab("Desserts"));

    fireEvent.keyDown(tab("Desserts"), { key: "Home" });
    expect(selectedTab()).toBe(tab("À la carte"));
    expect(tab("À la carte")).toHaveFocus();
  });

  it("ignores other keys and does not prevent their default", () => {
    render(<MenuPage />);
    const notPrevented = fireEvent.keyDown(tab("À la carte"), { key: "ArrowDown" });
    expect(notPrevented).toBe(true);
    expect(fireEvent.keyDown(tab("À la carte"), { key: "a" })).toBe(true);
    expect(selectedTab()).toBe(tab("À la carte"));
    expect(fireEvent.keyDown(tab("À la carte"), { key: "ArrowRight" })).toBe(false);
  });

  it("opens the tab named by the initial hash", () => {
    window.history.replaceState(null, "", "/menu#desserts");
    render(<MenuPage />);
    expect(selectedTab()).toBe(tab("Desserts"));
    expect(screen.getByRole("heading", { level: 2, name: "Desserts · Panghimagas" })).toBeInTheDocument();
  });

  it("ignores an unknown initial hash", () => {
    window.history.replaceState(null, "", "/menu#nope");
    render(<MenuPage />);
    expect(selectedTab()).toBe(tab("À la carte"));
  });

  it("switches tabs on hashchange and ignores unknown hashes", () => {
    render(<MenuPage />);
    act(() => {
      window.history.replaceState(null, "", "/menu#karaoke");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(selectedTab()).toBe(tab("Karaoke"));

    act(() => {
      window.history.replaceState(null, "", "/menu#bogus");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(selectedTab()).toBe(tab("Karaoke"));
  });

  it("removes the hashchange listener on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<MenuPage />);
    unmount();
    expect(remove).toHaveBeenCalledWith("hashchange", expect.any(Function));
  });

  it("sets --acc and --bg on main to the active menu's accent and background", () => {
    render(<MenuPage />);
    const initial = menus.find((m) => m.id === "carte")!;
    expect(main().style.getPropertyValue("--acc").toLowerCase()).toBe(initial.accent.toLowerCase());
    expect(main().style.getPropertyValue("--bg").toLowerCase()).toBe(initial.background.toLowerCase());
    for (const m of menus) {
      fireEvent.click(tab(m.label));
      expect(main().style.getPropertyValue("--acc").toLowerCase()).toBe(m.accent.toLowerCase());
      expect(main().style.getPropertyValue("--bg").toLowerCase()).toBe(m.background.toLowerCase());
    }
  });

  it("uses the ink lion mark on every menu except red Karaoke, which is white like About", () => {
    render(<MenuPage />);
    const markSrc = () => screen.getByRole("link", { name: "Bintang home" }).querySelector("img")!.getAttribute("src");
    for (const m of menus) {
      fireEvent.click(tab(m.label));
      expect(markSrc()).toBe(m.id === "karaoke" ? "/brand/lion-head-paper.svg" : "/brand/lion-head-ink.svg");
    }
  });

  it("writes the Karaoke menu in white (paper), like the About page", () => {
    expect(menus.find((m) => m.id === "karaoke")!.accent.toLowerCase()).toBe("#ede9e9");
  });

  it("shows legal notes on the sheets that ask for them, not on others", () => {
    render(<MenuPage />);
    const drinks = screen.getByRole("article", { name: "À la carte · Drinks" });
    const food = screen.getByRole("article", { name: "À la carte · Food" });
    expect(within(drinks).getByText("All meat is halal certified")).toBeInTheDocument();
    expect(within(drinks).getByText(/12\.5% service charge/)).toBeInTheDocument();
    expect(within(food).queryByText("All meat is halal certified")).not.toBeInTheDocument();

    fireEvent.click(tab("Brunch"));
    expect(
      within(screen.getByRole("article", { name: "Brunch · Drinks" })).getByText("All meat is halal certified"),
    ).toBeInTheDocument();

    fireEvent.click(tab("Karaoke"));
    const set = screen.getByRole("article", { name: "Karaoke · Sharing set menu" });
    expect(within(set).getByText("All meat is halal certified")).toBeInTheDocument();
  });

  it("shows the karaoke sharing set menu from the printed card, with no video", () => {
    render(<MenuPage />);
    fireEvent.click(tab("Karaoke"));
    expect(document.querySelector("video")).toBeNull();
    const set = screen.getByRole("article", { name: "Karaoke · Sharing set menu" });
    for (const h of ["Starters", "Mains", "Bintang special main", "Dessert", "Sides", "Group dining info"]) {
      expect(within(set).getByRole("heading", { name: h })).toBeInTheDocument();
    }
    expect(within(set).getByText("38 pp")).toBeInTheDocument();
    expect(within(set).getByText(/Complimentary karaoke for all private hires/)).toBeInTheDocument();
  });

  it("renders the karaoke banner link and the Book a table link", () => {
    render(<MenuPage />);
    expect(screen.getByRole("link", { name: /Karaoke at Bintang/ })).toHaveAttribute("href", "/contact/karaoke");
    expect(screen.getByRole("link", { name: "Book a table" })).toHaveAttribute("href", "/contact");
  });

  it("renders every item of the active menu", () => {
    render(<MenuPage />);
    for (const m of menus) {
      fireEvent.click(tab(m.label));
      const panel = screen.getByRole("tabpanel");
      const names = m.sheets.flatMap((s) => [...s.sections, ...(s.wide ?? [])].flatMap((sec) => sec.items.map((i) => i.name)));
      const rendered = Array.from(panel.querySelectorAll("li")).map((li) => li.querySelector("span")!.textContent);
      expect(rendered).toEqual(names);
    }
  });

  it("sizes the tab row to the measured title width when ResizeObserver exists", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 312.4 } as DOMRect);
    const { unmount } = render(<MenuPage />);
    expect(screen.getByRole("tablist")).toHaveStyle({ width: "312px" });
    expect(observe).toHaveBeenCalledWith(screen.getByRole("heading", { level: 1 }).querySelector("span"));
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("leaves the tab row unsized when the title measures 0 and ResizeObserver is missing", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    render(<MenuPage />);
    expect(screen.getByRole("tablist").style.width).toBe("");
  });
});

describe("lib/menu data", () => {
  const allStrings = (v: unknown): string[] =>
    typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(allStrings) : [];

  it("has four menus with unique ids in tab order and distinct backgrounds", () => {
    expect(menus.map((m) => m.id)).toEqual(["carte", "brunch", "desserts", "karaoke"]);
    expect(new Set(menus.map((m) => m.id)).size).toBe(menus.length);
    expect(new Set(menus.map((m) => m.background.toLowerCase())).size).toBe(menus.length);
  });

  it("gives every menu a hex accent and background that differ, and at least one sheet with sections", () => {
    for (const m of menus) {
      expect(m.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(m.background).toMatch(/^#[0-9a-f]{6}$/i);
      expect(m.accent.toLowerCase()).not.toBe(m.background.toLowerCase());
      expect(m.sheets.length).toBeGreaterThan(0);
      for (const s of m.sheets) expect(s.sections.length).toBeGreaterThan(0);
    }
  });

  it("gives every item a non-empty name, unique within its list (React keys)", () => {
    for (const m of menus) {
      expect(new Set(m.sheets.map((s) => s.label)).size).toBe(m.sheets.length);
      for (const s of m.sheets) {
        const groups = [...s.sections, ...(s.wide ?? [])];
        expect(new Set(s.sections.map((g) => g.title)).size).toBe(s.sections.length);
        for (const g of groups) {
          expect(g.title.trim()).not.toBe("");
          expect(g.items.length).toBeGreaterThan(0);
          for (const it of g.items) expect(it.name.trim()).not.toBe("");
          expect(new Set(g.items.map((i) => i.name)).size).toBe(g.items.length);
        }
      }
    }
  });

  it("has no leftover [placeholder] text or empty strings", () => {
    const strings = allStrings(menus);
    expect(strings.length).toBeGreaterThan(100);
    expect(strings.filter((s) => s.includes("[") || s.includes("]"))).toEqual([]);
    expect(strings.filter((s) => s.trim() === "")).toEqual([]);
  });
});

describe("review fixes", () => {
  it("turns colour fades on only after the first frame (data-ready)", async () => {
    render(<MenuPage />);
    expect(main()).not.toHaveAttribute("data-ready");
    const frame = () => act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
    await frame();
    await frame();
    await flush();
    expect(main()).toHaveAttribute("data-ready", "true");
  });

  it("makes the tab panel focusable so Tab reaches the menu content", () => {
    render(<MenuPage />);
    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
  });

  it("scrolls to the top of the new menu when switching tabs from further down", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    render(<MenuPage />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 5000 });
    vi.spyOn(screen.getByRole("tabpanel"), "getBoundingClientRect").mockReturnValue({ top: -3000 } as DOMRect);
    fireEvent.click(tab("Desserts"));
    expect(scrollTo).toHaveBeenCalledWith({ top: 2000 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("does not scroll when the visitor is already above the menu", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    render(<MenuPage />);
    fireEvent.click(tab("Brunch"));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("reserves scroll padding for the sticky tabs and restores it on unmount", () => {
    const html = document.documentElement;
    html.style.scrollPaddingTop = "";
    const { unmount } = render(<MenuPage />);
    expect(html.style.scrollPaddingTop).toMatch(/^\d+px$/);
    unmount();
    expect(html.style.scrollPaddingTop).toBe("");
  });
});
