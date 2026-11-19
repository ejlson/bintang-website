import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Karaoke from "@/app/contact/karaoke/page";
import { KARAOKE_LANDSCAPE, KARAOKE_PORTRAIT } from "@/components/KaraokeHero";
import { motion } from "../vitest.setup";

// next/font only works inside the Next compiler; the subtitles' effects core is optional.
vi.mock("next/font/google", () => ({ Yuji_Boku: () => ({ style: { fontFamily: "x" } }) }));
vi.mock("@/lib/sakuga", () => ({ loadSakuga: () => Promise.resolve(null) }));
import { BOOKING_URL } from "@/lib/nav";
import { site } from "@/lib/site";

const subtitles = () => screen.getByTestId("subtitles");
const pauseButton = () => screen.getByRole("button", { name: "Pause video" });
const video = () => screen.getByTestId("karaoke-video") as HTMLVideoElement;
const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
const pause = HTMLMediaElement.prototype.pause as unknown as ReturnType<typeof vi.fn>;
const flush = () => act(async () => {});

beforeEach(() => {
  play.mockClear();
  pause.mockClear();
});
afterEach(() => {
  motion.reduce = false;
});

describe("Karaoke page", () => {
  it("has one KARAOKE title", () => {
    render(<Karaoke />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Karaoke" })).toBeInTheDocument();
  });

  it("marks Karaoke as the current page", () => {
    render(<Karaoke />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/contact/karaoke"]);
  });

  it("scrolls the two ways to sing over the video, after the pinned stage", () => {
    render(<Karaoke />);
    const info = screen.getByTestId("karaoke-info");
    const video = screen.getByTestId("karaoke-video");
    expect(video.compareDocumentPosition(info) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(info).getByRole("heading", { level: 2, name: "The sharing feast" })).toBeInTheDocument();
    expect(within(info).getByRole("heading", { level: 2, name: "The whole room" })).toBeInTheDocument();
  });

  it("keeps an empty space, no photo, between each column's text and its buttons", () => {
    render(<Karaoke />);
    for (const name of ["The sharing feast", "The whole room"]) {
      const region = screen.getByRole("region", { name });
      expect(within(region).queryByRole("img")).toBeNull();
      const gap = region.querySelector('[aria-hidden="true"]')!;
      const text = within(region).getAllByText(/./, { selector: "p" }).at(-1)!;
      const button = within(region).getAllByRole("link")[0];
      expect(text.compareDocumentPosition(gap) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(gap.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("marks where the information starts, for the scroll assistance", () => {
    render(<Karaoke />);
    expect(screen.getByTestId("karaoke-spacer").nextElementSibling).toBe(screen.getByTestId("karaoke-info"));
  });

  it("books a table on OpenTable in a new tab and links to the karaoke menu", () => {
    render(<Karaoke />);
    const dining = screen.getByRole("region", { name: "The sharing feast" });
    const book = within(dining).getByRole("link", { name: /Book a table/ });
    expect(book).toHaveAttribute("href", BOOKING_URL);
    expect(book).toHaveAttribute("target", "_blank");
    expect(book.getAttribute("rel")).toContain("noopener");
    expect(book).toHaveAccessibleName(/opens in a new tab/);
    expect(within(dining).getByRole("link", { name: /See the karaoke menu/ })).toHaveAttribute("href", "/menu#karaoke");
  });

  it("enquires about the karaoke room by email with a subject", () => {
    render(<Karaoke />);
    const hire = screen.getByRole("region", { name: "The whole room" });
    const href = within(hire).getByRole("link", { name: /Enquire/ }).getAttribute("href")!;
    expect(href.startsWith(`mailto:${site.email}?`)).toBe(true);
    expect(new URLSearchParams(href.split("?")[1]).get("subject")).toBe("Karaoke room hire");
    expect(within(hire).getByRole("link", { name: site.email })).toHaveAttribute("href", `mailto:${site.email}`);
  });

  it("ends on the site footer", () => {
    const { container } = render(<Karaoke />);
    expect(container.querySelector("main > div > div:last-child footer")).toBeInTheDocument();
  });

  it("uses the Home page's videoke subtitles, decorative", async () => {
    render(<Karaoke />);
    await flush();
    expect(subtitles()).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("subtitle-en")).toHaveTextContent("Welcome to Bintang");
  });

  it("fades the subtitles, dims the room and removes the subtitles once scrolled", async () => {
    render(<Karaoke />);
    await flush();
    const wrap = screen.getByTestId("karaoke-subtitles");
    const dim = screen.getByTestId("karaoke-dim");
    const shown = wrap.className;
    const undimmed = dim.className;
    await act(async () => {
      Object.defineProperty(window, "scrollY", { value: window.innerHeight, configurable: true });
      window.dispatchEvent(new Event("scroll"));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(wrap.className).not.toBe(shown);
    expect(wrap.className).toMatch(/away/);
    expect(dim.className).not.toBe(undimmed);
    // Taken off the page, so its sakuga effects can't stay frozen over the information.
    expect(screen.queryByTestId("subtitles")).toBeNull();

    // Back at the top, they come back.
    await act(async () => {
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
      window.dispatchEvent(new Event("scroll"));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(screen.getByTestId("subtitles")).toBeInTheDocument();
  });

  it("keeps the footer in the pinned group, after the information", () => {
    render(<Karaoke />);
    const info = screen.getByTestId("karaoke-info");
    const footer = document.querySelector("footer")!;
    expect(info.parentElement).toContainElement(footer);
    expect(info.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("puts a yellow navbar and lion over the video", () => {
    render(<Karaoke />);
    expect(screen.getByRole("link", { name: "Bintang home" }).querySelector("img")).toHaveAttribute(
      "src",
      "/brand/lion-head-yellow.svg",
    );
    expect(screen.getByRole("banner").className).toMatch(/yellow/);
  });

  it("plays the room video muted and inline, landscape and portrait", async () => {
    render(<Karaoke />);
    await flush();
    const sources = Array.from(video().querySelectorAll("source")).map((s) => s.getAttribute("src"));
    expect(sources).toEqual([KARAOKE_PORTRAIT, KARAOKE_LANDSCAPE]);
    expect(video()).toHaveAttribute("aria-hidden", "true");
    expect(video().muted).toBe(true);
    expect(video()).toHaveAttribute("playsinline");
    expect(play).toHaveBeenCalled();
  });

  it("pauses and resumes the video from the button", async () => {
    render(<Karaoke />);
    await flush();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pauseButton());
    await flush();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    expect(pause).toHaveBeenCalled();
    play.mockClear();
    fireEvent.click(pauseButton());
    await flush();
    expect(pauseButton()).toHaveAttribute("aria-pressed", "false");
    expect(play).toHaveBeenCalled();
  });

  it("starts still for reduced motion: no download, still subtitles, play available", async () => {
    motion.reduce = true;
    render(<Karaoke />);
    await flush();
    expect(play).not.toHaveBeenCalled();
    expect(video()).toHaveAttribute("preload", "none");
    expect(pauseButton()).toHaveAttribute("aria-pressed", "true");
    expect(subtitles()).toHaveAttribute("data-view", "still");
    fireEvent.click(pauseButton());
    await flush();
    expect(play).toHaveBeenCalled();
  });

  it("does not mention open mic anywhere", () => {
    const { container } = render(<Karaoke />);
    expect(container.textContent).not.toMatch(/open\s*mic/i);
    const attrs = Array.from(container.querySelectorAll("*")).flatMap((el) =>
      Array.from(el.attributes).map((a) => a.value),
    );
    expect(attrs.filter((v) => /open\s*mic/i.test(v))).toEqual([]);
  });
});
