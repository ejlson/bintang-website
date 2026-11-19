import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Gallery from "@/app/gallery/page";
import { PHOTOS, SECTION_COLOURS } from "@/lib/gallery";
import { BOOKING_URL } from "@/lib/nav";
import { SWEEP_FROM, SWEEP_MS, SWEEP_TO } from "@/components/ColourSweep";
import { motion } from "../vitest.setup";

// Lenis is only created by the root layout; tests hand the viewer a fake one.
const lenis = vi.hoisted(() => ({ current: null as { stop: () => void; start: () => void } | null }));
vi.mock("@/components/SmoothScroll", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/SmoothScroll")>()),
  getLenis: () => lenis.current,
}));

// ---- IntersectionObserver and Element.animate stand-ins (jsdom has neither) ----

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let ioCallback: IOCallback | null = null;
let ioOptions: IntersectionObserverInit | undefined;
const observed: Element[] = [];

class FakeIO {
  constructor(cb: IOCallback, options?: IntersectionObserverInit) {
    ioCallback = cb;
    ioOptions = options;
  }
  observe(el: Element) {
    observed.push(el);
  }
  disconnect = disconnect;
}
const disconnect = vi.fn();

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
const base = () => screen.getByTestId("colour-sweep").firstElementChild as HTMLElement;

beforeEach(() => {
  ioCallback = null;
  observed.length = 0;
  animate.mockClear();
  disconnect.mockClear();
  lenis.current = null;
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
    for (const name of ["The garden at golden hour", "The family, from the album, in the garden today", "The karaoke room, full"]) {
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
    // The site footer has its own Book a table link; these are the page's two.
    const book = screen
      .getAllByRole("link")
      .filter((a) => a.textContent?.startsWith("Book a table") && !a.closest("footer"));
    expect(book).toHaveLength(2);
    for (const a of book) {
      expect(a).toHaveAttribute("href", BOOKING_URL);
      expect(a).toHaveAttribute("target", "_blank");
    }
  });

  it("loads the two hero photos eagerly at high priority and the rest lazily", () => {
    render(<Gallery />);
    const imgs = screen.getAllByRole("button", { name: /^Open photo:/ }).map((b) => within(b).getByRole("img"));
    const eager = imgs.filter((img) => img.getAttribute("loading") === "eager");
    expect(eager.map((img) => img.getAttribute("alt"))).toEqual([
      "The garden at golden hour",
      "The shopfront on Kentish Town Road today",
    ]);
    for (const img of eager) expect(img).toHaveAttribute("fetchpriority", "high");
    for (const img of imgs.filter((i) => !eager.includes(i))) {
      expect(img).toHaveAttribute("loading", "lazy");
      expect(img).not.toHaveAttribute("fetchpriority");
    }
  });

  it("captions the three album cards with Album", () => {
    render(<Gallery />);
    const album = screen.getByRole("region", { name: "From the album" });
    for (const name of ["The original shopfront", "The dining room, years ago", "Then and now: the old dining room at today’s shopfront"]) {
      const card = screen.getByRole("button", { name: `Open photo: ${name}` }).closest("figure")!;
      expect(album).toContainElement(card);
      expect(card.querySelector("figcaption")).toHaveTextContent(`${name}Album`);
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

  it("steps back with the Previous button, wrapping from the first photo to the last", () => {
    render(<Gallery />);
    open("The garden at golden hour");
    const previous = within(dialog()).getByRole("button", { name: "Previous photo" });
    fireEvent.click(previous);
    expect(within(dialog()).getByText(`${PHOTOS.length} / ${PHOTOS.length}`)).toBeInTheDocument();
    expect(within(dialog()).getByRole("img", { name: PHOTOS[PHOTOS.length - 1].alt })).toBeInTheDocument();
    fireEvent.click(previous);
    expect(within(dialog()).getByText(`${PHOTOS.length - 1} / ${PHOTOS.length}`)).toBeInTheDocument();
  });

  it("steps through all photos in PHOTOS order, including ones not shown on the page", () => {
    render(<Gallery />);
    open("The garden at golden hour");
    const next = within(dialog()).getByRole("button", { name: "Next photo" });
    for (let i = 0; i < PHOTOS.length; i++) {
      expect(within(dialog()).getByRole("img", { name: PHOTOS[i].alt })).toBeInTheDocument();
      expect(within(dialog()).getByText(`${i + 1} / ${PHOTOS.length}`)).toBeInTheDocument();
      fireEvent.click(next);
    }
    expect(within(dialog()).getByText(`1 / ${PHOTOS.length}`)).toBeInTheDocument();
  });

  it("opens on a photo from the middle of the list", () => {
    render(<Gallery />);
    open("Behind the bar");
    const i = PHOTOS.findIndex((p) => p.id === "bar");
    expect(within(dialog()).getByText(`${i + 1} / ${PHOTOS.length}`)).toBeInTheDocument();
  });

  it("closes with the Close button and returns focus to the opener", () => {
    render(<Gallery />);
    const trigger = screen.getByRole("button", { name: "Open photo: Then and now: the old dining room at today’s shopfront" });
    fireEvent.click(trigger);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("wraps Shift+Tab from Close to Next", () => {
    render(<Gallery />);
    open("The garden at golden hour");
    fireEvent.keyDown(dialog(), { key: "Tab", shiftKey: true });
    expect(within(dialog()).getByRole("button", { name: "Next photo" })).toHaveFocus();
  });

  it("restores the page's own overflow value on close", () => {
    document.documentElement.style.overflow = "clip";
    try {
      render(<Gallery />);
      open("The garden at golden hour");
      expect(document.documentElement.style.overflow).toBe("hidden");
      fireEvent.keyDown(dialog(), { key: "Escape" });
      expect(document.documentElement.style.overflow).toBe("clip");
    } finally {
      document.documentElement.style.overflow = "";
    }
  });

  it("stops Lenis while open and starts it again on close", () => {
    const fake = { stop: vi.fn(), start: vi.fn() };
    lenis.current = fake;
    render(<Gallery />);
    fake.stop.mockClear();
    fake.start.mockClear();
    open("The garden at golden hour");
    expect(fake.stop).toHaveBeenCalledTimes(1);
    expect(fake.start).not.toHaveBeenCalled();
    // Stepping keeps the same viewer mounted: no restart.
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(fake.start).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(fake.start).toHaveBeenCalledTimes(1);
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

  it("sweeps over 1s and keeps the end frame until it settles", () => {
    render(<Gallery />);
    reach(0);
    reach(1);
    expect(animate.mock.calls[0][1]).toMatchObject({ duration: SWEEP_MS, fill: "forwards" });
    expect(SWEEP_MS).toBe(1000);
  });

  it("lands the colour on the base layer when a sweep finishes", () => {
    render(<Gallery />);
    reach(0);
    reach(2);
    act(() => animate.mock.results[0].value.onfinish());
    expect(base().style.background).toBe(SECTION_COLOURS.rooms);
  });

  it("lands the old colour at once when a new section arrives mid-sweep", () => {
    render(<Gallery />);
    reach(0);
    reach(1);
    const first = animate.mock.results[0].value;
    reach(2);
    expect(first.cancel).toHaveBeenCalled();
    expect(base().style.background).toBe(SECTION_COLOURS.album);
    expect(band().style.getPropertyValue("--sweep")).toBe(SECTION_COLOURS.rooms);
    expect(band().dataset.direction).toBe("down");
    expect(band()).toHaveProperty("hidden", false);
    // The cancelled sweep finishing late must not hide the new one.
    act(() => first.onfinish?.());
    expect(band()).toHaveProperty("hidden", false);
    act(() => animate.mock.results[1].value.onfinish());
    expect(band()).toHaveProperty("hidden", true);
    expect(base().style.background).toBe(SECTION_COLOURS.rooms);
  });

  it("does nothing when the current section is reported again", () => {
    render(<Gallery />);
    reach(0);
    reach(1);
    reach(1);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it("sets a restored scroll position's colour without a sweep", () => {
    render(<Gallery />);
    reach(3);
    expect(animate).not.toHaveBeenCalled();
    expect(band()).toHaveProperty("hidden", true);
    expect(base().style.background).toBe(SECTION_COLOURS.nights);
    // And moving back up from there sweeps up.
    reach(2);
    expect(band().dataset.direction).toBe("up");
  });

  it("ignores sections leaving the middle line", () => {
    render(<Gallery />);
    reach(0);
    act(() => ioCallback!([{ isIntersecting: false, target: observed[2] }]));
    expect(animate).not.toHaveBeenCalled();
  });

  it("observes every section with a middle-of-screen margin", () => {
    render(<Gallery />);
    expect(observed).toEqual(sweepSections());
    expect(ioOptions?.rootMargin).toBe("-50% 0px -50% 0px");
  });

  it("changes colour instantly with no Web Animations API", () => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    render(<Gallery />);
    reach(0);
    reach(2);
    expect(band()).toHaveProperty("hidden", true);
    expect(base().style.background).toBe(SECTION_COLOURS.rooms);
  });

  it("keeps the first colour for the whole page without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Gallery />);
    expect(ioCallback).toBeNull();
    // jsdom normalises #ffffff to rgb().
    expect(base().style.background).toBe("rgb(255, 255, 255)");
    expect(band()).toHaveProperty("hidden", true);
    expect(animate).not.toHaveBeenCalled();
  });

  it("disconnects the observer and cancels a running sweep on unmount", () => {
    const { unmount } = render(<Gallery />);
    reach(0);
    reach(1);
    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(animate.mock.results[0].value.cancel).toHaveBeenCalled();
  });
});

describe("Gallery fixes from review", () => {
  it("still handles Esc and arrows when a click has left focus on the page body", () => {
    render(<Gallery />);
    fireEvent.click(screen.getByRole("button", { name: "Open photo: The garden at golden hour" }));
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(screen.getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("waits for a section on the middle line before setting the first colour", () => {
    render(<Gallery />);
    act(() => ioCallback!([{ isIntersecting: false, target: observed[1] }]));
    reach(2);
    // The first real hit sets the colour without a sweep.
    expect(animate).not.toHaveBeenCalled();
    reach(1);
    expect(band().dataset.direction).toBe("up");
  });

  it("takes the section that spans the line when two are reported together", () => {
    render(<Gallery />);
    reach(0);
    const rootBounds = { top: 450 } as DOMRectReadOnly;
    act(() =>
      ioCallback!([
        { isIntersecting: true, target: observed[1], rootBounds, boundingClientRect: { top: -300, bottom: 450 } as DOMRectReadOnly },
        { isIntersecting: true, target: observed[2], rootBounds, boundingClientRect: { top: 300, bottom: 900 } as DOMRectReadOnly },
      ]),
    );
    expect(animate).toHaveBeenCalledTimes(1);
    expect(band().style.getPropertyValue("--sweep")).toBe(SECTION_COLOURS.rooms);
  });

  it("hides a half-finished band when unmounted", () => {
    const { unmount } = render(<Gallery />);
    reach(0);
    reach(2);
    const b = band();
    unmount();
    expect(b).toHaveProperty("hidden", true);
  });
});
