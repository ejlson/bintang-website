import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader } from "@/components/SiteHeader";
import { allLinks, bookLinks, exploreLinks } from "@/lib/nav";
import { fireMediaChange, mediaListeners, motion } from "../vitest.setup";

const DESKTOP_QUERY = "(width >= 768px)";
const desktopListeners = () => mediaListeners.get(DESKTOP_QUERY)?.size ?? 0;

const EXPECTED_EXPLORE = [
  ["About", "Tungkol", "/about"],
  ["Menu", "Mga Ulam", "/menu"],
  ["Gallery", "Larawan", "/gallery"],
  ["Journal", "Balita", "/journal"],
] as const;

const EXPECTED_BOOK = [
  ["Book", "Magpareserba", "/contact"],
  ["Groups", "Grupo", "/contact/groups"],
  ["Karaoke", "Kantahan", "/contact/karaoke"],
  ["Private hire", "Pribado", "/contact/private-hire"],
] as const;

function linksIn(nav: HTMLElement) {
  return within(nav)
    .getAllByRole("link")
    .map((a) => [a.querySelector('span:not([lang="tl"])')?.textContent, a.querySelector('[lang="tl"]')?.textContent, a.getAttribute("href")]);
}

function toggle() {
  return screen.getByRole("button", { name: /^Menu/ });
}

function homeMark() {
  return screen.getByRole("link", { name: "Bintang home" });
}

/** jsdom can't navigate; stop link clicks' default so it doesn't log "Not implemented". */
async function clickWithoutNavigating(user: ReturnType<typeof userEvent.setup>, el: HTMLElement) {
  const stop = (e: Event) => e.preventDefault();
  document.addEventListener("click", stop);
  await user.click(el);
  document.removeEventListener("click", stop);
}

afterEach(() => {
  document.body.style.overflow = "";
});

describe("SiteHeader links", () => {
  it("renders the explore links on the left in spec order with EN + TL labels", () => {
    render(<SiteHeader />);
    expect(linksIn(screen.getByRole("navigation", { name: "Explore" }))).toEqual(EXPECTED_EXPLORE.map((l) => [...l]));
  });

  it("renders the book links on the right in spec order with EN + TL labels", () => {
    render(<SiteHeader />);
    expect(linksIn(screen.getByRole("navigation", { name: "Book" }))).toEqual(EXPECTED_BOOK.map((l) => [...l]));
  });

  it("nav data matches the spec", () => {
    expect(exploreLinks.map((l) => [l.en, l.tl, l.href])).toEqual(EXPECTED_EXPLORE.map((l) => [...l]));
    expect(bookLinks.map((l) => [l.en, l.tl, l.href])).toEqual(EXPECTED_BOOK.map((l) => [...l]));
    expect(allLinks).toHaveLength(8);
  });

  it("marks Tagalog lines with lang=tl", () => {
    render(<SiteHeader />);
    const about = within(screen.getByRole("navigation", { name: "Explore" })).getByRole("link", { name: /About/ });
    expect(within(about).getByText("Tungkol")).toHaveAttribute("lang", "tl");
  });

  it("centres a lion-head link home with an accessible name", () => {
    render(<SiteHeader mark="red" />);
    const home = screen.getByRole("link", { name: "Bintang home" });
    expect(home).toHaveAttribute("href", "/");
    const img = home.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/brand/lion-head-red.svg");
    expect(img).toHaveAttribute("alt", "");
  });

  it.each([
    ["paper", "/brand/lion-head-paper.svg"],
    ["ink", "/brand/lion-head-ink.svg"],
  ] as const)("uses the %s lion head when asked", (mark, src) => {
    render(<SiteHeader mark={mark} />);
    expect(screen.getByRole("link", { name: "Bintang home" }).querySelector("img")).toHaveAttribute("src", src);
  });

  it("sets aria-current=page only on the current link", () => {
    render(<SiteHeader currentHref="/contact/groups" />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/contact/groups");
  });

  it("does not mark /contact current when on a /contact sub-page", () => {
    render(<SiteHeader currentHref="/contact/karaoke" />);
    const book = within(screen.getByRole("navigation", { name: "Book" })).getByRole("link", { name: /^Book/ });
    expect(book).not.toHaveAttribute("aria-current");
  });

  it("marks no link current on the home page", () => {
    render(<SiteHeader currentHref="/" />);
    expect(screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"))).toHaveLength(0);
  });
});

describe("SiteHeader mobile overlay", () => {
  it("starts closed with aria-expanded=false and aria-controls", () => {
    render(<SiteHeader />);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle().getAttribute("aria-controls")).toBeTruthy();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal dialog with all 8 links and moves focus inside", async () => {
    const user = userEvent.setup();
    render(<SiteHeader currentHref="/menu" />);
    await user.click(toggle());

    const dialog = screen.getByRole("dialog", { name: "Site menu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(dialog.id).toBe(toggle().getAttribute("aria-controls"));

    const links = within(dialog).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(allLinks.map((l) => l.href));
    expect(within(dialog).getByRole("link", { name: /Mga Ulam/ })).toHaveAttribute("aria-current", "page");

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes on the close button, returns focus and restores body overflow", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "auto";
    render(<SiteHeader />);
    await user.click(toggle());
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: /Close/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveFocus();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("closes on Escape and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle()).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("ignores Escape once closed (listener removed)", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    await user.keyboard("{Escape}");
    (document.activeElement as HTMLElement).blur();
    await user.keyboard("{Escape}");
    expect(toggle()).not.toHaveFocus();
  });

  it("closes when a link in the overlay is clicked and restores overflow", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    const dialog = screen.getByRole("dialog");
    // jsdom can't navigate; stop the default so it doesn't log "Not implemented".
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("click", stop);
    await user.click(within(dialog).getByRole("link", { name: /Karaoke/ }));
    document.removeEventListener("click", stop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
  });

  it("traps Tab: wraps from last to first and Shift+Tab from first to last", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button", { name: /Close/ });
    const links = within(dialog).getAllByRole("link");
    const last = links[links.length - 1];

    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    // Walking forward through every item never leaves the dialog.
    for (let i = 0; i < links.length + 2; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("can be reopened after closing", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    await user.keyboard("{Escape}");
    await user.click(toggle());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("restores body overflow if unmounted while open", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SiteHeader />);
    await user.click(toggle());
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("SiteHeader at desktop widths", () => {
  it("returns focus to the home mark (toggle is hidden) when closed via the close button", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    motion.desktop = true;
    await user.click(screen.getByRole("button", { name: /Close/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(homeMark()).toHaveFocus();
  });

  it("returns focus to the home mark on Escape", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    motion.desktop = true;
    await user.keyboard("{Escape}");
    expect(homeMark()).toHaveFocus();
  });

  it("only listens for breakpoint changes while open", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    expect(desktopListeners()).toBe(0);
    await user.click(toggle());
    expect(desktopListeners()).toBe(1);
    await user.keyboard("{Escape}");
    expect(desktopListeners()).toBe(0);
  });

  it("closes the overlay when the viewport widens past the breakpoint and focuses the mark", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "auto";
    render(<SiteHeader />);
    await user.click(toggle());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    motion.desktop = true;
    act(() => fireMediaChange(DESKTOP_QUERY, true));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(homeMark()).toHaveFocus();
    expect(document.body.style.overflow).toBe("auto");
    expect(desktopListeners()).toBe(0);
  });

  it("stays open when the breakpoint change does not match (narrowing)", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    act(() => fireMediaChange(DESKTOP_QUERY, false));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("removes the breakpoint listener if unmounted while open", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SiteHeader />);
    await user.click(toggle());
    unmount();
    expect(desktopListeners()).toBe(0);
  });
});

describe("SiteHeader overlay links", () => {
  it("clicking the current page's link closes the overlay and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    render(<SiteHeader currentHref="/menu" />);
    await user.click(toggle());
    const current = within(screen.getByRole("dialog")).getByRole("link", { name: /Mga Ulam/ });
    expect(current).toHaveAttribute("aria-current", "page");

    await clickWithoutNavigating(user, current);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle()).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("clicking the current page's link at desktop width focuses the home mark", async () => {
    const user = userEvent.setup();
    render(<SiteHeader currentHref="/menu" />);
    await user.click(toggle());
    motion.desktop = true;
    await clickWithoutNavigating(user, within(screen.getByRole("dialog")).getByRole("link", { name: /Mga Ulam/ }));
    expect(homeMark()).toHaveFocus();
  });

  it("clicking another page's link closes without pulling focus back (navigation takes over)", async () => {
    const user = userEvent.setup();
    render(<SiteHeader currentHref="/menu" />);
    await user.click(toggle());
    await clickWithoutNavigating(user, within(screen.getByRole("dialog")).getByRole("link", { name: /Karaoke/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle()).not.toHaveFocus();
    expect(homeMark()).not.toHaveFocus();
  });
});
