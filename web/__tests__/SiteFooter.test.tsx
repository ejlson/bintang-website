import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SiteFooter } from "@/components/SiteFooter";
import Home from "@/app/page";
import Gallery from "@/app/gallery/page";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";

// next/font only works inside the Next compiler (Home pulls in lib/sakuga); effects are optional.
vi.mock("next/font/google", () => ({ Yuji_Boku: () => ({ style: { fontFamily: "x" } }) }));
vi.mock("@/lib/sakuga", () => ({ loadSakuga: () => Promise.resolve(null) }));

describe("SiteFooter", () => {
  it("links to booking, enquiry pages, email and phone, in English only", () => {
    const { container } = render(<SiteFooter />);
    const nav = screen.getByRole("navigation", { name: "More" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      BOOKING_URL,
      "/contact/groups",
      "/contact/private-hire",
      `mailto:${site.email}`,
      `tel:${site.phoneIntl}`,
    ]);
    expect(container.querySelector("[lang=tl]")).toBeNull();
    expect(within(nav).getByRole("link", { name: site.email })).toBeInTheDocument();
  });

  it("opens external links in a new tab and says so", () => {
    render(<SiteFooter />);
    const booking = screen.getByRole("link", { name: /Reserve on OpenTable/ });
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

  it.each([
    ["Home", Home],
    ["a placeholder page", Gallery],
  ])("is on %s", (_, Page) => {
    render(<Page />);
    expect(screen.getByRole("navigation", { name: "More" })).toBeInTheDocument();
  });
});
