import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BOOKING_URL } from "@/lib/nav";
import { BookButton } from "@/components/BookButton";

describe("BookButton", () => {
  it("is a plain OpenTable link that opens in a new tab", () => {
    render(<BookButton />);
    const link = screen.getByRole("link", { name: "Book a table on OpenTable (opens in a new tab)" });
    expect(link).toHaveAttribute("href", BOOKING_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("has no click effect: no Sakuga button, no script hand-off", () => {
    const { container } = render(<BookButton />);
    expect(container.querySelector("sakuga-button")).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });
});
