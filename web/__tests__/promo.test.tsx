import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  CHRISTMAS_ART,
  CHRISTMAS_ENDS,
  CHRISTMAS_MINI,
  CHRISTMAS_PROMO_KEY,
  PROMO_DELAY_MS,
  isChristmasLive,
} from "@/lib/promo";
import { useChristmasLive } from "@/lib/useChristmasLive";

afterEach(() => {
  vi.useRealTimers();
});

function Probe() {
  const live = useChristmasLive();
  return <p data-testid="live">{String(live)}</p>;
}

describe("lib/promo", () => {
  it("ends at midnight GMT at the start of 1 January 2027 (UK time in winter)", () => {
    expect(CHRISTMAS_ENDS).toBe(Date.parse("2027-01-01T00:00:00Z"));
    expect(new Date(CHRISTMAS_ENDS).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("isChristmasLive is true up to the last millisecond of 2026 and false from the end on", () => {
    expect(isChristmasLive(Date.parse("2026-11-24T09:00:00Z"))).toBe(true);
    expect(isChristmasLive(Date.parse("2026-12-31T23:59:59Z"))).toBe(true);
    expect(isChristmasLive(CHRISTMAS_ENDS - 1)).toBe(true);
    expect(isChristmasLive(CHRISTMAS_ENDS)).toBe(false);
    expect(isChristmasLive(CHRISTMAS_ENDS + 1)).toBe(false);
    expect(isChristmasLive(Date.parse("2027-06-01T00:00:00Z"))).toBe(false);
  });

  it("isChristmasLive defaults to the current clock", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(CHRISTMAS_ENDS - 1);
    expect(isChristmasLive()).toBe(true);
    vi.setSystemTime(CHRISTMAS_ENDS);
    expect(isChristmasLive()).toBe(false);
  });

  it("uses the specified session key and delay", () => {
    expect(CHRISTMAS_PROMO_KEY).toBe("bintang-xmas-2026");
    expect(PROMO_DELAY_MS).toBe(600);
  });

  it("only references promo images that exist in public/", () => {
    for (const src of [CHRISTMAS_ART.src, CHRISTMAS_MINI.src]) {
      expect(existsSync(join(process.cwd(), "public", src)), src).toBe(true);
    }
    expect(CHRISTMAS_ART.alt.trim()).not.toBe("");
  });
});

describe("useChristmasLive", () => {
  it("is null in server HTML, whatever the date", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    for (const now of [CHRISTMAS_ENDS - 1, CHRISTMAS_ENDS]) {
      vi.setSystemTime(now);
      expect(renderToString(<Probe />)).toContain(">null<");
    }
  });

  it("is true in the browser while live and false after", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(CHRISTMAS_ENDS - 1);
    const { unmount } = render(<Probe />);
    expect(screen.getByTestId("live")).toHaveTextContent("true");
    unmount();

    vi.setSystemTime(CHRISTMAS_ENDS);
    render(<Probe />);
    expect(screen.getByTestId("live")).toHaveTextContent("false");
  });
});
