import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import About from "@/app/about/page";
import { CHAPTERS } from "@/components/AboutPage";
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
  it("has one ABOUT title and the statement", () => {
    render(<About />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "About" })).toBeInTheDocument();
    expect(screen.getByText(/London’s oldest Filipino restaurant/)).toBeInTheDocument();
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
    expect(screen.getByText("Noon at ngayon")).toHaveAttribute("lang", "tl");
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

  it("lists the chapters as headings with Tagalog subtitles", () => {
    render(<About />);
    const chapters = screen.getByRole("region", { name: "Our story" });
    const headings = within(chapters).getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(CHAPTERS.length);
    expect(headings.map((h) => h.textContent)).toEqual(CHAPTERS.map((c) => `${c.en} ${c.tl}`));
    for (const c of CHAPTERS) {
      expect(within(chapters).getByText(c.tl)).toHaveAttribute("lang", "tl");
      expect(within(chapters).getByText(c.body)).toBeInTheDocument();
    }
  });
});
