import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FitTitle } from "@/components/FitTitle";

describe("FitTitle", () => {
  it("exposes the title as written to assistive tech and renders it uppercase", () => {
    render(<FitTitle text="Private hire" />);
    const svg = screen.getByRole("img", { name: "Private hire" });
    const text = svg.querySelector("text")!;
    expect(text.textContent).toBe("Private hire");
    expect(text).toHaveAttribute("aria-hidden", "true");
    expect(text.style.textTransform).toBe("uppercase");
  });

  it("fills its container's width and keeps a usable viewBox when the font can't be measured", () => {
    render(<FitTitle text="About" />);
    const svg = screen.getByRole("img", { name: "About" });
    expect(svg.style.width).toBe("100%");
    const [, , w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });
});
