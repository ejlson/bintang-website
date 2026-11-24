import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

/* lib/journal builds `front` and `posts` at import time from the snapshot, so
   these tests swap the snapshot for a fixture and re-import the module. The
   old-blog archive is emptied, so they see only the CMS posts (the archive has
   its own tests in JournalPage.test.tsx). */

type Fixture = {
  kind: "ours" | "press" | "link";
  slug: string;
  title: string;
  date: string;
  restaurants?: string[];
  category?: string | null;
  url?: string | null;
  outlet?: string | null;
};

const raw = (p: Fixture) => ({
  summary: `Summary of ${p.slug}`,
  restaurants: ["bintang"],
  category: null,
  url: null,
  outlet: null,
  image: { src: `/cms/${p.slug}.webp`, width: 800, height: 600, alt: p.title },
  ...p,
});

async function load(fixtures: Fixture[]) {
  vi.resetModules();
  vi.doMock("@/lib/journal.snapshot.json", () => ({ default: { posts: fixtures.map(raw) } }));
  vi.doMock("@/lib/journal.archive.json", () => ({ default: { posts: [] } }));
  return import("@/lib/journal");
}

const slugs = (ps: { slug: string }[]) => ps.map((p) => p.slug);
const ours = (slug: string, date: string, title = slug, extra: Partial<Fixture> = {}): Fixture => ({
  kind: "ours",
  slug,
  title,
  date,
  restaurants: ["bunso"],
  category: "Kitchen",
  ...extra,
});
const press = (slug: string, date: string): Fixture => ({
  kind: "press",
  slug,
  title: slug,
  date,
  url: `https://news.example/${slug}`,
  outlet: "The Paper",
});

afterEach(() => {
  cleanup();
  vi.doUnmock("@/lib/journal.snapshot.json");
  vi.doUnmock("@/lib/journal.archive.json");
  vi.resetModules();
});

describe("lib/journal front page selection (fixture snapshots)", () => {
  it("leads with the newest post with Bintang in the headline (case-insensitive), even if older posts are newer", async () => {
    const j = await load([
      ours("a", "2026-09-01"),
      ours("b", "2026-08-01", "Inside BINTANG"),
      ours("c", "2026-07-01", "Bintang again"),
    ]);
    expect(j.front.lead.slug).toBe("b");
  });

  it("leads with the newest post when no headline mentions Bintang", async () => {
    const j = await load([ours("old", "2026-01-01"), ours("new", "2026-05-01"), ours("mid", "2026-03-01")]);
    expect(j.front.lead.slug).toBe("new");
  });

  it("sorts an unsorted snapshot newest first, keeping CMS order for ties", async () => {
    const j = await load([
      ours("x", "2026-01-01"),
      ours("lead", "2026-02-01"),
      ours("t1", "2026-03-01"),
      ours("t2", "2026-03-01"),
      ours("y", "2026-04-01"),
    ]);
    expect(j.front.lead.slug).toBe("y");
    expect(slugs(j.front.older)).toEqual(["t1", "t2", "lead", "x"]);
  });

  it("sets press mentions and links as ordinary stories, newest first", async () => {
    const j = await load([
      ours("lead", "2026-09-01", "Bintang news"),
      press("p1", "2026-08-06"),
      { ...press("l2", "2026-08-04"), kind: "link" },
      ours("o1", "2026-08-01"),
      press("p3", "2026-07-01"),
    ]);
    expect(slugs(j.front.older)).toEqual(["p1", "l2", "o1", "p3"]);
  });

  it("can lead with a press mention, and then doesn't repeat it", async () => {
    const j = await load([{ ...press("bp", "2026-09-01"), title: "Bintang in the papers" }, press("p2", "2026-08-01")]);
    expect(j.front.lead.slug).toBe("bp");
    expect(slugs(j.front.older)).toEqual(["p2"]);
    expect(slugs(j.posts)).toEqual(["bp", "p2"]);
  });

  it("posts lists every post exactly once in front-page order", async () => {
    const j = await load([
      ours("o1", "2026-09-05"),
      press("p1", "2026-09-04"),
      ours("lead", "2026-09-03", "Bintang"),
      ours("o2", "2026-09-02"),
      ours("o3", "2026-09-01"),
      ours("o4", "2026-08-31"),
      ours("o5", "2026-08-30"),
    ]);
    const { lead, older } = j.front;
    expect(slugs(j.posts)).toEqual(slugs([lead, ...older]));
    expect(slugs(j.posts)).toEqual(["lead", "o1", "p1", "o2", "o3", "o4", "o5"]);
    expect(j.getPost("o5")?.slug).toBe("o5");
  });

  it("handles a single post: lead only, no older entries", async () => {
    const j = await load([ours("only", "2026-01-01")]);
    expect(j.front.lead.slug).toBe("only");
    expect(j.front.older).toEqual([]);
    expect(slugs(j.posts)).toEqual(["only"]);
  });

  it("handles an empty snapshot without throwing", async () => {
    const j = await load([]);
    expect(j.front.lead).toBeUndefined();
    expect(j.posts).toEqual([]);
  });
});

describe("lib/journal readMore and labels (fixture snapshots)", () => {
  it("press links to the article and is labelled with the outlet", async () => {
    const j = await load([press("p", "2026-01-01")]);
    expect(j.posts[0].label).toBe("The Paper");
    expect(j.posts[0].readMore).toEqual({ href: "https://news.example/p", text: "Read the article in The Paper" });
  });

  it("link posts go to their url and are labelled From the Bintang blog", async () => {
    const j = await load([{ kind: "link", slug: "l", title: "l", date: "2026-01-01", url: "https://blog.example/l" }]);
    expect(j.posts[0].label).toBe("From the Bintang blog");
    expect(j.posts[0].readMore).toEqual({ href: "https://blog.example/l", text: "Read the full story" });
  });

  it("ours tagged bunso links to bybunso.com/blog/<slug>", async () => {
    const j = await load([ours("hi-fi", "2026-01-01", "hi-fi", { restaurants: ["bintang", "bunso"] })]);
    expect(j.posts[0].readMore).toEqual({
      href: "https://www.bybunso.com/blog/hi-fi",
      text: "Read the full story on BUNSO’s journal",
    });
  });

  it("ours uses the first restaurant that has a home (cafemama)", async () => {
    const j = await load([ours("cm", "2026-01-01", "cm", { restaurants: ["bintang", "cafemama", "bunso"] })]);
    expect(j.posts[0].readMore?.href).toBe("https://cafemamasons.com/blog/cm");
  });

  it("ours with no home has no readMore; label falls back from category to home name to Journal", async () => {
    const j = await load([
      ours("cat", "2026-01-03", "cat", { restaurants: ["bintang"], category: "Room" }),
      ours("bare", "2026-01-02", "bare", { restaurants: ["bintang"], category: null }),
      ours("homed", "2026-01-01", "homed", { restaurants: ["bunso"], category: null }),
    ]);
    const by = (s: string) => j.getPost(s)!;
    expect(by("cat").readMore).toBeUndefined();
    expect("readMore" in by("cat")).toBe(false);
    expect(by("cat").label).toBe("Room");
    expect(by("bare").label).toBe("Journal");
    expect(by("homed").label).toBe("BUNSO");
  });
});

describe("JournalPage with fixture snapshots", () => {
  it("omits Older entries when there is only the lead", async () => {
    await load([ours("lead", "2026-02-01", "Bintang")]);
    const { JournalPage } = await import("@/components/JournalPage");
    render(<JournalPage />);
    expect(screen.getByRole("region", { name: "Top story" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Older entries" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Karaoke at Bintang" })).toBeInTheDocument();
  });

  it("renders with an empty snapshot: no stories, advert still present", async () => {
    await load([]);
    const { JournalPage } = await import("@/components/JournalPage");
    render(<JournalPage />);
    expect(screen.queryByRole("region", { name: "Top story" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("main"))
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href")?.startsWith("/journal/")),
    ).toHaveLength(0);
    expect(screen.getByRole("link", { name: /Karaoke enquiries/ })).toHaveAttribute("href", "/contact/karaoke");
  });
});
