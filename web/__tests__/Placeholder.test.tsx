import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Placeholder } from "@/components/Placeholder";
import Gallery from "@/app/gallery/page";
import Contact from "@/app/contact/page";
import Groups from "@/app/contact/groups/page";
import Karaoke from "@/app/contact/karaoke/page";
import PrivateHire from "@/app/contact/private-hire/page";
import { allLinks } from "@/lib/nav";

describe("Placeholder", () => {
  it("renders title, Tagalog line, coming-soon note and a back link", () => {
    render(<Placeholder title="About" tl="Tungkol" href="/about" background="red" tone="paper" />);
    expect(screen.getByRole("heading", { level: 1, name: "About" })).toBeInTheDocument();
    expect(screen.getByText("Tungkol", { selector: "p" })).toHaveAttribute("lang", "tl");
    expect(screen.getByText(/Coming soon/)).toBeInTheDocument();
    expect(screen.getByText("Malapit na")).toHaveAttribute("lang", "tl");
    expect(screen.getByRole("link", { name: "← Back home" })).toHaveAttribute("href", "/");
  });

  it("renders the header with the page marked current", () => {
    render(<Placeholder title="About" tl="Tungkol" href="/about" background="red" tone="paper" />);
    expect(screen.getByRole("link", { name: "Bintang home" })).toHaveAttribute("href", "/");
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/about"]);
  });

  it.each([
    ["paper", "/brand/lion-head-paper.svg"],
    ["ink", "/brand/lion-head-ink.svg"],
  ] as const)("uses the %s mark for tone %s", (tone, src) => {
    render(<Placeholder title="X" tl="x" href="/x" background="red" tone={tone} />);
    expect(screen.getByRole("link", { name: "Bintang home" }).querySelector("img")).toHaveAttribute("src", src);
  });

  it.each([
    [Gallery, "/gallery"],
    [Karaoke, "/contact/karaoke"],
    [Contact, "/contact"],
  ])("placeholder route %# (%s) renders its own nav label as title and marks itself current", (Page, href) => {
    const link = allLinks.find((l) => l.href === href)!;
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveProperty("textContent", link.en);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(link.tl, { selector: "p" })).toBeInTheDocument();
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual([href]);
  });

  it.each([
    [Groups, "Groups"],
    [PrivateHire, "Private hire"],
  ])("keeps the %# %s placeholder (no longer in the nav, so nothing is current)", (Page, title) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveProperty("textContent", title);
    expect(screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"))).toHaveLength(0);
  });
});
