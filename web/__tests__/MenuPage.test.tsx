import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MenuPage } from "@/components/MenuPage";
import MenuRoute, { metadata } from "@/app/menu/page";
import { CHRISTMAS_MENU, menus } from "@/lib/menu";
import { CHRISTMAS_ENDS } from "@/lib/promo";

const tabs = () => screen.getAllByRole("tab");
const tab = (name: string) => screen.getByRole("tab", { name });
const selectedTab = () => tabs().find((t) => t.getAttribute("aria-selected") === "true")!;
const main = () => screen.getByRole("main");
const flush = () => act(async () => {});

/** While the Christmas 2026 menu is in season (it has its own tab, after Karaoke). */
const IN_SEASON = new Date("2026-12-01T12:00:00Z");

beforeEach(() => {
  window.history.replaceState(null, "", "/menu");
  // Tabs depend on the visitor's clock: pin it so these don't change on 1 Jan 2027.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(IN_SEASON);
});
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", "/menu");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MenuPage", () => {
  it("renders the H1 and five tabs in order (Christmas last, in season), À la carte selected by default", () => {
    render(<MenuPage />);
    expect(screen.getByRole("heading", { level: 1, name: /^Menu\s*— Bintang/ })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("tablist", { name: "Choose a menu" })).toBeInTheDocument();
    expect(tabs().map((t) => t.textContent)).toEqual(["À la carte", "Brunch", "Desserts", "Karaoke", "Christmas"]);
    expect(tabs().map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false", "false", "false", "false"]);
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    for (const t of tabs()) expect(t).toHaveAttribute("aria-controls", "menu-panel");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", "menu-panel");
    expect(panel).toHaveAttribute("aria-labelledby", "tab-carte");
    expect(screen.getByRole("heading", { level: 2, name: "À la carte · Food" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "À la carte · Drinks" })).toBeInTheDocument();
  });

  it("app/menu/page renders MenuPage with title metadata", () => {
    render(<MenuRoute />);
    expect(screen.getByRole("heading", { level: 1, name: /^Menu\s*— Bintang/ })).toBeInTheDocument();
    expect(metadata.title).toBe("Filipino menu & weekend brunch in Kentish Town");
    expect(metadata.alternates?.canonical).toBe("/menu");
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
    expect(selectedTab()).toBe(tab("Christmas"));
    expect(tab("Christmas")).toHaveFocus();

    fireEvent.keyDown(tab("Christmas"), { key: "ArrowRight" });
    expect(selectedTab()).toBe(tab("À la carte"));
    expect(tab("À la carte")).toHaveFocus();

    fireEvent.keyDown(tab("À la carte"), { key: "ArrowLeft" });
    expect(selectedTab()).toBe(tab("Christmas"));
    expect(tab("Christmas")).toHaveFocus();

    fireEvent.keyDown(tab("Christmas"), { key: "ArrowLeft" });
    expect(selectedTab()).toBe(tab("Karaoke"));

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

  it("uses the ink lion mark except on red Karaoke and pine Christmas, which are white like About", () => {
    render(<MenuPage />);
    const markSrc = () => screen.getByRole("link", { name: "Bintang home" }).querySelector("img")!.getAttribute("src");
    for (const m of menus) {
      fireEvent.click(tab(m.label));
      expect(markSrc()).toBe(
        m.id === "karaoke" || m.id === "christmas" ? "/brand/lion-head-paper.svg" : "/brand/lion-head-ink.svg",
      );
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

  it("sets Book a table as the cinematic button", () => {
    render(<MenuPage />);
    const book = screen.getByRole("link", { name: "Book a table" });
    expect(book).toHaveClass("cine-book");
    expect(book.querySelector(".cine-frame")).toHaveTextContent(/^Book a table$/);
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

  it("has five menus (four CMS + seasonal Christmas) with unique ids in tab order and distinct backgrounds", () => {
    expect(menus.map((m) => m.id)).toEqual(["carte", "brunch", "desserts", "karaoke", "christmas"]);
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
          // Only the Christmas sheets' boxed "Group dining info" is text-only (an intro, no dishes).
          if (m.id === "christmas" && "boxed" in g && g.boxed) expect(g.intro?.trim()).toBeTruthy();
          else expect(g.items.length).toBeGreaterThan(0);
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

describe("Christmas tab (seasonal)", () => {
  const xmasPanel = () => screen.getByRole("tabpanel");

  it("is the last tab while in season and shows each printed sheet as an image with its alt text", () => {
    render(<MenuPage />);
    expect(tabs().at(-1)).toBe(tab("Christmas"));
    fireEvent.click(tab("Christmas"));
    expect(window.location.hash).toBe("#christmas");
    expect(xmasPanel()).toHaveAttribute("aria-labelledby", "tab-christmas");
    expect(xmasPanel()).toHaveAttribute("data-printed", "true");
    expect(main().style.getPropertyValue("--bg").toLowerCase()).toBe("#1d3a26");

    for (const sheet of CHRISTMAS_MENU.sheets) {
      const article = screen.getByRole("article", { name: sheet.label });
      expect(within(article).getByRole("heading", { level: 2, name: sheet.label })).toBeInTheDocument();
      const img = within(article).getByRole("img", { name: sheet.image!.alt });
      // The picture is a button that opens it full screen.
      const opener = img.closest("button")!;
      expect(opener).toHaveAttribute("aria-haspopup", "dialog");
      expect(opener).toHaveAttribute("type", "button");
      expect(opener).toHaveTextContent("View full screen");
      // Name = alt + hint, with a space between them.
      expect(opener).toHaveTextContent("View full screen");
      expect(opener).toHaveAccessibleName(`${sheet.image!.alt} View full screen`);
      // …and under it, the PDF in a new tab.
      const pdf = within(article).getByRole("link", { name: "Open the PDF (opens in a new tab)" });
      expect(pdf).toHaveAttribute("href", sheet.image!.pdf);
      expect(pdf).toHaveAttribute("target", "_blank");
      expect(pdf).toHaveAttribute("rel", "noopener noreferrer");
      expect(img).toHaveAttribute("src", sheet.image!.src);
      expect(img).toHaveAttribute("width", String(sheet.image!.width));
      expect(img).toHaveAttribute("height", String(sheet.image!.height));
      expect(img).toHaveAttribute("loading", "lazy");
    }
  });

  it("puts the same dishes as text in a closed 'Read this menu as text' disclosure under each image", () => {
    render(<MenuPage />);
    fireEvent.click(tab("Christmas"));
    for (const sheet of CHRISTMAS_MENU.sheets) {
      const article = screen.getByRole("article", { name: sheet.label });
      const details = article.querySelector("details")!;
      expect(details).not.toBeNull();
      expect(details).not.toHaveAttribute("open");
      expect(details.querySelector("summary")).toHaveTextContent(/^Read this menu as text$/);
      // The image comes first, the disclosure after it.
      expect(article.querySelector("img")!.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      for (const sec of sheet.sections) {
        expect(within(details).getByRole("heading", { level: 3, name: sec.title, hidden: true })).toBeInTheDocument();
      }
      expect(details).toHaveTextContent("All meat is halal certified");
      // Text-only boxes ("Group dining info": an intro, no dishes) render no empty list.
      for (const sec of sheet.sections) {
        const heading = within(details).getByRole("heading", { level: 3, name: sec.title, hidden: true });
        const lists = heading.closest("section")!.querySelectorAll("ul");
        expect(lists, sec.title).toHaveLength(sec.items.length > 0 ? 1 : 0);
      }
      expect(sheet.sections.some((sec) => sec.items.length === 0)).toBe(true);
      // Nothing of the sheet's text is outside the disclosure (apart from its band heading).
      expect(article.querySelectorAll(":scope > :not(details) h3")).toHaveLength(0);
    }
    const first = screen.getAllByText("Read this menu as text")[0];
    fireEvent.click(first);
    expect(first.closest("details")).toHaveAttribute("open");
    expect(screen.getAllByRole("heading", { level: 3, name: "Starters" })[0]).toBeVisible();
  });

  it("does not use the printed layout or images on the CMS menus", () => {
    render(<MenuPage />);
    for (const m of menus.filter((x) => x.id !== "christmas")) {
      fireEvent.click(tab(m.label));
      expect(xmasPanel()).not.toHaveAttribute("data-printed");
      expect(xmasPanel().querySelector("details")).toBeNull();
      expect(xmasPanel().querySelector("img.printed")).toBeNull();
    }
  });

  it("opens from the #christmas deep link while in season, up to the last millisecond", () => {
    vi.setSystemTime(CHRISTMAS_ENDS - 1);
    window.history.replaceState(null, "", "/menu#christmas");
    render(<MenuPage />);
    expect(selectedTab()).toBe(tab("Christmas"));
    expect(screen.getByRole("article", { name: "Group set menu · £47" })).toBeInTheDocument();
  });

  describe("after the season (from 1 January 2027)", () => {
    beforeEach(() => {
      vi.setSystemTime(CHRISTMAS_ENDS);
    });

    it("drops the Christmas tab: four tabs, Karaoke last", () => {
      render(<MenuPage />);
      expect(tabs().map((t) => t.textContent)).toEqual(["À la carte", "Brunch", "Desserts", "Karaoke"]);
      expect(screen.queryByRole("tab", { name: "Christmas" })).toBeNull();
      fireEvent.keyDown(tab("À la carte"), { key: "End" });
      expect(selectedTab()).toBe(tab("Karaoke"));
      fireEvent.keyDown(tab("Karaoke"), { key: "ArrowRight" });
      expect(selectedTab()).toBe(tab("À la carte"));
    });

    it("ignores the #christmas deep link on load and on hashchange", () => {
      window.history.replaceState(null, "", "/menu#christmas");
      render(<MenuPage />);
      expect(selectedTab()).toBe(tab("À la carte"));
      expect(screen.queryByRole("article", { name: "Group set menu · £47" })).toBeNull();

      fireEvent.click(tab("Desserts"));
      act(() => {
        window.history.replaceState(null, "", "/menu#christmas");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(selectedTab()).toBe(tab("Desserts"));
    });
  });
});

describe("Christmas tab: printed sheet full screen (PrintedSheetViewer)", () => {
  const openSheet = (label: string) => {
    window.history.replaceState(null, "", "/menu#christmas");
    render(<MenuPage />);
    const article = screen.getByRole("article", { name: label });
    const opener = within(article).getByRole("button", { name: /View full screen/ });
    opener.focus();
    fireEvent.click(opener);
    return opener;
  };
  const viewer = () => screen.getByRole("dialog");

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it.each(CHRISTMAS_MENU.sheets.map((s) => [s.label, s] as const))(
    "opens %s as a modal dialog on body, with Close focused and its own PDF page",
    (label, sheet) => {
      document.body.style.overflow = "auto";
      openSheet(label);
      const d = viewer();
      expect(d).toHaveAttribute("aria-modal", "true");
      expect(d).toHaveAccessibleName(label);
      expect(d.parentElement).toBe(document.body);
      expect(screen.getByRole("tabpanel")).not.toContainElement(d);
      expect(within(d).getByRole("button", { name: "Close" })).toHaveFocus();
      expect(within(d).getByRole("img", { name: sheet.image!.alt })).toHaveAttribute("src", sheet.image!.src);
      const pdf = within(d).getByRole("link", { name: "Open PDF (opens in a new tab)" });
      expect(pdf).toHaveAttribute("href", sheet.image!.pdf);
      expect(pdf).toHaveAttribute("target", "_blank");
      expect(pdf).toHaveAttribute("rel", "noopener noreferrer");
      expect(document.body.style.overflow).toBe("hidden");
      // Only one viewer at a time.
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
    },
  );

  it("closes on Close, restores body scroll and returns focus to the opening picture", () => {
    document.body.style.overflow = "auto";
    const opener = openSheet("Group set menu · £47");
    fireEvent.click(within(viewer()).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
    expect(opener).toHaveFocus();
  });

  it("closes on Esc and returns focus to the opening picture", () => {
    const opener = openSheet("Sharing set menu · £42");
    expect(fireEvent.keyDown(document, { key: "Escape" })).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(opener).toHaveFocus();
    // The listener is gone with the viewer.
    opener.blur();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(opener).not.toHaveFocus();
  });

  it("traps Tab between the PDF link and the scrollable page, which keyboard users can focus", () => {
    openSheet("Group set menu · £47");
    const d = viewer();
    const pdf = within(d).getByRole("link", { name: /Open PDF/ });
    const page = within(d).getByRole("region", { name: "Group set menu · £47, printed page" });
    expect(page).toHaveAttribute("tabindex", "0");
    expect(within(d).getByRole("button", { name: "Close" })).toHaveFocus();
    page.focus();
    expect(fireEvent.keyDown(page, { key: "Tab" })).toBe(false);
    expect(pdf).toHaveFocus();
    expect(fireEvent.keyDown(pdf, { key: "Tab", shiftKey: true })).toBe(false);
    expect(page).toHaveFocus();
  });

  it("can be opened again after closing", () => {
    const opener = openSheet("Group set menu · £47");
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(opener);
    expect(viewer()).toHaveAccessibleName("Group set menu · £47");
  });

  it("restores body scroll when the page unmounts with the viewer open", () => {
    document.body.style.overflow = "auto";
    window.history.replaceState(null, "", "/menu#christmas");
    const { unmount } = render(<MenuPage />);
    fireEvent.click(screen.getAllByRole("button", { name: /View full screen/ })[0]);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
  });
});
