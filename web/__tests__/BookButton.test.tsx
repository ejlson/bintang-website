import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { BOOKING_URL } from "@/lib/nav";

const { loadSakugaButton } = vi.hoisted(() => ({ loadSakugaButton: vi.fn() }));
vi.mock("@/lib/sakuga-button", () => ({ loadSakugaButton }));

import { BookButton } from "@/components/BookButton";

function fakeFx(over: Partial<{ paused: boolean; calm: boolean }> = {}) {
  return { paused: false, calm: false, ...over };
}

async function renderUpgraded(fx: ReturnType<typeof fakeFx>) {
  loadSakugaButton.mockResolvedValue(fx);
  const view = render(<BookButton />);
  await act(async () => {});
  const el = view.container.querySelector("sakuga-button") as HTMLElement;
  expect(el).not.toBeNull();
  return el;
}

let open: ReturnType<typeof vi.fn>;

beforeEach(() => {
  open = vi.fn(() => ({ opener: window }));
  vi.stubGlobal("open", open);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  loadSakugaButton.mockReset();
});

describe("BookButton", () => {
  it("is a plain OpenTable link until the Sakuga button loads (and stays one if it can't)", async () => {
    loadSakugaButton.mockResolvedValue(null);
    render(<BookButton />);
    await act(async () => {});
    const link = screen.getByRole("link", { name: "Book a table on OpenTable (opens in a new tab)" });
    expect(link).toHaveAttribute("href", BOOKING_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(document.querySelector("sakuga-button")).toBeNull();
  });

  it("upgrades to <sakuga-button> and opens OpenTable after the impact lands", async () => {
    const el = await renderUpgraded(fakeFx());
    expect(el).toHaveTextContent("Book a table on OpenTable (opens in a new tab)");
    vi.useFakeTimers();
    fireEvent.click(el);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(320);
    expect(open).toHaveBeenCalledExactlyOnceWith(BOOKING_URL, "_blank");
  });

  it("opens at once, and stops the reaction, while the effects clock is paused", async () => {
    const el = await renderUpgraded(fakeFx({ paused: true }));
    const inner = document.createElement("span");
    el.append(inner);
    const reaction = vi.fn();
    inner.addEventListener("pointerdown", reaction);
    inner.addEventListener("click", reaction);
    fireEvent.pointerDown(inner);
    fireEvent.click(inner);
    expect(reaction).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledExactlyOnceWith(BOOKING_URL, "_blank");
  });

  it("opens at once under reduced motion", async () => {
    const el = await renderUpgraded(fakeFx({ calm: true }));
    fireEvent.click(el);
    expect(open).toHaveBeenCalledOnce();
  });

  it("falls back to this tab if a popup blocker stops the new tab", async () => {
    open.mockReturnValue(null);
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const el = await renderUpgraded(fakeFx({ calm: true }));
    fireEvent.click(el);
    expect(assign).toHaveBeenCalledWith(BOOKING_URL);
  });
});
