import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// next/font only works inside the Next compiler (lib/sakuga uses Yuji_Boku); effects are optional.
vi.mock("next/font/google", () => ({ Yuji_Boku: () => ({ style: { fontFamily: "x" } }) }));
vi.mock("@/lib/sakuga", () => ({ loadSakuga: () => Promise.resolve(null) }));

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
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/London’s oldest Filipino restaurant/);
    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
    expect(screen.getByTestId("subtitles")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause background video" })).toBeInTheDocument();
    expect(screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"))).toHaveLength(0);
  });
});
