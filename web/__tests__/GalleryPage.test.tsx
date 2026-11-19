import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Gallery from "@/app/gallery/page";
import { FIELD, PHOTOS, type PhotoId } from "@/lib/gallery";
import { motion } from "../vitest.setup";

// Lenis is only created by the root layout; tests hand the viewer a fake one.
const lenis = vi.hoisted(() => ({ current: null as { stop: () => void; start: () => void } | null }));
vi.mock("@/components/SmoothScroll", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/SmoothScroll")>()),
  getLenis: () => lenis.current,
}));

afterEach(() => {
  lenis.current = null;
});

const shots = () => screen.getAllByRole("button", { name: /^Open photo:/ });
const shot = (alt: string) => screen.getByRole("button", { name: `Open photo: ${alt}` });
const title = () => screen.getByTestId("field-title");
const dialog = () => screen.getByRole("dialog", { name: "Photo viewer" });
const viewerImg = () => within(dialog()).getByRole("img");
const galleryCss = () => readFileSync(join(process.cwd(), "components", "GalleryPage.module.css"), "utf8");

describe("Gallery data", () => {
  it("has 19 photos with unique ids: the 14 gallery photos and five from the journal", () => {
    expect(PHOTOS).toHaveLength(19);
    expect(new Set(PHOTOS.map((p) => p.id)).size).toBe(PHOTOS.length);
    expect(PHOTOS.filter((p) => p.src.startsWith("/media/gallery/"))).toHaveLength(14);
    expect(PHOTOS.filter((p) => p.src.startsWith("/media/journal/")).map((p) => p.src)).toEqual(
      ["archive-family", "karaoke", "private-hire", "brunch", "garden"].map((f) => `/media/journal/${f}.jpg`),
    );
    for (const p of PHOTOS) expect(p.alt.trim(), p.id).not.toBe("");
  });

  it("points every photo at a file that exists under public/", () => {
    for (const p of PHOTOS) expect(existsSync(join(process.cwd(), "public", p.src)), p.src).toBe(true);
  });

  it("gives every photo a spot, and lists them in reading order (row, then column)", () => {
    expect(Object.keys(FIELD).sort()).toEqual(PHOTOS.map((p) => p.id).sort());
    const spots = PHOTOS.map((p) => FIELD[p.id as PhotoId]);
    for (let i = 1; i < spots.length; i++) {
      const [a, b] = [spots[i - 1], spots[i]];
      expect(b.row > a.row || (b.row === a.row && b.col > a.col), PHOTOS[i].id).toBe(true);
    }
    for (const s of spots) {
      expect(s.col).toBeGreaterThanOrEqual(1);
      expect(s.col).toBeLessThanOrEqual(6);
      expect(s.row).toBeGreaterThanOrEqual(1);
      expect(s.row).toBeLessThanOrEqual(4);
    }
  });
});

describe("Gallery page", () => {
  it("has one H1 and marks Gallery as the current page", () => {
    render(<Gallery />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/gallery"]);
  });

  it("scatters every photo as a button, in reading order", () => {
    render(<Gallery />);
    expect(shots().map((b) => b.getAttribute("aria-label"))).toEqual(PHOTOS.map((p) => `Open photo: ${p.alt}`));
  });

  it("puts each photo in its own cell, leaving the middle four for the title", () => {
    const cells = PHOTOS.map((p) => FIELD[p.id as PhotoId]);
    const keys = cells.map((s) => `${s.col},${s.row}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const s of cells) {
      expect(s.col >= 3 && s.col <= 4 && s.row >= 2 && s.row <= 3).toBe(false);
      expect(s.size).toBeGreaterThan(0);
      expect(s.size).toBeLessThanOrEqual(100);
    }
  });

  it("places each cell with its grid position and offsets", () => {
    render(<Gallery />);
    const cell = shot("The garden at golden hour").parentElement!;
    expect(cell.style.getPropertyValue("--col")).toBe("1");
    expect(cell.style.getPropertyValue("--row")).toBe("1");
    expect(cell.style.justifyContent).toBe("flex-start");
    expect(cell.style.alignItems).toBe("flex-end");
    expect(shot("The garden at golden hour").style.transformOrigin).toBe("left top");
    expect(shot("A young guest in the karaoke room").style.transformOrigin).toBe("right bottom");
  });

  it("grows each photo towards the middle of the screen", () => {
    render(<Gallery />);
    // col 3, row 1 / col 1, row 2 / col 5, row 3 / col 4, row 4
    expect(shot("The shopfront on Kentish Town Road today").style.transformOrigin).toBe("center top");
    expect(shot("Then and now: the old dining room at today’s shopfront").style.transformOrigin).toBe("left center");
    expect(shot("The family, from the album, in the garden today").style.transformOrigin).toBe("right center");
    expect(shot("Under the bunting in the garden").style.transformOrigin).toBe("center bottom");
  });

  it("sizes each photo by its spot and shapes it by its own proportions", () => {
    render(<Gallery />);
    for (const p of PHOTOS) {
      const b = shot(p.alt);
      expect(b.style.getPropertyValue("--size")).toBe(String(FIELD[p.id as PhotoId].size));
      expect(Number(b.style.getPropertyValue("--ar"))).toBeCloseTo(p.width / p.height);
      expect(b.style.getPropertyValue("--ratio")).toBe(`${p.width} / ${p.height}`);
      expect(within(b).getByRole("img", { name: p.alt })).toBeInTheDocument();
    }
  });

  it("loads every photo up front (the field is one screen)", () => {
    render(<Gallery />);
    for (const b of shots()) expect(within(b).getByRole("img")).toHaveAttribute("loading", "eager");
  });

  it("names the hovered or focused photo in the middle of the field", () => {
    render(<Gallery />);
    expect(title()).toHaveTextContent(/^Larawan$/);
    expect(title()).toHaveAttribute("aria-hidden", "true");

    fireEvent.pointerEnter(shot("Behind the bar"), { pointerType: "mouse" });
    const i = PHOTOS.findIndex((p) => p.alt === "Behind the bar");
    expect(title()).toHaveTextContent(`Behind the bar · ${i + 1} / ${PHOTOS.length}`);
    fireEvent.pointerLeave(shot("Behind the bar"));
    expect(title()).toHaveTextContent(/^Larawan$/);

    // Real focus, so :focus-visible can match (a bare focus event can't).
    act(() => shot("The original shopfront").focus());
    expect(title()).toHaveTextContent("The original shopfront");
    act(() => shot("The original shopfront").blur());
    expect(title()).toHaveTextContent(/^Larawan$/);
  });

  it("keeps the newer photo's name when the pointer leaves an older one late", () => {
    render(<Gallery />);
    fireEvent.pointerEnter(shot("Behind the bar"), { pointerType: "mouse" });
    fireEvent.pointerEnter(shot("The original shopfront"), { pointerType: "mouse" });
    fireEvent.pointerLeave(shot("Behind the bar"));
    expect(title()).toHaveTextContent("The original shopfront");
  });

  it("has two corner labels and no count or hint between them", () => {
    const { container } = render(<Gallery />);
    const corners = Array.from(container.querySelector(".corners")!.children).map((c) => c.textContent);
    expect(corners).toEqual(["BintangSince 1987", "Kentish TownLondon NW1"]);
    expect(screen.queryByText(/\d+ photographs/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hover to look closer/)).not.toBeInTheDocument();
  });

  it("sets the big GALLERY title behind the photos as the page heading", () => {
    render(<Gallery />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/^Gallery/);
    expect(h1).toHaveClass("bigTitle");
    expect(h1.parentElement).toHaveClass("backdrop");
    expect(galleryCss()).toMatch(/\.backdrop\s*\{[^}]*z-index:\s*0;/);
  });

  it("puts every photo on a depth layer, near ones sharp and far ones soft", () => {
    render(<Gallery />);
    for (const p of PHOTOS) {
      const cell = shot(p.alt).parentElement!;
      expect(cell).toHaveAttribute("data-layer", String(FIELD[p.id as PhotoId].layer));
    }
    const css = galleryCss();
    expect(css).toMatch(/\.cell\[data-layer="1"\]\s*\{[^}]*--blur:\s*3px;/);
    expect(css).toMatch(/\.cell\[data-layer="2"\]\s*\{[^}]*--blur:\s*1\.2px;/);
    expect(css).toMatch(/\.cell\s*\{[^}]*--blur:\s*0px;/);
  });

  it("uses all three depths, with bigger photos nearer", () => {
    const spots = PHOTOS.map((p) => FIELD[p.id as PhotoId]);
    const byLayer = (l: number) => spots.filter((s) => s.layer === l).map((s) => s.size);
    for (const s of spots) expect([1, 2, 3]).toContain(s.layer);
    for (const l of [1, 2, 3]) expect(byLayer(l).length, `layer ${l}`).toBeGreaterThan(0);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(byLayer(1))).toBeLessThan(mean(byLayer(2)));
    expect(mean(byLayer(2))).toBeLessThan(mean(byLayer(3)));
    expect(Math.max(...byLayer(1))).toBeLessThan(Math.min(...byLayer(3)));
  });

  it("fades far layers as well as blurring them, and brings a hovered photo into focus (CSS)", () => {
    const css = galleryCss();
    expect(css).toMatch(/\.cell\[data-layer="2"\]\s*\{[^}]*--fade:\s*0\.94;/);
    expect(css).toMatch(/\.cell\[data-layer="1"\]\s*\{[^}]*--fade:\s*0\.82;/);
    expect(css).toMatch(/\.shot\s*\{[^}]*opacity:\s*var\(--fade\);/);
    // Blur only where a mouse can bring a photo back into focus.
    const mouse = css.slice(css.indexOf("@media (width >= 768px) and (hover: hover) and (pointer: fine)"));
    expect(mouse).toMatch(/\.shot\s*\{\s*filter:\s*blur\(var\(--blur\)\);/);
    expect(css.slice(0, css.indexOf("@media (width >= 768px) and (hover: hover)"))).not.toMatch(/filter:\s*blur/);
  });

  it("marks the resting title line as Tagalog and shows the photo's name when hovered", () => {
    render(<Gallery />);
    expect(within(title()).getByText("Larawan")).toHaveAttribute("lang", "tl");
    const last = PHOTOS[PHOTOS.length - 1];
    fireEvent.pointerEnter(shot(last.alt), { pointerType: "mouse" });
    expect(title()).toHaveTextContent(`${last.alt} · ${PHOTOS.length} / ${PHOTOS.length}`);
    expect(within(title()).queryByText("Larawan")).not.toBeInTheDocument();
    expect(title().querySelector("[lang]")).toBeNull();
  });

  it("only enlarges photos with a mouse on wide screens", () => {
    const css = galleryCss();
    const mouse = css.slice(css.indexOf("@media (width >= 768px) and (hover: hover) and (pointer: fine)"));
    expect(mouse).toMatch(/\.shot:hover,\s*\.shot:focus-visible\s*\{[^}]*transform:\s*scale\(var\(--zoom\)\)/);
    expect(css.slice(0, css.indexOf("@media (width >= 768px) and (hover: hover)"))).not.toMatch(/scale\(var\(--zoom\)\)/);
  });

  it("has the site footer", () => {
    render(<Gallery />);
    expect(screen.getByRole("navigation", { name: "More" })).toBeInTheDocument();
  });
});

describe("Gallery viewer", () => {
  it("opens on the clicked photo with focus on Close", () => {
    render(<Gallery />);
    fireEvent.click(shot("The garden at golden hour"));
    expect(within(dialog()).getByRole("img", { name: "The garden at golden hour" })).toBeInTheDocument();
    expect(within(dialog()).getByText(`1 / ${PHOTOS.length}`)).toBeInTheDocument();
    expect(within(dialog()).getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("steps with the buttons and arrow keys, wrapping at both ends", () => {
    render(<Gallery />);
    fireEvent.click(shot("The garden at golden hour"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Next photo" }));
    expect(within(dialog()).getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Previous photo" }));
    fireEvent.keyDown(document.body, { key: "ArrowLeft" });
    expect(within(dialog()).getByText(`${PHOTOS.length} / ${PHOTOS.length}`)).toBeInTheDocument();
    expect(within(dialog()).getByRole("img", { name: PHOTOS[PHOTOS.length - 1].alt })).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(within(dialog()).getByText(`1 / ${PHOTOS.length}`)).toBeInTheDocument();
  });

  it("swaps the viewer image and caption as it steps", () => {
    render(<Gallery />);
    fireEvent.click(shot("The garden at golden hour"));
    const first = viewerImg();
    expect(first.getAttribute("src")).toContain(encodeURIComponent(PHOTOS[0].src));
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    const second = viewerImg();
    expect(second).toHaveAccessibleName(PHOTOS[1].alt);
    expect(second.getAttribute("src")).toContain(encodeURIComponent(PHOTOS[1].src));
    // keyed by photo id, so a fresh <img> (no stale pixels while the next one loads)
    expect(second).not.toBe(first);
    expect(first).not.toBeInTheDocument();
    expect(within(dialog()).getByText(PHOTOS[1].alt, { exact: false })).toHaveAttribute("aria-live", "polite");
  });

  it("ignores keys other than Escape, the arrows and Tab", () => {
    render(<Gallery />);
    fireEvent.click(shot("Behind the bar"));
    const i = PHOTOS.findIndex((p) => p.alt === "Behind the bar");
    for (const key of ["Enter", " ", "ArrowUp", "ArrowDown", "a"]) {
      expect(fireEvent.keyDown(document.body, { key })).toBe(true);
    }
    expect(within(dialog()).getByText(`${i + 1} / ${PHOTOS.length}`)).toBeInTheDocument();
  });

  it("keeps Tab inside, even when a click has left focus on the page body", () => {
    render(<Gallery />);
    fireEvent.click(shot("The garden at golden hour"));
    const close = within(dialog()).getByRole("button", { name: "Close" });
    const next = within(dialog()).getByRole("button", { name: "Next photo" });
    next.focus();
    fireEvent.keyDown(next, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(next).toHaveFocus();
    next.blur();
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(close).toHaveFocus();
  });

  it("closes on Escape or Close, returning focus to the photo and unlocking the page", () => {
    lenis.current = { stop: vi.fn(), start: vi.fn() };
    document.documentElement.style.overflow = "clip";
    render(<Gallery />);
    const trigger = shot("Behind the bar");
    fireEvent.click(trigger);
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(lenis.current.stop).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe("clip");
    expect(lenis.current.start).toHaveBeenCalledTimes(1);

    fireEvent.click(trigger);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    document.documentElement.style.overflow = "";
  });

  it("returns focus to the photo that opened it, not the one it was stepped to", () => {
    render(<Gallery />);
    const trigger = shot("The garden at golden hour");
    fireEvent.click(trigger);
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(trigger).toHaveFocus();
  });

  it("names the refocused photo in the field after closing, then goes back to the title on blur", () => {
    render(<Gallery />);
    const trigger = shot("Behind the bar");
    fireEvent.click(trigger);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(title()).toHaveTextContent("Behind the bar");
    expect(trigger).toHaveFocus();
    act(() => trigger.blur());
    expect(title()).toHaveTextContent(/^Larawan$/);
  });

  it("closes cleanly when the page unmounts with the viewer open", () => {
    lenis.current = { stop: vi.fn(), start: vi.fn() };
    const { unmount } = render(<Gallery />);
    fireEvent.click(shot("Behind the bar"));
    unmount();
    expect(document.documentElement.style.overflow).toBe("");
    expect(lenis.current.start).toHaveBeenCalledTimes(1);
  });
});

describe("Gallery hover and focus names", () => {
  it("ignores touch and pen pointers (a tap opens the viewer instead)", () => {
    render(<Gallery />);
    fireEvent.pointerEnter(shot("Behind the bar"), { pointerType: "touch" });
    expect(title()).toHaveTextContent(/^Larawan$/);
  });

  it("keeps a keyboard-focused photo's name when the mouse leaves another", () => {
    render(<Gallery />);
    act(() => shot("The original shopfront").focus());
    fireEvent.pointerEnter(shot("Behind the bar"), { pointerType: "mouse" });
    expect(title()).toHaveTextContent("Behind the bar");
    fireEvent.pointerLeave(shot("Behind the bar"));
    expect(title()).toHaveTextContent("The original shopfront");
  });

  it("doesn't name a photo that only has mouse focus", () => {
    render(<Gallery />);
    const b = shot("Behind the bar");
    const matches = b.matches.bind(b);
    b.matches = (sel: string) => (sel === ":focus-visible" ? false : matches(sel));
    act(() => b.focus());
    expect(title()).toHaveTextContent(/^Larawan$/);
  });
});

describe("Gallery mouse parallax", () => {
  const field = () => shot("The garden at golden hour").closest("[class*=field]") as HTMLElement;
  const frames: FrameRequestCallback[] = [];
  const flushFrames = (n = 200) => {
    for (let k = 0; k < n && frames.length; k++) act(() => frames.shift()!(0));
  };

  it("eases the field towards the mouse with a mouse on a wide screen", () => {
    motion.desktop = true;
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb));
    render(<Gallery />);
    fireEvent.pointerMove(window, { clientX: window.innerWidth, clientY: 0 });
    flushFrames(1);
    const first = Number(field().style.getPropertyValue("--px"));
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(1);
    flushFrames();
    expect(Number(field().style.getPropertyValue("--px"))).toBeCloseTo(1, 2);
    expect(Number(field().style.getPropertyValue("--py"))).toBeCloseTo(-1, 2);
    raf.mockRestore();
    motion.desktop = false;
  });

  afterEach(() => {
    frames.length = 0;
    vi.restoreAllMocks();
  });

  /** Mouse on a wide screen, with frames queued in `frames` until flushed. */
  const desktopFrames = () => {
    motion.desktop = true;
    return vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb));
  };

  it("eases back to the middle when the pointer leaves the page", () => {
    desktopFrames();
    render(<Gallery />);
    fireEvent.pointerMove(window, { clientX: 0, clientY: window.innerHeight });
    flushFrames();
    expect(Number(field().style.getPropertyValue("--px"))).toBeCloseTo(-1, 2);
    expect(Number(field().style.getPropertyValue("--py"))).toBeCloseTo(1, 2);
    fireEvent.pointerLeave(document.documentElement);
    flushFrames();
    expect(Number(field().style.getPropertyValue("--px"))).toBeCloseTo(0, 2);
    expect(Number(field().style.getPropertyValue("--py"))).toBeCloseTo(0, 2);
  });

  it("maps the middle of the window to 0 and stops asking for frames once settled", () => {
    const raf = desktopFrames();
    render(<Gallery />);
    fireEvent.pointerMove(window, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    // Already at the target: one frame writes 0 and no more are queued.
    flushFrames();
    expect(raf).toHaveBeenCalledTimes(1);
    expect(Number(field().style.getPropertyValue("--px"))).toBe(0);
    expect(Number(field().style.getPropertyValue("--py"))).toBe(0);

    fireEvent.pointerMove(window, { clientX: window.innerWidth, clientY: window.innerHeight });
    flushFrames();
    expect(frames).toHaveLength(0);
    const calls = raf.mock.calls.length;
    expect(calls).toBeGreaterThan(2);
    expect(calls).toBeLessThan(200);
  });

  it("queues one frame at a time however many moves arrive", () => {
    const raf = desktopFrames();
    render(<Gallery />);
    for (let k = 0; k < 5; k++) fireEvent.pointerMove(window, { clientX: k * 10, clientY: k * 10 });
    expect(raf).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(1);
  });

  it("removes its listeners, cancels the pending frame and clears --px/--py on unmount", () => {
    desktopFrames();
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const winAdd = vi.spyOn(window, "addEventListener");
    const winRemove = vi.spyOn(window, "removeEventListener");
    const docAdd = vi.spyOn(document.documentElement, "addEventListener");
    const docRemove = vi.spyOn(document.documentElement, "removeEventListener");
    const { unmount } = render(<Gallery />);
    const el = field();
    fireEvent.pointerMove(window, { clientX: window.innerWidth, clientY: 0 });
    flushFrames(3);
    expect(el.style.getPropertyValue("--px")).not.toBe("");
    expect(frames).toHaveLength(1);

    const onMove = winAdd.mock.calls.find(([t]) => t === "pointermove")![1];
    const onLeave = docAdd.mock.calls.find(([t]) => t === "pointerleave")![1];
    unmount();
    expect(winRemove).toHaveBeenCalledWith("pointermove", onMove);
    expect(docRemove).toHaveBeenCalledWith("pointerleave", onLeave);
    // The mock hands out ids from 1 up, so a real pending frame id is non-zero.
    expect(cancel).toHaveBeenCalled();
    expect(cancel.mock.calls.at(-1)![0]).toBeGreaterThan(0);
    expect(el.style.getPropertyValue("--px")).toBe("");
    expect(el.style.getPropertyValue("--py")).toBe("");
  });

  it("doesn't listen for the mouse on narrow screens", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const winAdd = vi.spyOn(window, "addEventListener");
    const docAdd = vi.spyOn(document.documentElement, "addEventListener");
    render(<Gallery />);
    expect(winAdd.mock.calls.some(([t]) => t === "pointermove")).toBe(false);
    expect(docAdd.mock.calls.some(([t]) => t === "pointerleave")).toBe(false);
    fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
    expect(raf).not.toHaveBeenCalled();
    expect(field().style.getPropertyValue("--px")).toBe("");
  });

  it("asks for a mouse as well as width, so a wide touch screen stays still", () => {
    motion.desktop = true;
    const real = window.matchMedia;
    const mm = vi.spyOn(window, "matchMedia").mockImplementation((q: string) => {
      const m = real(q);
      return q.includes("hover: hover") && q.includes("pointer: fine") ? { ...m, matches: false } : m;
    });
    const winAdd = vi.spyOn(window, "addEventListener");
    render(<Gallery />);
    expect(mm).toHaveBeenCalledWith("(width >= 768px) and (hover: hover) and (pointer: fine)");
    expect(winAdd.mock.calls.some(([t]) => t === "pointermove")).toBe(false);
    fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
    expect(field().style.getPropertyValue("--px")).toBe("");
  });

  it("shifts each layer by its own factor and the title the other way (CSS)", () => {
    const css = galleryCss();
    expect(css).toMatch(/--travel-x:\s*32px;/);
    expect(css).toMatch(/--travel-y:\s*22px;/);
    expect(css).toMatch(/\.cell\s*\{[^}]*--f:\s*1;/);
    expect(css).toMatch(/\.cell\[data-layer="2"\]\s*\{[^}]*--f:\s*0\.55;/);
    expect(css).toMatch(/\.cell\[data-layer="1"\]\s*\{[^}]*--f:\s*0\.25;/);
    expect(css).toMatch(/\.cell\s*\{[^}]*var\(--px, 0\) \* var\(--f\) \* var\(--travel-x\)/);
    expect(css).toMatch(/\.backdrop\s*\{[^}]*var\(--px, 0\) \* -0\.2 \* var\(--travel-x\)/);
  });

  it("stays still for reduced motion", () => {
    motion.reduce = true;
    motion.desktop = true;
    render(<Gallery />);
    fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
    expect(field().style.getPropertyValue("--px")).toBe("");
    motion.reduce = false;
  });
});
