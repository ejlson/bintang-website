import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ChristmasPromo } from "@/components/ChristmasPromo";
import { BOOKING_URL } from "@/lib/nav";
import { CHRISTMAS_ART, CHRISTMAS_PROMO_KEY, PROMO_DELAY_MS } from "@/lib/promo";
import { motion } from "../vitest.setup";

const mini = () => screen.getByRole("button", { name: "Christmas at Bintang: see the offer" });
const dialog = () => screen.getByRole("dialog", { name: "Christmas at Bintang" });
const queryDialog = () => screen.queryByRole("dialog");
const closeButton = () => within(dialog()).getByRole("button", { name: "Close" });
const veil = () => document.body.querySelector(".veil") as HTMLElement;

/** Let a MutationObserver callback (a microtask) run inside act. */
const flush = () => act(async () => {});
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

/** What lib/homeIntro / HomeTitle set when the title intro is over or skipped. */
const introDone = () => {
  document.documentElement.dataset.homeIntro = "skip";
};

/** Render with the intro already finished and the pop-up opened by itself. */
async function renderOpen() {
  introDone();
  render(<ChristmasPromo />);
  await advance(PROMO_DELAY_MS);
  expect(dialog()).toBeInTheDocument();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  sessionStorage.clear();
  delete document.documentElement.dataset.homeIntro;
  document.body.style.overflow = "";
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  sessionStorage.clear();
  delete document.documentElement.dataset.homeIntro;
  document.body.style.overflow = "";
});

describe("ChristmasPromo: corner mini", () => {
  it("renders a dialog-opening button with the hud class passed in and a decorative bauble image", () => {
    render(<ChristmasPromo hudClassName="hud" />);
    expect(mini()).toHaveAttribute("aria-haspopup", "dialog");
    expect(mini()).toHaveAttribute("type", "button");
    expect(mini()).toHaveClass("mini", "hud");
    expect(mini().querySelector("img")).toHaveAttribute("alt", "");
    expect(queryDialog()).toBeNull();
  });

  it("hangs a decorative bauble (thread, cap, holly, ball with the mini image, three stars) hidden from assistive tech", () => {
    render(<ChristmasPromo />);
    const ornament = mini().querySelector(".ornament")!;
    expect(ornament).toHaveAttribute("aria-hidden", "true");
    expect(mini().children).toHaveLength(1); // everything visual sits in the hidden ornament
    for (const part of [".thread", ".cap", "svg.holly", ".ball > img"]) {
      expect(ornament.querySelector(part), part).not.toBeNull();
    }
    expect(ornament.querySelectorAll("svg.star")).toHaveLength(3);
    // The name comes from aria-label only.
    expect(mini()).toHaveAccessibleName("Christmas at Bintang: see the offer");
  });

  it("sets data-still only when still (CSS pauses the sway and twinkle)", () => {
    const { rerender } = render(<ChristmasPromo />);
    expect(mini()).not.toHaveAttribute("data-still");
    rerender(<ChristmasPromo still />);
    expect(mini()).toHaveAttribute("data-still", "true");
    rerender(<ChristmasPromo still={false} />);
    expect(mini()).not.toHaveAttribute("data-still");
  });

  it("opens the pop-up on click and records the visit, so it won't pop up by itself later", () => {
    render(<ChristmasPromo />);
    fireEvent.click(mini());
    expect(dialog()).toBeInTheDocument();
    expect(sessionStorage.getItem(CHRISTMAS_PROMO_KEY)).toBe("1");
  });

  it("doesn't reopen by itself after being opened and closed from the mini before the intro ended", async () => {
    render(<ChristmasPromo />);
    fireEvent.click(mini());
    fireEvent.click(within(dialog()).getByRole("button", { name: "Close" }));
    await advance(500); // the fade-out
    document.documentElement.dataset.homeIntro = "skip";
    await flush();
    await advance(PROMO_DELAY_MS + 1000);
    expect(queryDialog()).toBeNull();
  });

  it("waits while another dialog (the phone nav menu) is open, then opens once it closes", async () => {
    const other = document.createElement("div");
    other.setAttribute("aria-modal", "true");
    document.body.append(other);
    document.documentElement.dataset.homeIntro = "skip";
    render(<ChristmasPromo />);
    await advance(PROMO_DELAY_MS + 3000);
    expect(queryDialog()).toBeNull();
    other.remove();
    await advance(600);
    expect(dialog()).toBeInTheDocument();
  });
});

describe("ChristmasPromo: opening by itself", () => {
  it("waits for the Home intro to be 'skip', then opens PROMO_DELAY_MS later and records the visit", async () => {
    render(<ChristmasPromo />);
    await advance(10_000);
    expect(queryDialog()).toBeNull(); // the intro is still running (or undecided)

    document.documentElement.dataset.homeIntro = "play";
    await flush();
    await advance(10_000);
    expect(queryDialog()).toBeNull();

    introDone();
    await flush();
    await advance(PROMO_DELAY_MS - 1);
    expect(queryDialog()).toBeNull();
    expect(sessionStorage.getItem(CHRISTMAS_PROMO_KEY)).toBeNull();

    await advance(1);
    expect(dialog()).toBeInTheDocument();
    expect(dialog()).toHaveAttribute("aria-modal", "true");
    expect(dialog().parentElement).toBe(document.body); // portalled above the hero
    expect(sessionStorage.getItem(CHRISTMAS_PROMO_KEY)).toBe("1");
  });

  it("opens after the delay when the intro had already finished on mount", async () => {
    introDone();
    render(<ChristmasPromo />);
    expect(queryDialog()).toBeNull();
    await advance(PROMO_DELAY_MS);
    expect(dialog()).toBeInTheDocument();
  });

  it("does not open by itself again in the same visit (key already set)", async () => {
    sessionStorage.setItem(CHRISTMAS_PROMO_KEY, "1");
    introDone();
    render(<ChristmasPromo />);
    await advance(10_000);
    expect(queryDialog()).toBeNull();
    // The mini still opens it.
    fireEvent.click(mini());
    expect(dialog()).toBeInTheDocument();
  });

  it("opens only once: a later remount in the same visit stays closed", async () => {
    introDone();
    const first = render(<ChristmasPromo />);
    await advance(PROMO_DELAY_MS);
    fireEvent.click(closeButton());
    await advance(1000);
    // Leave Home and come back.
    first.unmount();
    render(<ChristmasPromo />);
    await advance(10_000);
    expect(queryDialog()).toBeNull();
  });

  it("does not open by itself when sessionStorage throws (it couldn't stop reopening)", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    introDone();
    render(<ChristmasPromo />);
    await advance(10_000);
    expect(queryDialog()).toBeNull();
    fireEvent.click(mini());
    expect(dialog()).toBeInTheDocument();
  });

  it("still opens once if only writing the key fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    await renderOpen();
  });

  it("cancels the pending open on unmount", async () => {
    introDone();
    const { unmount } = render(<ChristmasPromo />);
    unmount();
    await advance(PROMO_DELAY_MS * 2);
    expect(queryDialog()).toBeNull();
    expect(sessionStorage.getItem(CHRISTMAS_PROMO_KEY)).toBeNull();
  });
});

describe("ChristmasPromo: the dialog", () => {
  it("moves focus to × on open and locks page scroll until it closes", async () => {
    document.body.style.overflow = "auto";
    await renderOpen();
    expect(closeButton()).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(closeButton());
    expect(document.body.style.overflow).toBe("auto");
  });

  it.each([
    ["×", () => fireEvent.click(closeButton())],
    ["Esc", () => fireEvent.keyDown(document, { key: "Escape" })],
    ["a click on the veil", () => fireEvent.click(veil())],
  ])("closes on %s and returns focus to the mini", async (_, doClose) => {
    await renderOpen();
    doClose();
    expect(queryDialog()).toBeNull();
    expect(mini()).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("does not close on a click inside the card", async () => {
    await renderOpen();
    fireEvent.click(within(dialog()).getByText("Christmas at Bintang", { selector: "p" }));
    expect(dialog()).toBeInTheDocument();
  });

  it("fades out inert and hidden, then unmounts (no exit animation for reduced motion)", async () => {
    await renderOpen();
    const root = dialog();
    fireEvent.click(closeButton());
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("inert");
    expect(root).toHaveClass("leaving");
    await advance(200);
    expect(root).not.toBeInTheDocument();

    motion.reduce = true;
    fireEvent.click(mini());
    const again = dialog();
    fireEvent.click(closeButton());
    expect(again).not.toBeInTheDocument();
  });

  it("reopens from the mini after closing", async () => {
    await renderOpen();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(queryDialog()).toBeNull();
    fireEvent.click(mini());
    expect(dialog()).toBeInTheDocument();
    expect(closeButton()).toHaveFocus();
  });

  it("traps Tab inside the dialog, both ways", async () => {
    await renderOpen();
    const focusables = Array.from(dialog().querySelectorAll<HTMLElement>("a[href], button"));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    expect(last).toBe(closeButton());

    // Tab from the last wraps to the first.
    expect(fireEvent.keyDown(document.activeElement!, { key: "Tab" })).toBe(false);
    expect(first).toHaveFocus();
    // Shift+Tab from the first wraps to the last.
    expect(fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true })).toBe(false);
    expect(last).toHaveFocus();
    // In between, Tab is left to the browser.
    focusables[1].focus();
    expect(fireEvent.keyDown(document.activeElement!, { key: "Tab" })).toBe(true);
  });

  it("stops listening for Esc once closed", async () => {
    await renderOpen();
    fireEvent.click(closeButton());
    mini().blur();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mini()).not.toHaveFocus();
  });

  it("links the artwork and Book your feast to OpenTable in a new tab, and the menus to /menu#christmas", async () => {
    await renderOpen();
    const d = dialog();
    const art = within(d).getByRole("link", {
      name: `${CHRISTMAS_ART.alt} Book a table on OpenTable (opens in a new tab)`,
    });
    expect(art).toHaveAttribute("href", BOOKING_URL);
    expect(art).toHaveAttribute("target", "_blank");
    expect(art).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(art).getByRole("img", { name: CHRISTMAS_ART.alt })).toHaveAttribute("src", CHRISTMAS_ART.src);

    const book = within(d).getByRole("link", { name: "Book your feast on OpenTable (opens in a new tab)" });
    expect(book).toHaveAttribute("href", BOOKING_URL);
    expect(book).toHaveAttribute("target", "_blank");
    expect(book).toHaveAttribute("rel", "noopener noreferrer");

    expect(within(d).getByRole("link", { name: "See the Christmas menus" })).toHaveAttribute(
      "href",
      "/menu#christmas",
    );
    expect(d).toHaveTextContent("Group set menu £47 · Sharing set menu £42");
    expect(within(d).getByRole("heading", { level: 2, name: "Christmas at Bintang" })).toBeInTheDocument();
  });
});
