/**
 * The Journal: posts from the Maginhawa Group's shared Sanity CMS that
 * mention Bintang. `npm run pull-cms` (scripts/pull-cms.mjs) refreshes
 * lib/journal.snapshot.json and the photos in public/cms/.
 *
 * Most of these stories live on another website (BUNSO's journal, a
 * newspaper), so each post page here shows the summary and links out to the
 * full story rather than copying it.
 */
import cms from "./cms.json";
import archiveData from "./journal.archive.json";
import snapshot from "./journal.snapshot.json";

type Kind = "ours" | "press" | "link" | "archive";

/** A run of text in an archive post, optionally a link. */
export type Run = { text: string; href?: string };
/** A block of an archive post's body: a subheading, a paragraph or a list item. */
export type Block = { t: "h" | "p" | "li"; runs: Run[] };

type SnapshotPost = {
  kind: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  restaurants: string[];
  category: string | null;
  url: string | null;
  outlet: string | null;
  image: { src: string; width: number; height: number; alt: string };
};

export type JournalPost = {
  slug: string;
  kind: Kind;
  title: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  excerpt: string;
  /** Small label over the headline: the publication, or the story's section. */
  label: string;
  image: { src: string; width: number; height: number; alt: string };
  /** Where the full story lives, if it lives somewhere else. */
  readMore?: { href: string; text: string };
  /** Who wrote it: the outlet for press, the sister restaurant for its stories, else Bintang. */
  author: string;
  /** The full text, for posts ported from the old blog (the only ones this site hosts in full). */
  body?: Block[];
};

const homes: Record<string, { name: string; url: string }> = cms.postHomes;

function shape(p: SnapshotPost): JournalPost {
  const kind = p.kind as Kind;
  const home = p.restaurants.map((r) => homes[r]).find(Boolean);
  const label =
    kind === "press" ? p.outlet! : kind === "link" ? "From the Bintang blog" : (p.category ?? home?.name ?? "Journal");
  const readMore =
    kind === "press"
      ? { href: p.url!, text: `Read the article in ${p.outlet}` }
      : kind === "link"
        ? // The old Squarespace blog on this domain is gone: its URLs redirect to the
          // Journal or (for this post) to the post itself (next.config.ts), so they
          // can't be the "full story".
          /^https?:\/\/(www\.)?bintangrestaurant\.co\.uk\/blog\//.test(p.url!)
          ? undefined
          : { href: p.url!, text: "Read the full story" }
        : home
          ? { href: `${home.url}/blog/${p.slug}`, text: `Read the full story on ${home.name}’s journal` }
          : undefined;
  return {
    slug: p.slug,
    kind,
    title: p.title,
    date: p.date,
    excerpt: p.summary,
    label,
    image: p.image,
    ...(readMore ? { readMore } : {}),
    author: kind === "press" ? p.outlet! : kind === "link" ? "Bintang" : (home?.name ?? "Bintang"),
  };
}

/** Newest first (the snapshot's order; ties keep the CMS order). */
const newest = (snapshot.posts as SnapshotPost[]).map(shape).sort((a, b) => b.date.localeCompare(a.date));

/**
 * How the front page sets the posts:
 * - lead: the newest story with Bintang in its headline, else the newest story
 * - older: everything else, newest first, four to a row
 */
function frontPage(all: JournalPost[]) {
  // Undefined only when the snapshot is empty.
  const lead: JournalPost | undefined = all.find((p) => /bintang/i.test(p.title)) ?? all[0];
  return { lead, older: all.filter((p) => p !== lead) };
}

export const front = frontPage(newest);

/**
 * The old Squarespace blog's evergreen posts (dishes, drinks, the garden, parties),
 * ported in full so their search rankings carry over: lib/journal.archive.json,
 * photos in public/media/journal/archive/. Each old URL 301s to its new page
 * (next.config.ts). Seasonal promotions were left out; their URLs go to /journal.
 */
type ArchivePost = {
  slug: string;
  oldPath: string;
  title: string;
  date: string;
  excerpt: string;
  image: JournalPost["image"];
  body: Block[];
};

export const archivePosts = archiveData.posts as ArchivePost[];

/** The archive, newest first, listed under the front page's stories. */
export const archive: JournalPost[] = archivePosts
  .map((p) => ({
    slug: p.slug,
    kind: "archive" as const,
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    label: "From the archive",
    image: p.image,
    author: "Bintang",
    body: p.body,
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

/** Every post, in the order the front page shows them: its stories, then the archive. */
export const posts: JournalPost[] = [...(front.lead ? [front.lead, ...front.older] : []), ...archive];

export function getPost(slug: string): JournalPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export { formatDate, formatLongDate, formatShortDate } from "./dates";
