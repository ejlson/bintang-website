import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { JournalPage, JournalPostArticle, JournalPostShell } from "@/components/JournalPage";
import JournalNotFound from "@/app/journal/[slug]/not-found";
import JournalRoute, { metadata } from "@/app/journal/page";
import { generateMetadata, generateStaticParams } from "@/app/journal/[slug]/page";
import {
  formatDate,
  formatLongDate,
  formatShortDate,
  front,
  getPost,
  posts,
  type JournalPost,
} from "@/lib/journal";
import snapshot from "@/lib/journal.snapshot.json";

const metaFor = (slug: string) =>
  generateMetadata({ params: Promise.resolve({ slug }) } as Parameters<typeof generateMetadata>[0]);
const postLinks = () =>
  within(screen.getByRole("main"))
    .getAllByRole("link")
    .filter((a) => a.getAttribute("href")?.startsWith("/journal/"));

describe("JournalPage", () => {
  it("renders a single H1 named Journal", () => {
    render(<JournalPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Journal" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("sizes the JOURNAL title like GALLERY: full width, outside the content column, squished 0.95", () => {
    render(<JournalPage />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Journal" });
    expect(h1.querySelector("svg text")).toHaveAttribute("transform", "scale(1 0.95)");
    // Not inside the content column, so it spans the screen like the Gallery title.
    expect(h1.closest(".wrap")).toBeNull();
  });

  it("links every post exactly once, by its headline, in front-page order", () => {
    render(<JournalPage />);
    const links = postLinks();
    expect(links.map((a) => a.getAttribute("href"))).toEqual(posts.map((p) => `/journal/${p.slug}`));
    expect(links.map((a) => a.textContent)).toEqual(posts.map((p) => p.title));
    for (const a of links) expect(a.closest("h2, h3")).not.toBeNull();
  });

  it("sets the lead as an H2 with its standfirst and photo", () => {
    render(<JournalPage />);
    const top = screen.getByRole("region", { name: "Top story" });
    const t = within(top);
    expect(t.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(front.lead.title);
    expect(t.getByText(front.lead.excerpt)).toBeInTheDocument();
    expect(top.querySelectorAll("img")).toHaveLength(1);
    // The Read the story bar is decoration: the headline is the link.
    expect(t.getByText("Read the story")).toHaveAttribute("aria-hidden", "true");
  });

  it("puts the kicker, headline and summary on the left, and the photo and Read the story on the right", () => {
    render(<JournalPage />);
    const top = screen.getByRole("region", { name: "Top story" });
    const [text, media] = Array.from(top.children) as HTMLElement[];
    expect(text).toHaveTextContent(`Latest · ${front.lead.label}`);
    expect(text.querySelector("time")).toHaveAttribute("datetime", front.lead.date);
    expect(text.querySelector("time")).toHaveTextContent(formatLongDate(front.lead.date));
    expect(within(text).getByRole("heading", { level: 2, name: front.lead.title })).toBeInTheDocument();
    expect(text).toHaveTextContent(front.lead.excerpt);
    expect(text.querySelector("img")).toBeNull();
    expect(media.querySelector("img")).not.toBeNull();
    expect(media.lastElementChild).toHaveTextContent("Read the story");
    expect(media.lastElementChild).toHaveAttribute("aria-hidden", "true");
    expect(media.lastElementChild?.querySelector("svg")).not.toBeNull();
    expect(within(top).getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByRole("complementary", { name: "In brief" })).not.toBeInTheDocument();
  });

  it("sets the lead and every older entry as cells of one stories grid, the lead first", () => {
    render(<JournalPage />);
    const top = screen.getByRole("region", { name: "Top story" });
    const older = screen.getByRole("region", { name: "Older entries" });
    // Same parent, lead first: the next older entry takes the cell beside it.
    expect(older.parentElement).toBe(top.parentElement);
    expect(top.nextElementSibling).toBe(older);
    expect(top.parentElement).toHaveClass("stories");
    expect(top).toHaveClass("front");
    // The section and list are display: contents; role="list" keeps them a list.
    expect(older).toHaveClass("olderSection");
    expect(within(older).getByRole("list")).toHaveClass("older");
  });

  it("lists every other post under Older entries: title, label and date, photo, description", () => {
    render(<JournalPage />);
    const section = screen.getByRole("region", { name: "Older entries" });
    expect(section.compareDocumentPosition(screen.getByRole("region", { name: "Top story" }))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
    // Its heading is for screen readers only: there is no visible Older entries bar.
    expect(within(section).getByRole("heading", { level: 2, name: "Older entries" })).toHaveClass("sr-only");
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(front.older.length);
    items.forEach((li, i) => {
      const p = front.older[i];
      // Same five parts in the same order in every entry (photo first), so the subgrid lines them up.
      expect(Array.from(li.children).map((c) => c.tagName)).toEqual(["DIV", "H3", "P", "P", "SPAN"]);
      expect(within(li).getByRole("heading", { level: 3, name: p.title })).toBeInTheDocument();
      expect(li.querySelector("time")).toHaveTextContent(formatDate(p.date));
      expect(li.querySelectorAll("img")).toHaveLength(1);
      expect(li.children[3]).toHaveTextContent(p.excerpt);
      // Read more is a visual cue; the headline is the card's only link.
      expect(li.lastElementChild).toHaveTextContent("Read more");
      expect(li.lastElementChild).toHaveAttribute("aria-hidden", "true");
      // The same thin arrow as Read the story, right after the words.
      expect(li.lastElementChild?.querySelector("svg")).not.toBeNull();
      expect(within(li).getAllByRole("link")).toHaveLength(1);
    });
  });

  it("has no search box, Show or Sort controls", () => {
    render(<JournalPage />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(document.querySelector("search")).toBeNull();
  });

  it("draws Book a table without side rules, filling with ink on hover like the header's Book", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const css = readFileSync(join(process.cwd(), "components", "JournalPage.module.css"), "utf8");
    expect(css).toMatch(/\.advert :global\(\.cine-book\)::before,\s*\.advert :global\(\.cine-book\)::after,\s*\.cta :global\(\.cine-book\)::before,\s*\.cta :global\(\.cine-book\)::after \{\s*display: none;/);
    // Not page-wide: the footer's small Book keeps its rules.
    expect(css).not.toMatch(/\.page :global\(\.cine/);
    expect(css).toMatch(/\.cta :global\(\.cine-frame\) \{\s*background: linear-gradient\(var\(--ink\), var\(--ink\)\) left \/ 0 100% no-repeat;/);
    expect(css).toMatch(/:global\(\.cine-book:hover \.cine-frame\)[^{]*\{[^}]*background-size: 100% 100%;[^}]*-webkit-text-fill-color: var\(--newsprint\);/);
    // color stays ink, so the global focus ring (currentColor) stays visible.
    expect(css).not.toMatch(/:global\(\.cine-book:(hover|focus-visible) \.cine-frame\)[^{]*\{[^}]*(?<![-\w])color: var\(--newsprint\)/);
  });

  it("has no colophon line under the advert", () => {
    render(<JournalPage />);
    expect(screen.queryByText(/open since 1987/)).not.toBeInTheDocument();
  });

  it("marks the Journal link in the SiteHeader as current and only that one", () => {
    render(<JournalPage />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.length).toBeGreaterThan(0);
    expect(new Set(current.map((a) => a.getAttribute("href")))).toEqual(new Set(["/journal"]));
  });

  it("ends with the karaoke advert: Book a table and Karaoke enquiries", () => {
    render(<JournalPage />);
    expect(screen.getByRole("heading", { level: 2, name: "Karaoke at Bintang" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book a table" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: /Karaoke enquiries/ })).toHaveAttribute("href", "/contact/karaoke");
  });

  it("sets both Book a table links (advert and post foot) as the cinematic button", () => {
    for (const ui of [<JournalPage key="page" />, <JournalPostShell key="post"><p>x</p></JournalPostShell>]) {
      const { unmount } = render(ui);
      const book = screen.getByRole("link", { name: "Book a table" });
      expect(book).toHaveClass("cine-book");
      expect(book.querySelector(".cine-frame")).toHaveTextContent(/^Book a table$/);
      expect(book).not.toHaveAttribute("target");
      unmount();
    }
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
    expect(formatShortDate("2026-09-05")).toBe("5 Sept");
    expect(formatLongDate("2026-09-05")).toBe("5 September 2026");
  });

  it("carries every snapshot post once, with unique slugs, ISO dates and local photos", () => {
    expect(posts).toHaveLength(snapshot.posts.length);
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    for (const p of posts) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.image.src).toMatch(/^\/cms\/[a-f0-9]+\.(webp|jpg)$/);
      expect(p.image.width).toBeGreaterThan(0);
      expect(p.image.height).toBeGreaterThan(0);
    }
  });

  it("leads with the newest post with Bintang in its title", () => {
    const newest = [...posts].sort((a, b) => b.date.localeCompare(a.date));
    expect(front.lead).toBe(newest.find((p) => /bintang/i.test(p.title)));
  });

  it("links each post to where its full story lives", () => {
    for (const p of posts) {
      const raw = snapshot.posts.find((s) => s.slug === p.slug)!;
      if (p.kind === "press") expect(p.readMore).toEqual({ href: raw.url, text: `Read the article in ${raw.outlet}` });
      if (p.kind === "link") expect(p.readMore?.href).toBe(raw.url);
      if (p.kind === "ours" && raw.restaurants.includes("bunso"))
        expect(p.readMore?.href).toBe(`https://www.bybunso.com/blog/${p.slug}`);
      if (p.readMore) expect(p.readMore.href).toMatch(/^https:\/\//);
    }
  });

  it("getPost finds a post by slug and returns undefined for unknown slugs", () => {
    expect(getPost(posts[0].slug)).toBe(posts[0]);
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
      { url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt },
    ]);
  });

  it("generateMetadata returns {} for an unknown slug", async () => {
    expect(await metaFor("does-not-exist")).toEqual({});
  });

  it("JournalPostArticle renders a single H1, the photo, summary and a link out to the full story", () => {
    const post = posts.find((p) => p.readMore)!;
    render(<JournalPostArticle post={post} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeInTheDocument();
    expect(screen.getByText(post.excerpt)).toBeInTheDocument();
    expect(document.querySelectorAll("img")).toHaveLength(1);
    expect(document.querySelector("time")).toHaveAttribute("dateTime", post.date);
    const out = screen.getByRole("link", { name: new RegExp(post.readMore!.text) });
    expect(out).toHaveAttribute("href", post.readMore!.href);
    expect(out).toHaveAttribute("target", "_blank");
    expect(out.getAttribute("rel")).toMatch(/\bnoopener\b/);
    expect(out).toHaveTextContent("(opens in a new tab)");
  });

  it("JournalPostArticle says the story is coming soon when it has nowhere to link", () => {
    const post: JournalPost = { ...posts[0], readMore: undefined };
    render(<JournalPostArticle post={post} />);
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
