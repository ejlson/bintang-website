import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Gallery from "@/app/gallery/page";
import { PHOTOS, SECTION_COLOURS } from "@/lib/gallery";
import { BOOKING_URL } from "@/lib/nav";
import { SWEEP_FROM, SWEEP_TO } from "@/components/ColourSweep";
import { motion } from "../vitest.setup";

// ---- IntersectionObserver and Element.animate stand-ins (jsdom has neither) ----

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let ioCallback: IOCallback | null = null;
const observed: Element[] = [];

class FakeIO {
  constructor(cb: IOCallback) {
    ioCallback = cb;
  }
  observe(el: Element) {
    observed.push(el);
  }
  disconnect() {}
}

type FakeAnim = { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null };
const animate = vi.fn<(keyframes: Keyframe[], options?: KeyframeAnimationOptions) => FakeAnim>(() => ({
  cancel: vi.fn(),
  onfinish: null,
}));

/** Pretend the section at `index` just crossed the middle of the screen. */
const reach = (index: number) =>
  act(() => {
    ioCallback!([{ isIntersecting: true, target: observed[index] }]);
  });

const sweepSections = () => Array.from(document.querySelectorAll<HTMLElement>("[data-sweep]"));
const band = () => screen.getByTestId("colour-sweep").lastElementChild as HTMLElement;

beforeEach(() => {
  ioCallback = null;
  observed.length = 0;
  animate.mockClear();
  vi.stubGlobal("IntersectionObserver", FakeIO);
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  motion.reduce = false;
});

describe("Gallery page", () => {
  it("has one H1 and marks Gallery as the current page", () => {
    render(<Gallery />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/gallery"]);
  });

  it("shows the four sections' photos as buttons that open the viewer", () => {
    render(<Gallery />);
    const shots = screen.getAllByRole("button", { name: /^Open photo:/ });
    expect(shots).toHaveLength(11);
    for (const name of ["The garden at golden hour", "Lanterns in the old dining room", "The karaoke room, full"]) {
      expect(screen.getByRole("button", { name: `Open photo: ${name}` })).toBeInTheDocument();
    }
  });

  it("labels the three rooms in English and Tagalog", () => {
    render(<Gallery />);
    for (const [en, tl] of [
      ["Kitchen", "/ Kusina"],
      ["Garden", "/ Hardin"],
      ["Karaoke", "/ Kantahan"],
    ]) {
      expect(screen.getByText(tl)).toHaveAttribute("lang", "tl");
      expect(screen.getByText(tl).parentElement).toHaveTextContent(en);
    }
  });

  it("sends both Book a table buttons to OpenTable in a new tab", () => {
    render(<Gallery />);
    const book = screen.getAllByRole("link").filter((a) => a.textContent?.startsWith("Book a table"));
    expect(book).toHaveLength(2);
    for (const a of book) {
      expect(a).toHaveAttribute("href", BOOKING_URL);
      expect(a).toHaveAttribute("target", "_blank");
    }
  });
});

describe("Gallery viewer", () => {
  const open = (name: string) => fireEvent.click(screen.getByRole("button", { name: `Open photo: ${name}` }));
  const dialog = () => screen.getByRole("dialog", { name: "Photo viewer" });

  it("opens on the clicked photo with focus on Close", () => {
    render(<Gallery />);
    open("The garden at golden hour");
    expect(within(dialog()).getByRole("img", { name: "The garden at golden hour" })).toBeInTheDocument();
    expect(within(dialog()).getByText(`1 / ${PHOTOS.length}`)).toBeInTheDocument();
    expect(within(dialog()).getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("steps with the buttons and arrow keys, wrapping at both ends", () => {
    render(<Gallery />);
    open("The garden at golden hour");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Next photo" }));
    expect(within(dialog()).getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(within(dialog()).getByText(`${PHOTOS.length} / ${PHOTOS.length}`)).toBeInTheDocument();
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(within(dialog()).getByText(`1 / ${PHOTOS.length}`)).toBeInTheDocument();
  });

  it("keeps Tab inside the viewer", () => {
    render(<Gallery />);
    open("The garden at golden hour");
    const close = within(dialog()).getByRole("button", { name: "Close" });
    const next = within(dialog()).getByRole("button", { name: "Next photo" });
    next.focus();
    fireEvent.keyDown(dialog(), { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(dialog(), { key: "Tab", shiftKey: true });
    expect(next).toHaveFocus();
  });

  it("closes on Escape and returns focus to the photo that opened it", () => {
    render(<Gallery />);
    const trigger = screen.getByRole("button", { name: "Open photo: Behind the bar" });
    fireEvent.click(trigger);
    expect(document.documentElement.style.overflow).toBe("hidden");
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe("");
  });
});

describe("Gallery colour sweep", () => {
  it("gives each section its own colour", () => {
    render(<Gallery />);
    expect(sweepSections().map((s) => s.dataset.sweep)).toEqual(Object.values(SECTION_COLOURS));
  });

  it("sets the first colour without a sweep, then sweeps down going down and up going back", () => {
    render(<Gallery />);
    reach(0);
    expect(animate).not.toHaveBeenCalled();
    expect(band()).toHaveProperty("hidden", true);

    reach(2);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][0]).toEqual([
      { transform: `translateY(${SWEEP_FROM.down})` },
      { transform: `translateY(${SWEEP_TO})` },
    ]);
    expect(band().dataset.direction).toBe("down");
    expect(band().style.getPropertyValue("--sweep")).toBe(SECTION_COLOURS.rooms);
    expect(band()).toHaveProperty("hidden", false);

    reach(1);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(animate.mock.calls[1][0]).toEqual([
      { transform: `translateY(${SWEEP_FROM.up})` },
      { transform: `translateY(${SWEEP_TO})` },
    ]);
    expect(band().dataset.direction).toBe("up");
    // The interrupted sweep was cancelled.
    expect(animate.mock.results[0].value.cancel).toHaveBeenCalled();
  });

  it("hides the band once a sweep finishes", () => {
    render(<Gallery />);
    reach(0);
    reach(1);
    act(() => animate.mock.results[0].value.onfinish());
    expect(band()).toHaveProperty("hidden", true);
  });

  it("changes colour without a sweep for reduced motion", () => {
    motion.reduce = true;
    render(<Gallery />);
    reach(0);
    reach(3);
    expect(animate).not.toHaveBeenCalled();
    expect(band()).toHaveProperty("hidden", true);
  });
});
