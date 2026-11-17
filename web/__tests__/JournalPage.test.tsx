import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { JournalPage, JournalPostArticle, JournalPostShell } from "@/components/JournalPage";
import JournalNotFound from "@/app/journal/[slug]/not-found";
import JournalRoute, { metadata } from "@/app/journal/page";
import { generateMetadata, generateStaticParams } from "@/app/journal/[slug]/page";
import { formatDate, getPost, posts } from "@/lib/journal";

const cards = () => within(screen.getByRole("main")).getAllByRole("listitem");
const metaFor = (slug: string) =>
  generateMetadata({ params: Promise.resolve({ slug }) } as Parameters<typeof generateMetadata>[0]);

describe("JournalPage", () => {
  it("renders a single H1 and one card per post, in order", () => {
    render(<JournalPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Journal" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(cards()).toHaveLength(posts.length);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(posts.map((p) => p.title));
  });

  it("each card links its title to /journal/<slug>, with date, image and hidden Read more", () => {
    render(<JournalPage />);
    cards().forEach((card, i) => {
      const post = posts[i];
      const c = within(card);
      const h2 = c.getByRole("heading", { level: 2 });
      const link = within(h2).getByRole("link", { name: post.title });
      expect(link).toHaveAttribute("href", `/journal/${post.slug}`);
      // The title link is the card's only link (one tap target).
      expect(c.getAllByRole("link")).toHaveLength(1);

      const time = card.querySelector("time")!;
      expect(time).toHaveAttribute("dateTime", post.date);
      expect(time).toHaveTextContent(formatDate(post.date));

      expect(c.getByRole("img", { name: post.image.alt })).toBeInTheDocument();
      expect(c.getAllByRole("img")).toHaveLength(1);
      expect(card.querySelectorAll("img")).toHaveLength(1);

      expect(c.getByText(post.excerpt)).toBeInTheDocument();

      const more = c.getByText("Read more");
      expect(more).toHaveAttribute("aria-hidden", "true");
      expect(c.queryByRole("link", { name: /read more/i })).not.toBeInTheDocument();
    });
  });

  it("marks the Journal link in the SiteHeader as current and only that one", () => {
    render(<JournalPage />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.length).toBeGreaterThan(0);
    expect(new Set(current.map((a) => a.getAttribute("href")))).toEqual(new Set(["/journal"]));
  });

  it("has a Book a table link to /contact", () => {
    render(<JournalPage />);
    expect(screen.getByRole("link", { name: "Book a table" })).toHaveAttribute("href", "/contact");
  });

  it("app/journal/page renders JournalPage with title and description metadata", () => {
    render(<JournalRoute />);
    expect(screen.getByRole("heading", { level: 1, name: "Journal" })).toBeInTheDocument();
    expect(metadata.title).toBe("Journal");
    expect(metadata.description).toEqual(expect.any(String));
  });
});

describe("lib/journal", () => {
  it("formatDate renders day, short month and year", () => {
    expect(formatDate("2026-10-20")).toBe("20 Oct 2026");
    expect(formatDate("2026-01-31")).toBe("31 Jan 2026");
    expect(formatDate("2026-12-01")).toBe("1 Dec 2026");
  });

  it("formatDate uses Sept for September and drops leading zeros on the day", () => {
    expect(formatDate("2026-09-05")).toBe("5 Sept 2026");
    expect(formatDate("2026-09-26")).toBe("26 Sept 2026");
  });

  it("posts are newest first with unique slugs and ISO dates", () => {
    const dates = posts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    for (const p of posts) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.image.alt).not.toBe("");
    }
  });

  it("getPost finds a post by slug and returns undefined for unknown slugs", () => {
    expect(getPost("karaoke-nights")).toBe(posts[0]);
    expect(getPost(posts[posts.length - 1].slug)).toBe(posts[posts.length - 1]);
    expect(getPost("nope")).toBeUndefined();
    expect(getPost("")).toBeUndefined();
  });
});

describe("app/journal/[slug]", () => {
  it("generateStaticParams covers every post slug", () => {
    expect(generateStaticParams()).toEqual(posts.map((p) => ({ slug: p.slug })));
  });

  it("generateMetadata returns title, description and OG image for a known slug", async () => {
    const post = posts[1];
    const meta = await metaFor(post.slug);
    expect(meta.title).toBe(post.title);
    expect(meta.description).toBe(post.excerpt);
    expect(meta.openGraph?.images).toEqual([
      { url: post.image.src, width: 960, height: 1200, alt: post.image.alt },
    ]);
  });

  it("generateMetadata returns {} for an unknown slug", async () => {
    expect(await metaFor("does-not-exist")).toEqual({});
  });

  it("JournalPostArticle renders the cover, a single H1, excerpt and coming-soon note", () => {
    const post = posts[3];
    render(<JournalPostArticle post={post} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeInTheDocument();
    expect(screen.getByText(post.excerpt)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: post.image.alt })).toBeInTheDocument();
    const time = document.querySelector("time")!;
    expect(time).toHaveAttribute("dateTime", post.date);
    expect(time).toHaveTextContent(formatDate(post.date));
    expect(screen.getByText(/Full story coming soon/)).toBeInTheDocument();
    expect(screen.getByText("Malapit na")).toHaveAttribute("lang", "tl");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("JournalPostShell renders header (Journal current), back link, children and Book a table", () => {
    render(
      <JournalPostShell>
        <p>child content</p>
      </JournalPostShell>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Journal" })).toHaveAttribute("href", "/journal");
    expect(screen.getByRole("link", { name: "Book a table" })).toHaveAttribute("href", "/contact");
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(new Set(current.map((a) => a.getAttribute("href")))).toEqual(new Set(["/journal"]));
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("not-found renders a branded page: one H1, header with Journal current, links back to the Journal", () => {
    render(<JournalNotFound />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "We couldn’t find that story" })).toBeInTheDocument();
    expect(screen.getByText("Wala rito ang hinahanap mo")).toHaveAttribute("lang", "tl");
    expect(screen.getByRole("link", { name: "See all stories" })).toHaveAttribute("href", "/journal");
    expect(screen.getByRole("link", { name: "Journal" })).toHaveAttribute("href", "/journal");
    expect(screen.getByRole("link", { name: "Book a table" })).toHaveAttribute("href", "/contact");
  });
});
