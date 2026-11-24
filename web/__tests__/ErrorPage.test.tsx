import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ErrorPage from "@/app/error";
import { ErrorScreen } from "@/components/ErrorScreen";

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), "utf8");

describe("Error page (app/error.tsx)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("says sorry in one h1, with the shared header and footer", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={new Error("boom")} retry={() => {}} />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveAccessibleName("Sorry");
    expect(screen.getByRole("link", { name: "Bintang home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("logs the error so it reaches the console and server logs", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    render(<ErrorPage error={err} retry={() => {}} />);
    expect(log).toHaveBeenCalledWith(err);
  });

  it("tries again with Next's retry, and links home", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(<ErrorPage error={new Error("boom")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /Back to home/ })).toHaveAttribute("href", "/");
  });

  it("keeps the Tagalog line marked as Tagalog", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={new Error("boom")} retry={() => {}} />);
    expect(screen.getByText("Pasensya na po, may nagkaproblema")).toHaveAttribute("lang", "tl");
  });
});

describe("ErrorScreen", () => {
  it("draws Try again like the header's Book: 1px frame at 60%, paper wiping in from the left", () => {
    const css = read("components", "ErrorScreen.module.css");
    expect(css).toMatch(/\.retry \{[^}]*border: 1px solid color-mix\(in srgb, var\(--paper\) 60%, transparent\);/);
    expect(css).toMatch(/\.retry \{[^}]*background: linear-gradient\(var\(--paper\), var\(--paper\)\) left \/ 0 100% no-repeat;/);
    expect(css).toMatch(/\.retry:hover,\s*\.retry:focus-visible \{[^}]*background-size: 100% 100%;[^}]*color: var\(--red-deep\);/);
    // About's red, with the footer's Book a table ground set to match.
    expect(css).toMatch(/\.page \{[^}]*background: var\(--red-deep\);[^}]*--ground: var\(--red-deep\);/);
  });

  it("stands alone without the shared header and footer (as global-error uses it)", () => {
    render(<ErrorScreen onRetry={() => {}} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Sorry");
    expect(screen.queryByRole("contentinfo")).toBeNull();
  });
});

describe("Global error (app/global-error.tsx)", () => {
  it("renders its own document with the site's styles and the Aquavit kit", () => {
    const src = read("app", "global-error.tsx");
    expect(src).toMatch(/^"use client";/);
    expect(src).toMatch(/<html lang="en-GB">/);
    expect(src).toMatch(/<body>/);
    expect(src).toContain('import "./globals.css";');
    expect(src).toContain("https://use.typekit.net/pev2vne.css");
    expect(src).toMatch(/onRetry=\{retry\}/);
  });
});
