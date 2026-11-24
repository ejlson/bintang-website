import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Privacy, { metadata } from "@/app/privacy/page";
import { privacySections } from "@/components/PrivacyPage";
import sitemap from "@/app/sitemap";
import { BOOKING_URL } from "@/lib/nav";
import { SITE_URL } from "@/lib/seo";
import { site } from "@/lib/site";

describe("Privacy page", () => {
  it("has one h1 and a section heading for every part of the notice", () => {
    render(<Privacy />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Privacy notice");
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s).toHaveLength(privacySections.length);
    // The section numbers are decorative (aria-hidden): each heading is named by its title alone.
    h2s.forEach((h, i) => expect(h).toHaveAccessibleName(privacySections[i].title));
  });

  it("lists every section in “On this page”, linked to its anchor", () => {
    const { container } = render(<Privacy />);
    const toc = screen.getByRole("navigation", { name: "On this page" });
    const hrefs = within(toc)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(privacySections.map((s) => `#${s.id}`));
    for (const s of privacySections) expect(container.querySelector(`section#${s.id}`)).not.toBeNull();
  });

  it("names the contact details from lib/site", () => {
    render(<Privacy />);
    const main = screen.getByRole("main");
    expect(main.querySelector(`a[href="mailto:${site.email}"]`)).toHaveTextContent(site.email);
    expect(main.querySelector(`a[href="tel:${site.phoneIntl}"]`)).toHaveTextContent(site.phone);
    expect(main).toHaveTextContent(`${site.street}, ${site.locality} ${site.postcode}`);
  });

  it("covers the facts: Cloudflare, Adobe Fonts, OpenTable, no cookies, the ICO", () => {
    const { container } = render(<Privacy />);
    const main = screen.getByRole("main");
    for (const t of ["Cloudflare", "use.typekit.net", "OpenTable", "sets no cookies", "Information Commissioner’s Office"]) {
      expect(main).toHaveTextContent(t);
    }
    const booking = within(container.querySelector<HTMLElement>("#bookings-and-links")!).getByRole("link", { name: /Book a table/ });
    expect(booking).toHaveAttribute("href", BOOKING_URL);
    expect(booking).toHaveAccessibleName(expect.stringContaining("opens in a new tab"));
  });

  it("shows every unverified fact as a bracketed placeholder, not an invented value", () => {
    render(<Privacy />);
    const main = screen.getByRole("main");
    for (const p of ["[LEGAL ENTITY NAME]", "[ICO REGISTRATION NUMBER]", "[RETENTION PERIOD]", "[DATE]"]) {
      expect(main).toHaveTextContent(p);
    }
  });

  it("sets its canonical and Open Graph card with pageMeta", () => {
    expect(metadata.title).toBe("Privacy notice");
    expect(metadata.alternates?.canonical).toBe("/privacy");
    expect(metadata.openGraph).toMatchObject({ url: "/privacy", title: "Privacy notice · Bintang" });
  });

  it("is listed in the sitemap, at low priority", () => {
    const entry = sitemap().find((e) => e.url === `${SITE_URL}/privacy`);
    expect(entry).toMatchObject({ priority: 0.2 });
  });

  it("sets white type on About's red", () => {
    const css = readFileSync(join(process.cwd(), "components", "PrivacyPage.module.css"), "utf8");
    expect(css).toMatch(/\.page \{[^}]*background: var\(--red-deep\);[^}]*--ground: var\(--red-deep\);[^}]*color: #fff;/);
  });
});
