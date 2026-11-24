import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import Contact from "@/app/contact/page";
import { CONTACT_FILM, CONTACT_FILM_POSTER } from "@/components/ContactFilm";
import { motion } from "../vitest.setup";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";

describe("Contact page", () => {
  it("has one h1 with the nav label and no Tagalog subtitle under it", () => {
    render(<Contact />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveProperty("textContent", "Contact us — Bintang, 93 Kentish Town Road, Kentish Town");
    expect(screen.getByRole("heading", { level: 1 }).nextElementSibling?.textContent ?? "").not.toContain("Makipag-ugnayan");
  });

  it("marks Contact us current in the header", () => {
    render(<Contact />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/contact"]);
  });

  it("links the address, phone and email from lib/site", () => {
    render(<Contact />);
    expect(screen.getByRole("link", { name: new RegExp(`^${site.street}.*Google Maps`) })).toHaveAttribute("href", site.mapUrl);
    const main = screen.getByRole("main");
    expect(main.querySelector(`a[href="tel:${site.phoneIntl}"]`)).toHaveTextContent(site.phone);
    expect(main.querySelector(`a[href="mailto:${site.email}"]`)).toHaveTextContent(site.email);
  });

  it("lists every opening-hours row", () => {
    render(<Contact />);
    const section = screen.getByRole("region", { name: /Hours/ });
    for (const h of hours) {
      expect(section).toHaveTextContent(h.label);
      expect(section).toHaveTextContent(h.time);
    }
  });

  it("offers booking on OpenTable and a karaoke link", () => {
    render(<Contact />);
    // The header's Book link shares this name; the page's own is the one in <main>.
    const books = screen.getAllByRole("link", { name: "Book a table on OpenTable (opens in a new tab)" });
    const pageBook = books.find((a) => a.closest("main"));
    expect(pageBook).toHaveAttribute("href", BOOKING_URL);
    expect(screen.getByRole("link", { name: /Karaoke & private hire/ })).toHaveAttribute("href", "/contact/karaoke");
  });

  it("sets Book a table like the header's Book button, opening OpenTable in a new tab", () => {
    render(<Contact />);
    const book = screen
      .getAllByRole("link", { name: /^Book a table\s*on OpenTable \(opens in a new tab\)$/ })
      .find((a) => a.closest("main") && !a.closest("header"))!;
    expect(book).toHaveClass("book");
    expect(book).not.toHaveClass("cine-book");
    expect(book.firstChild).toHaveProperty("textContent", "Book a table");
    expect(book).toHaveAttribute("target", "_blank");
    expect(book.getAttribute("rel")).toContain("noopener");
  });
});

const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
const film = () => screen.getByTestId("contact-film") as HTMLVideoElement;
const pauseButton = () => screen.getByRole("button", { name: "Pause film" });
const flush = () => act(async () => {});
const WIDE = "(min-width: 901px)";

/** Make the film's column visible (its media query matches) for this test. */
function wide() {
  const real = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) =>
    q === WIDE ? { ...real(q), matches: true } : real(q),
  );
}

describe("Contact film", () => {
  beforeEach(() => play.mockClear());
  afterEach(() => {
    motion.reduce = false;
    vi.restoreAllMocks();
  });

  it("is the Home film's portrait loop: muted, looping, inline, hidden from screen readers", () => {
    render(<Contact />);
    expect(film()).toHaveAttribute("src", CONTACT_FILM);
    expect(film()).toHaveAttribute("poster", CONTACT_FILM_POSTER);
    expect(film().muted).toBe(true);
    expect(film()).toHaveAttribute("loop");
    expect(film()).toHaveAttribute("playsinline");
    expect(film()).toHaveAttribute("aria-hidden", "true");
  });

  it("plays on wide screens, and the pause button stops and restarts it", async () => {
    wide();
    render(<Contact />);
    await flush();
    expect(play).toHaveBeenCalled();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pauseButton());
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    play.mockClear();
    fireEvent.click(pauseButton());
    await flush();
    expect(play).toHaveBeenCalled();
  });

  it("loads nothing on narrow screens, where its column is hidden", async () => {
    render(<Contact />);
    await flush();
    expect(play).not.toHaveBeenCalled();
    expect(film()).toHaveAttribute("preload", "none");
  });

  it("starts paused for reduced motion", async () => {
    motion.reduce = true;
    wide();
    render(<Contact />);
    await flush();
    expect(play).not.toHaveBeenCalled();
    expect(film()).toHaveAttribute("preload", "none");
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
  });
});
