"use client";

import { useId, useState } from "react";
import { formatDate } from "@/lib/dates";
import type { JournalPost } from "@/lib/journal";
import { Arrow, Headline, Photo } from "./JournalParts";
import styles from "./JournalPage.module.css";

/** Lower case, accents dropped, so "cafe" finds "Café". */
const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Every word typed must appear somewhere in the title, label or summary. */
export function matches(post: JournalPost, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fold(`${post.title} ${post.label} ${post.excerpt}`);
  return words.every((w) => text.includes(w));
}

export const SORTS = {
  newest: "Newest first",
  oldest: "Oldest first",
  az: "Title A–Z",
} as const;
export type Sort = keyof typeof SORTS;

export const KINDS = {
  all: "All entries",
  stories: "Stories",
  press: "In the press",
} as const;
export type KindFilter = keyof typeof KINDS;

/** Search, then the type filter, then the order. `posts` arrives newest first. */
export function arrange(
  posts: JournalPost[],
  query: string,
  kind: KindFilter,
  sort: Sort,
): JournalPost[] {
  const kept = posts.filter(
    (p) =>
      matches(p, query) &&
      (kind === "all" ||
        (kind === "press" ? p.kind === "press" : p.kind !== "press")),
  );
  if (sort === "oldest") return kept.reverse();
  if (sort === "az")
    return kept.sort((a, b) =>
      a.title.localeCompare(b.title, "en", { sensitivity: "base" }),
    );
  return kept;
}

/** An older entry. Its five parts sit on a shared grid, so titles, photos and text line up across the row. */
function Story({ post }: { post: JournalPost }) {
  return (
    <li className={styles.story}>
      <h3 className={styles.storyTitle}>
        <Headline post={post} />
      </h3>
      <p className={styles.label}>
        {post.label} · <time dateTime={post.date}>{formatDate(post.date)}</time>
      </p>
      <Photo
        post={post}
        sizes="(min-width: 1600px) 370px, (min-width: 1100px) 24vw, (min-width: 600px) 48vw, 100vw"
      />
      <p className={styles.excerpt}>{post.excerpt}</p>
      {/* A cue, not a second link: the headline's link already covers the card. */}
      <span className={styles.readMore} aria-hidden="true">
        Read more
        <Arrow />
      </span>
    </li>
  );
}

/** "Older entries" with a search box, a type filter and a sort order. */
export function OlderEntries({ posts }: { posts: JournalPost[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const id = useId();
  const shown = arrange(posts, query, kind, sort);
  const filtering = query.trim() !== "" || kind !== "all";
  const reset = () => {
    setQuery("");
    setKind("all");
  };

  return (
    <section aria-labelledby="older-entries">
      <div className={styles.dividerBar}>
        <h2 id="older-entries" className={styles.divider}>
          Older entries
        </h2>
        <search className={styles.tools}>
          <div className={styles.selectWrap}>
            <label htmlFor={`${id}-kind`} className="sr-only">
              Show
            </label>
            <select
              id={`${id}-kind`}
              className={styles.select}
              value={kind}
              onChange={(e) => setKind(e.target.value as KindFilter)}
            >
              {Object.entries(KINDS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectWrap}>
            <label htmlFor={`${id}-sort`} className="sr-only">
              Sort
            </label>
            <select
              id={`${id}-sort`}
              className={styles.select}
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              {Object.entries(SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.search}>
            <label htmlFor={`${id}-q`} className="sr-only">
              Search older entries
            </label>
            <input
              id={`${id}-q`}
              type="search"
              className={styles.searchInput}
              placeholder="Search entries"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <svg
              className={styles.searchIcon}
              viewBox="0 0 20 20"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="8.5"
                cy="8.5"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path d="M13 13l5 5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
        </search>
      </div>

      <p className="sr-only" aria-live="polite">
        {filtering
          ? `${shown.length} ${shown.length === 1 ? "entry" : "entries"} found`
          : ""}
      </p>

      {shown.length > 0 ? (
        <ul className={styles.older}>
          {shown.map((p) => (
            <Story key={p.slug} post={p} />
          ))}
        </ul>
      ) : (
        <p className={styles.noResults}>
          {query.trim() ? (
            <>No entries match “{query.trim()}”.</>
          ) : (
            <>No entries here yet.</>
          )}{" "}
          <button type="button" className={styles.clear} onClick={reset}>
            Show all entries
          </button>
        </p>
      )}
    </section>
  );
}
