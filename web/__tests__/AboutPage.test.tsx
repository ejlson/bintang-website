import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import About from "@/app/about/page";
import { ALBUM, DISHES, YEARS } from "@/components/AboutPage";
import { ABOUT_FILM, ABOUT_FILM_POSTER } from "@/components/AboutFilm";
import { motion } from "../vitest.setup";

const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
const pause = HTMLMediaElement.prototype.pause as unknown as ReturnType<typeof vi.fn>;
const film = () => screen.getByTestId("about-film") as HTMLVideoElement;
const pauseButton = () => screen.getByRole("button", { name: "Pause film" });
const flush = () => act(async () => {});

beforeEach(() => {
  play.mockClear();
  pause.mockClear();
});
afterEach(() => {
  motion.reduce = false;
  delete (navigator as Navigator & { connection?: unknown }).connection;
});

describe("About page", () => {
  it("has one ABOUT US title and the statement with its key phrases", () => {
    render(<About />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "About us" })).toBeInTheDocument();
    const keys = screen.getAllByText(/./, { selector: "em" }).map((e) => e.textContent);
    expect(keys).toEqual(["London’s oldest Filipino restaurant", "Kentish Town Road", "Filipino", "Asian influences"]);
  });

  it("shows the ruled facts from the site details", () => {
    render(<About />);
    expect(screen.getByText("Find us").nextElementSibling).toHaveTextContent("93 Kentish Town Road");
    expect(screen.getByText("Open").nextElementSibling).toHaveTextContent("Tue–Thu 5–9.30pm");
    expect(screen.getByText("Open").nextElementSibling).not.toHaveTextContent("Closed");
  });

  it("marks About as the current page", () => {
    render(<About />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/about"]);
  });

  it("autoplays the film muted and inline, with a poster and a pause control", async () => {
    render(<About />);
    await flush();
    expect(film()).toHaveAttribute("src", ABOUT_FILM);
    expect(film()).toHaveAttribute("poster", ABOUT_FILM_POSTER);
    expect(film().muted).toBe(true);
    expect(film()).toHaveAttribute("playsinline");
    expect(film()).toHaveAttribute("preload", "metadata");
    expect(play).toHaveBeenCalled();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(within(film().closest("figure")!).getByText("Noon at ngayon")).toHaveAttribute("lang", "tl");
  });

  it("pauses and resumes from the control", async () => {
    render(<About />);
    await flush();
    fireEvent.click(pauseButton());
    expect(pause).toHaveBeenCalled();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    play.mockClear();
    fireEvent.click(pauseButton());
    await flush();
    expect(play).toHaveBeenCalled();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("starts paused for reduced motion and loads nothing until play is pressed", async () => {
    motion.reduce = true;
    render(<About />);
    await flush();
    expect(play).not.toHaveBeenCalled();
    expect(film()).toHaveAttribute("preload", "none");
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(pauseButton());
    await flush();
    expect(play).toHaveBeenCalled();
  });

  it("starts paused for data saver", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: Object.assign(new EventTarget(), { saveData: true }),
    });
    render(<About />);
    await flush();
    expect(play).not.toHaveBeenCalled();
    expect(film()).toHaveAttribute("preload", "none");
  });

  it("shows the full lion drawing as decoration", () => {
    const { container } = render(<About />);
    const lion = container.querySelector('img[src="/brand/lion-full-paper.svg"]');
    expect(lion).toHaveAttribute("alt", "");
  });

  it("tells the history with the two family-album photos", () => {
    render(<About />);
    const history = screen.getByRole("region", { name: "Where it began. Camden, 1987." });
    expect(within(history).getByAltText(/Halloween outside the original Bintang shopfront/)).toBeInTheDocument();
    expect(within(history).getByAltText(/old bamboo-walled dining room/)).toBeInTheDocument();
    expect(within(history).getByText(/Chef Omar Shah’s parents opened Bintang/)).toBeInTheDocument();
  });

  it("lists the group's years in order", () => {
    render(<About />);
    const list = screen.getByRole("heading", { name: "From one kitchen" }).nextElementSibling as HTMLElement;
    const items = within(list).getAllByRole("listitem");
    expect(items.map((li) => li.firstElementChild?.textContent)).toEqual(YEARS.map((y) => y.year));
  });

  it("shows the then-and-now photos with captions", () => {
    render(<About />);
    for (const p of ALBUM) {
      const img = screen.getByAltText(p.alt);
      expect(img.getAttribute("src")).toContain(encodeURIComponent(p.src));
      expect(screen.getByText(p.caption)).toBeInTheDocument();
    }
  });

  it("runs the dishes on as a list and links to the menu", () => {
    render(<About />);
    const box = screen.getByRole("region", { name: /From the kitchen/ });
    for (const d of DISHES) expect(within(box).getByText(d)).toBeInTheDocument();
    expect(within(box).getByRole("link", { name: /See the menu/ })).toHaveAttribute("href", "/menu");
  });

  it("ends with an OpenTable booking link and private hire", () => {
    render(<About />);
    const come = screen.getByRole("region", { name: /Come for/ });
    const book = within(come).getByRole("link", { name: /Book a table/ });
    expect(book).toHaveAttribute("href", "https://www.opentable.co.uk/r/bintang-london");
    expect(book).toHaveAttribute("target", "_blank");
    expect(within(come).getByRole("link", { name: /Groups and private hire/ })).toHaveAttribute("href", "/contact/private-hire");
  });

  it("sets Book a table as the cinematic button, still named for OpenTable and the new tab", () => {
    render(<About />);
    const book = within(screen.getByRole("region", { name: /Come for/ })).getByRole("link", { name: /Book a table/ });
    expect(book).toHaveClass("cine-book");
    expect(book).not.toHaveClass("cine-book--sm");
    expect(book.querySelector(".cine-frame")).toHaveTextContent(/^Book a table$/);
    expect(book.getAttribute("rel")).toContain("noopener");
    expect(book).toHaveAccessibleName(/^Book a table\s*on OpenTable \(opens in a new tab\)$/);
  });
});
