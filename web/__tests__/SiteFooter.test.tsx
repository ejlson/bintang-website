import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SiteFooter } from "@/components/SiteFooter";
import Home from "@/app/page";
import Gallery from "@/app/gallery/page";
import Contact from "@/app/contact/page";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";

// next/font only works inside the Next compiler (Home pulls in lib/sakuga); effects are optional.
vi.mock("next/font/google", () => ({ Yuji_Boku: () => ({ style: { fontFamily: "x" } }) }));
vi.mock("@/lib/sakuga", () => ({ loadSakuga: () => Promise.resolve(null) }));

describe("SiteFooter", () => {
  it("links to the enquiry pages, email and phone, in English only", () => {
    const { container } = render(<SiteFooter />);
    const nav = screen.getByRole("navigation", { name: "More" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "/contact/groups",
      "/contact/private-hire",
      "/contact/karaoke",
      `mailto:${site.email}`,
      `tel:${site.phoneIntl}`,
    ]);
    expect(container.querySelector("[lang=tl]")).toBeNull();
  });

  it("opens external links in a new tab and says so", () => {
    render(<SiteFooter />);
    const booking = screen.getByRole("link", { name: /Book a table/ });
    expect(booking).toHaveAttribute("href", BOOKING_URL);
    expect(booking).toHaveAttribute("target", "_blank");
    expect(booking).toHaveAccessibleName(expect.stringContaining("opens in a new tab"));
    const map = screen.getByRole("link", { name: /93 Kentish Town Road/ });
    expect(map).toHaveAttribute("href", site.mapUrl);
    expect(map).toHaveAccessibleName(expect.stringContaining("opens in a new tab"));
  });

  it("lists every opening-hours row", () => {
    render(<SiteFooter />);
    for (const h of hours) {
      expect(screen.getByText(h.label).nextElementSibling).toHaveTextContent(h.time);
    }
  });

  it("draws the lion as hidden decoration, softer towards the bottom", () => {
    const { container } = render(<SiteFooter />);
    const lion = container.querySelector("footer > [aria-hidden=true]")!;
    // Each band (masked) holds one blurred copy.
    const layers = Array.from(lion.querySelectorAll("[data-band]")).map((band) => band.firstElementChild as HTMLElement);
    expect(layers).toHaveLength(3);
    expect(layers[0].style.filter).toBe("");
    const shares = layers.slice(1).map((l) => Number(/\* ([\d.]+)\)/.exec(l.style.filter)?.[1]));
    expect(shares.at(-1)).toBe(1);
    expect(shares).toEqual([...shares].sort((a, b) => a - b));
  });

  it("draws the body and the tail as two clipped copies, the tail turning on its base", () => {
    const { container } = render(<SiteFooter />);
    const drawing = container.querySelector("[data-band] svg")!;
    const uses = Array.from(drawing.querySelectorAll("use"));
    const refs = uses.map((u) => /^url\(#(.+)\)$/.exec(u.getAttribute("clip-path") ?? "")?.[1]);
    expect(refs[0]).toMatch(/^footer-lion-body-/);
    expect(refs[1]).toMatch(/^footer-lion-tail-/);
    for (const u of uses) expect(u.getAttribute("href")).toBe("/brand/lion-full-art.svg#art");
    // Each clip is defined once, however many fade copies use it.
    for (const id of refs) expect(container.querySelectorAll(`clipPath[id="${id}"]`)).toHaveLength(1);
    // The tail sits in a group moved to its pivot, so turning that group turns the tail on its base.
    const pivot = uses[1].closest("g[transform]")!.parentElement!.parentElement!;
    expect(pivot.getAttribute("transform")).toBe("translate(366 262)");
  });

  describe("tail swing", () => {
    let report: (ratio: number) => void = () => {};
    const observe = vi.fn();
    beforeEach(() => {
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(cb: (e: { isIntersecting: boolean; intersectionRatio: number }[]) => void) {
            report = (ratio) => act(() => cb([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]));
          }
          observe = observe;
          disconnect() {}
        },
      );
    });
    afterEach(() => vi.unstubAllGlobals());

    const lionOf = (container: HTMLElement) => container.querySelector("footer > [aria-hidden=true]")!;
    const endSwing = (lion: Element) => fireEvent.animationEnd(lion.querySelector("[data-band] svg g g")!);

    it("swings when the lion comes into view, not when it leaves", () => {
      const { container } = render(<SiteFooter />);
      const lion = lionOf(container);
      expect(observe).toHaveBeenCalledWith(lion);
      report(0.2);
      expect(lion).not.toHaveAttribute("data-swaying");
      report(0.5);
      expect(lion).toHaveAttribute("data-swaying");
      endSwing(lion);
      expect(lion).not.toHaveAttribute("data-swaying");
      // Scrolling back out past the threshold doesn't replay it.
      report(0.3);
      expect(lion).not.toHaveAttribute("data-swaying");
      // Coming back in does.
      report(0.6);
      expect(lion).toHaveAttribute("data-swaying");
    });

    it("ignores a mouse moving on mid-swing, and swings again after", () => {
      const { container } = render(<SiteFooter />);
      const lion = lionOf(container);
      fireEvent.pointerEnter(lion, { pointerType: "mouse" });
      expect(lion).toHaveAttribute("data-swaying");
      const tail = lion.querySelector("[data-band] svg g g")!;
      fireEvent.pointerEnter(lion, { pointerType: "mouse" });
      // Same elements: nothing was remounted, so the swing carries on.
      expect(lion.querySelector("[data-band] svg g g")).toBe(tail);
      endSwing(lion);
      expect(lion).not.toHaveAttribute("data-swaying");
      fireEvent.pointerEnter(lion, { pointerType: "touch" });
      expect(lion).not.toHaveAttribute("data-swaying");
      fireEvent.pointerEnter(lion, { pointerType: "mouse" });
      expect(lion).toHaveAttribute("data-swaying");
    });
  });

  it("scrolls back to the top and moves focus to the home link", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<Contact />);
    fireEvent.click(screen.getByRole("button", { name: /Back to top/ }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Bintang home" }));
    scrollTo.mockRestore();
  });

  it("labels the opening hours", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("group", { name: "Opening hours" })).toBeInTheDocument();
  });

  it("is not on Home, which ends at the hero", () => {
    render(<Home />);
    expect(screen.queryByRole("navigation", { name: "More" })).toBeNull();
  });

  it.each([
    ["a placeholder page", Contact],
    ["Gallery", Gallery],
  ])("is on %s", (_, Page) => {
    render(<Page />);
    expect(screen.getByRole("navigation", { name: "More" })).toBeInTheDocument();
  });
});
