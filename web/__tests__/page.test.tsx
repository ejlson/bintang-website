import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// next/font only works inside the Next compiler (lib/sakuga uses Yuji_Boku); effects are optional.
vi.mock("next/font/google", () => ({ Yuji_Boku: () => ({ style: { fontFamily: "x" } }) }));
vi.mock("@/lib/sakuga", () => ({ loadSakuga: () => Promise.resolve(null) }));

afterEach(() => {
  delete document.documentElement.dataset.homeIntro;
  sessionStorage.clear();
});

describe("Home page", () => {
  it("renders the header and hero without crashing", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bintang home" })).toHaveAttribute("href", "/");
    // Paper (cream) lion head over the dark hero video, not the red one.
    expect(screen.getByRole("link", { name: "Bintang home" }).querySelector("img")).toHaveAttribute(
      "src",
      "/brand/lion-head-paper.svg",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Welcome to Bintang — London’s oldest Filipino restaurant, Kentish Town since 1987",
    );
    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
    // The karaoke subtitles were dropped from Home; the poster title replaces them.
    expect(screen.queryByTestId("subtitles")).toBeNull();
    expect(screen.getByTestId("home-title")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Pause background video" })).toBeInTheDocument();
    expect(screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"))).toHaveLength(0);
  });

  it("marks main, the hero film and the hero chrome with the intro classes", () => {
    render(<Home />);
    // CSS modules are non-scoped in tests, so the class is the bare name.
    expect(screen.getByRole("main")).toHaveClass("home");
    expect(screen.getByTestId("hero-video")).toHaveClass("film");
    expect(screen.getByRole("button", { name: "Pause background video" })).toHaveClass("hud");
    expect(screen.getByRole("link", { name: "Watch our story" })).toHaveClass("hud");
  });
});
