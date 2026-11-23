import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import Gallery from "@/app/gallery/page";
import { BENTO, PHOTOS, type PhotoId, type Tile } from "@/lib/gallery";
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
const dialog = () => screen.getByRole("dialog", { name: "Photo viewer" });
const viewerImg = () => within(dialog()).getByRole("img");
const galleryCss = () => readFileSync(join(process.cwd(), "components", "GalleryPage.module.css"), "utf8");
const tiles = () => PHOTOS.map((p) => BENTO[p.id as PhotoId]);

/**
 * Places tiles the way CSS grid auto-placement does without `dense`: each one
 * goes at or after the previous one, never back into an earlier hole.
 * Returns the filled cells and each tile's top-left, in order.
 */
function packInOrder(spans: { w: number; h: number }[], cols: number) {
  const filled = new Set<string>();
  const starts: [number, number][] = [];
  const free = (c: number, r: number, w: number, h: number) => {
    if (c + w > cols) return false;
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (filled.has(`${x},${y}`)) return false;
    return true;
  };
  let [cr, cc] = [0, 0];
  for (const { w, h } of spans) {
    let r = cr;
    let c = cc;
    while (!free(c, r, w, h)) {
      c++;
      if (c >= cols) {
        c = 0;
        r++;
      }
    }
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) filled.add(`${x},${y}`);
    starts.push([r, c]);
    [cr, cc] = [r, c + w];
  }
  return { filled, starts };
}

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

  it("gives every photo a bento tile, in reading order (row, then column)", () => {
    expect(Object.keys(BENTO).sort()).toEqual(PHOTOS.map((p) => p.id).sort());
    const t = tiles();
    for (let i = 1; i < t.length; i++) {
      const [a, b] = [t[i - 1], t[i]];
      expect(b.row > a.row || (b.row === a.row && b.col > a.col), PHOTOS[i].id).toBe(true);
    }
  });

  it("fills the six-column grid exactly: no overlaps, no holes", () => {
    const cells = new Map<string, string>();
    PHOTOS.forEach((p, i) => {
      const t: Tile = tiles()[i];
      expect(t.col + t.w - 1, p.id).toBeLessThanOrEqual(6);
      for (let y = t.row; y < t.row + t.h; y++)
        for (let x = t.col; x < t.col + t.w; x++) {
          expect(cells.get(`${x},${y}`), `${p.id} overlaps at ${x},${y}`).toBeUndefined();
          cells.set(`${x},${y}`, p.id);
        }
    });
    const rows = Math.max(...tiles().map((t) => t.row + t.h - 1));
    expect(cells.size).toBe(6 * rows);
  });

  it("packs the two-column phone grid in reading order, without holes", () => {
    const { filled, starts } = packInOrder(tiles().map((t) => ({ w: t.pw, h: t.ph })), 2);
    const rows = Math.max(...[...filled].map((k) => Number(k.split(",")[1]))) + 1;
    expect(filled.size).toBe(2 * rows);
    // Every tile starts on a later row than the last, or further along the same row.
    for (let i = 1; i < starts.length; i++) {
      const [[r0, c0], [r1, c1]] = [starts[i - 1], starts[i]];
      expect(r1 > r0 || (r1 === r0 && c1 > c0), PHOTOS[i].id).toBe(true);
    }
  });

  it("gives each of the 14 film stills a looping clip beside it; the journal photos are stills", () => {
    for (const p of PHOTOS) {
      const v = (p as { video?: string }).video;
      if (p.src.startsWith("/media/gallery/")) {
        expect(v, p.id).toBe(p.src.replace(/\.jpg$/, ".mp4"));
        expect(existsSync(join(process.cwd(), "public", v!)), v).toBe(true);
      } else expect(v, p.id).toBeUndefined();
    }
  });

  it("shapes tiles by the photo: landscape wide, portrait tall", () => {
    PHOTOS.forEach((p, i) => {
      const t = tiles()[i];
      if (p.width > p.height) expect(t.w, p.id).toBeGreaterThanOrEqual(t.h);
      if (p.height > p.width * 1.5) {
        expect(t.h, p.id).toBe(2);
        expect(t.ph, p.id).toBe(2);
      }
    });
  });
});

describe("Gallery page", () => {
  it("has one H1 and marks Gallery as the current page", () => {
    render(<Gallery />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Gallery/, current: "page" })).toBeInTheDocument();
  });

  it("shows every photo as a button in one grid, in reading order", () => {
    render(<Gallery />);
    const grid = screen.getByTestId("gallery-grid");
    expect(within(grid).getAllByRole("button", { name: /^Open photo:/ })).toHaveLength(PHOTOS.length);
    expect(shots().map((b) => b.getAttribute("aria-label"))).toEqual(PHOTOS.map((p) => `Open photo: ${p.alt}`));
  });

  it("has no view switch", () => {
    render(<Gallery />);
    expect(screen.queryByRole("group", { name: "Gallery view" })).not.toBeInTheDocument();
    for (const name of ["Field", "Grid", "One at a time"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("places each tile with its desktop position and phone spans", () => {
    render(<Gallery />);
    PHOTOS.forEach((p, i) => {
      const t = tiles()[i];
      const el = shots()[i];
      expect(el.style.getPropertyValue("--col")).toBe(String(t.col));
      expect(el.style.getPropertyValue("--row")).toBe(String(t.row));
      expect(el.style.getPropertyValue("--w")).toBe(String(t.w));
      expect(el.style.getPropertyValue("--h")).toBe(String(t.h));
      expect(el.style.getPropertyValue("--pw")).toBe(String(t.pw));
      expect(el.style.getPropertyValue("--ph")).toBe(String(t.ph));
    });
  });

  it("sizes each image for its tile and loads only the first block up front", () => {
    render(<Gallery />);
    PHOTOS.forEach((p, i) => {
      const t = tiles()[i];
      const img = within(shots()[i]).getByRole("img", { name: p.alt });
      expect(img.getAttribute("sizes")).toBe(`(width >= 768px) ${t.w * 17}vw, ${t.pw * 50}vw`);
      expect(img.getAttribute("loading")).toBe(i < 4 ? "eager" : "lazy");
    });
  });

  it("captions each tile with its number and name, hidden from screen readers", () => {
    render(<Gallery />);
    const cap = shots()[1].querySelector("[aria-hidden='true']");
    expect(cap).toHaveTextContent(`02 ${PHOTOS[1].alt}`);
  });

  it("places phones in order, wide screens by hand on six columns, 4px gaps and sides on the loader's black, and only zooms on hover with a mouse (CSS)", () => {
    const css = galleryCss();
    expect(css).not.toMatch(/dense/);
    expect(css).not.toMatch(/max-width: \d+px/);
    expect(css).toMatch(/--gap: 4px/);
    expect(css).toMatch(/\.page \{[^}]*background: #0e0b0a/);
    // The same 4px at the sides as between tiles; six columns on wide screens.
    expect(css).toMatch(/\.wrap \{[^}]*padding: 0 4px/);
    expect(css).toMatch(/--cols: 6/);
    expect(css).toMatch(/grid-column: var\(--col\) \/ span var\(--w\)/);
    expect(css).toMatch(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*\.tile:hover img/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });

  it("doesn't round the corners of any photo or caption (CSS)", () => {
    expect(galleryCss()).not.toMatch(/border-radius/);
  });

  it("plays each clip muted and looping over its still, hidden from screen readers", () => {
    render(<Gallery />);
    PHOTOS.forEach((p, i) => {
      const v = shots()[i].querySelector("video");
      const src = (p as { video?: string }).video;
      if (!src) return expect(v, p.id).toBeNull();
      expect(v).toHaveAttribute("src", src);
      expect(v!.muted).toBe(true);
      expect(v).toHaveAttribute("loop");
      expect(v).toHaveAttribute("playsinline");
      expect(v).toHaveAttribute("preload", "none");
      expect(v).toHaveAttribute("aria-hidden", "true");
      expect(within(shots()[i]).getByRole("img", { name: p.alt })).toBeInTheDocument();
    });
  });

  it("keeps the stills and plays no clips for reduced motion", () => {
    motion.reduce = true;
    render(<Gallery />);
    expect(screen.queryAllByTestId("loop-video")).toHaveLength(0);
    expect(within(screen.getByTestId("gallery-grid")).getAllByRole("img")).toHaveLength(PHOTOS.length);
    motion.reduce = false;
  });

  it("plays the clip in the viewer too", () => {
    render(<Gallery />);
    fireEvent.click(shot("The garden at golden hour"));
    expect(within(dialog()).getByTestId("loop-video")).toHaveAttribute("src", "/media/gallery/garden.mp4");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Next photo" }));
    // The journal photo has no clip; the garden's layer stays underneath until the new one has opened.
    const layers = within(dialog()).getByTestId("flick-stage").querySelectorAll("[data-fresh] video");
    expect(layers).toHaveLength(0);
  });

  it("darkens the edges of every page softly, with a fixed vignette that holds still through page changes (CSS)", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const rule = css.match(/\.vignette \{[^}]*\}/)?.[0] ?? "";
    expect(rule).toMatch(/position: fixed/);
    expect(rule).toMatch(/pointer-events: none/);
    expect(rule).toMatch(/rgb\(14 11 10 \/ 0\.55\) 100%/);
    // Over the photos (the grid is z-index 1), under the header, bars and pause buttons (3 and up).
    expect(rule).toMatch(/z-index: 2/);
    // Its own transition layer, above both pages and not animated, so it never pops in.
    expect(rule).toMatch(/view-transition-name: vignette/);
    expect(css).toMatch(/::view-transition-group\(vignette\) \{[^}]*z-index: 3;[^}]*animation: none/);
    expect(css).toMatch(/::view-transition-old\(vignette\) \{[^}]*display: none/);
    const layout = readFileSync(join(process.cwd(), "app", "layout.tsx"), "utf8");
    expect(layout).toMatch(/<div className="vignette" aria-hidden="true" \/>/);
    expect(galleryCss()).not.toMatch(/::after/);
  });

  it("sets a big decorative GALLERY before the grid, pinned under it so the photos scroll over it", () => {
    render(<Gallery />);
    const title = screen.getByTestId("gallery-title");
    expect(title).toHaveAttribute("aria-hidden", "true");
    expect(title).toHaveTextContent(/^Gallery$/);
    // Comes first, then the grid.
    expect(title.compareDocumentPosition(screen.getByTestId("gallery-grid")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const css = galleryCss();
    expect(css).toMatch(/\.title \{[^}]*position: sticky[^}]*z-index: 0/);
    expect(css).toMatch(/\.wrap \{[^}]*position: relative;\s*z-index: 1/);
    expect(css).toMatch(/\.titleText \{[^}]*color: var\(--red\)/);
    // Darkens with the scroll, gone once the grid covers it.
    expect(css).toMatch(
      /animation-timeline: scroll\(root\);\s*animation-range: 0 calc\(104px \+ 15\.645vw \+ 2 \* clamp\(8px, 1vw, 14px\)\)/,
    );
    // Red rules above and below the word.
    expect(title.firstElementChild).toHaveClass("titleRule");
    expect(css).toMatch(/\.titleRule \{[^}]*border-top: 2px solid var\(--red\);\s*border-bottom: 2px solid var\(--red\)/);
    expect(css).toMatch(/@keyframes title-dim \{\s*to \{\s*opacity: 0;/);
  });

  it("sets the header, lion and footer in red (the footer takes the page's colour)", () => {
    const { container } = render(<Gallery />);
    expect(container.querySelector("header img")).toHaveAttribute("src", "/brand/lion-head-red.svg");
    expect(container.querySelector("header")!.className).toMatch(/red/);
    expect(galleryCss()).toMatch(/\.page \{[^}]*color: var\(--red\)/);
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
    // The new photo is a fresh layer opening over the last (BUNSO-style);
    // the old one stays underneath, hidden from assistive tech, until it has opened.
    expect(second).not.toBe(first);
    expect(first.closest("[aria-hidden='true']")).not.toBeNull();
    expect(second.closest("[data-fresh]")).not.toBeNull();
    expect(within(dialog()).getByText(PHOTOS[1].alt).closest("p")).toHaveAttribute("aria-live", "polite");
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

  it("closes cleanly when the page unmounts with the viewer open", () => {
    lenis.current = { stop: vi.fn(), start: vi.fn() };
    const { unmount } = render(<Gallery />);
    fireEvent.click(shot("Behind the bar"));
    unmount();
    expect(document.documentElement.style.overflow).toBe("");
    expect(lenis.current.start).toHaveBeenCalledTimes(1);
  });
});

describe("Gallery viewer flicking", () => {
  it("turns photos with the scroll wheel in the full viewer", () => {
    vi.spyOn(performance, "now").mockReturnValue(10_000);
    render(<Gallery />);
    fireEvent.click(shot("The garden at golden hour"));
    const stage = within(dialog()).getByTestId("flick-stage");
    fireEvent.wheel(stage, { deltaY: 120 });
    expect(within(dialog()).getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    // Too soon after the last turn: ignored.
    fireEvent.wheel(stage, { deltaY: 120 });
    expect(within(dialog()).getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    vi.mocked(performance.now).mockReturnValue(11_000);
    fireEvent.wheel(stage, { deltaY: -120 });
    expect(within(dialog()).getByText(`1 / ${PHOTOS.length}`)).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("turns one photo per trackpad flick, however long its momentum runs, and leaves pinch-zoom alone", () => {
    const now = vi.spyOn(performance, "now").mockReturnValue(10_000);
    render(<Gallery />);
    fireEvent.click(shot("The garden at golden hour"));
    const stage = within(dialog()).getByTestId("flick-stage");
    fireEvent.wheel(stage, { deltaY: 60 });
    expect(within(dialog()).getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    // Momentum: small events every 100ms for 1.5s, well past the 450ms rest.
    for (let t = 10_100; t <= 11_500; t += 100) {
      now.mockReturnValue(t);
      fireEvent.wheel(stage, { deltaY: 30 });
    }
    expect(within(dialog()).getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    // A pinch (ctrlKey) is not a turn, and isn't prevented.
    now.mockReturnValue(20_000);
    expect(fireEvent.wheel(stage, { deltaY: 120, ctrlKey: true })).toBe(true);
    expect(within(dialog()).getByText(`2 / ${PHOTOS.length}`)).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("keeps the arrows still as the names change: a fixed caption box, the count on one line (CSS)", () => {
    const css = readFileSync(join(process.cwd(), "components", "PhotoViewer.module.css"), "utf8");
    const rule = css.match(/\.caption \{[^}]*\}/)?.[0] ?? "";
    expect(rule).toMatch(/\n  width: min\(/);
    expect(rule).toMatch(/\n  height: calc\(var\(--lines\)/);
    expect(rule).toMatch(/justify-content: flex-end/);
    expect(css).toMatch(/\.name \{[^}]*-webkit-line-clamp: var\(--lines\)/);
  });
});
