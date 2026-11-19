import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
    const layers = Array.from(lion.children).map((band) => band.firstElementChild as HTMLElement);
    expect(layers).toHaveLength(3);
    expect(layers[0].style.filter).toBe("");
    const shares = layers.slice(1).map((l) => Number(/\* ([\d.]+)\)/.exec(l.style.filter)?.[1]));
    expect(shares.at(-1)).toBe(1);
    expect(shares).toEqual([...shares].sort((a, b) => a - b));
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

  it.each([
    ["Home", Home],
    ["a placeholder page", Contact],
    ["Gallery", Gallery],
  ])("is on %s", (_, Page) => {
    render(<Page />);
    expect(screen.getByRole("navigation", { name: "More" })).toBeInTheDocument();
  });
});
