import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PhotoViewer } from "@/components/PhotoViewer";
import type { Photo } from "@/lib/gallery";

// Lenis is only created by the root layout; tests hand the viewer a fake one.
const lenis = vi.hoisted(() => ({ current: null as { stop: () => void; start: () => void } | null }));
vi.mock("@/components/SmoothScroll", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/SmoothScroll")>()),
  getLenis: () => lenis.current,
}));

afterEach(() => {
  lenis.current = null;
});

const PHOTOS: Photo[] = [
  { id: "wide", src: "/media/gallery/garden.jpg", alt: "Wide one", width: 1600, height: 900 },
  { id: "tall", src: "/media/gallery/shopfront.jpg", alt: "Tall one", width: 900, height: 1600 },
];

function setup(index = 0) {
  const onClose = vi.fn();
  const onStep = vi.fn();
  const view = render(<PhotoViewer photos={PHOTOS} index={index} onClose={onClose} onStep={onStep} />);
  return { onClose, onStep, ...view };
}

describe("PhotoViewer", () => {
  it("is a labelled modal dialog showing the photo and its place in the set", () => {
    setup(1);
    const dialog = screen.getByRole("dialog", { name: "Photo viewer" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("img", { name: "Tall one" })).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("asks for a narrower image for portrait photos than for landscape ones", () => {
    const { rerender, onClose, onStep } = setup(0);
    expect(screen.getByRole("img")).toHaveAttribute("sizes", "(width >= 1200px) 1100px, 100vw");
    rerender(<PhotoViewer photos={PHOTOS} index={1} onClose={onClose} onStep={onStep} />);
    expect(screen.getByRole("img")).toHaveAttribute("sizes", "(width >= 768px) 520px, 100vw");
  });

  it("leaves stepping and closing to the caller", () => {
    const { onClose, onStep } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(onStep.mock.calls).toEqual([[1], [-1]]);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handles Escape and the arrows on the document, and claims only those keys", () => {
    const { onClose, onStep } = setup();
    expect(fireEvent.keyDown(document.body, { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(document.body, { key: "ArrowLeft" })).toBe(false);
    expect(onStep.mock.calls).toEqual([[1], [-1]]);
    expect(fireEvent.keyDown(document.body, { key: "Escape" })).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    // Other keys keep their default behaviour (e.g. Enter/Space on the focused button).
    expect(fireEvent.keyDown(document.body, { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(document.body, { key: "ArrowDown" })).toBe(true);
    expect(onStep).toHaveBeenCalledTimes(2);
  });

  it("lets Tab move normally between its own middle buttons", () => {
    setup();
    const prev = screen.getByRole("button", { name: "Previous photo" });
    prev.focus();
    expect(fireEvent.keyDown(prev, { key: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(prev, { key: "Tab", shiftKey: true })).toBe(true);
  });

  it("wraps Shift+Tab from the page body to the last button", () => {
    setup();
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(document.body, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Next photo" })).toHaveFocus();
  });

  it("stops listening and unlocks the page when it unmounts", () => {
    lenis.current = { stop: vi.fn(), start: vi.fn() };
    document.documentElement.style.overflow = "auto";
    const { onClose, onStep, unmount } = setup();
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(lenis.current.stop).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.documentElement.style.overflow).toBe("auto");
    expect(lenis.current.start).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(onClose).not.toHaveBeenCalled();
    expect(onStep).not.toHaveBeenCalled();
    document.documentElement.style.overflow = "";
  });

  it("doesn't re-lock or move focus when only the photo changes", () => {
    lenis.current = { stop: vi.fn(), start: vi.fn() };
    const { rerender, onClose, onStep } = setup(0);
    const next = screen.getByRole("button", { name: "Next photo" });
    next.focus();
    rerender(<PhotoViewer photos={PHOTOS} index={1} onClose={onClose} onStep={onStep} />);
    expect(next).toHaveFocus();
    expect(lenis.current.stop).toHaveBeenCalledTimes(1);
    expect(lenis.current.start).not.toHaveBeenCalled();
  });
});
