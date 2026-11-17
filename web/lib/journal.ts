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
import snapshot from "./journal.snapshot.json";

type Kind = "ours" | "press" | "link";

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
        ? { href: p.url!, text: "Read the full story" }
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

/** Every post, in the order the front page shows them. */
export const posts: JournalPost[] = front.lead ? [front.lead, ...front.older] : [];

export function getPost(slug: string): JournalPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export { formatDate, formatLongDate, formatShortDate } from "./dates";
