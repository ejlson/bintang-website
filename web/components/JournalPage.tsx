import type { ReactNode } from "react";
import Link from "next/link";
import { archive, formatDate, formatLongDate, front, type Block, type JournalPost } from "@/lib/journal";
import { FitTitle } from "./FitTitle";
import { Arrow, Headline, Photo } from "./JournalParts";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./JournalPage.module.css";

/* The Journal is set like an old newspaper, after the printed brunch card:
   maroon ink on cream, ruled columns, photos. Every story has exactly
   one link (its headline), stretched over its block so the block is one tap
   target. Headline links carry OPEN_POST for the iris transition.
   Stories sit on one four-column grid: the latest takes three columns on an
   ink panel, the next sits beside it, and the rest run four to a row under them. */

/** The latest story, on an ink panel: kicker, headline and summary on the left, photo and Read the story on the right. */
function Lead({ post }: { post: JournalPost }) {
  return (
    <section className={styles.front} aria-label="Top story">
      <div className={styles.leadText}>
        <div className={styles.leadHead}>
          <p className={styles.leadKicker}>
            <span>Latest · {post.label}</span>
            <time dateTime={post.date}>{formatLongDate(post.date)}</time>
          </p>
          <h2 className={styles.leadTitle}>
            <Headline post={post} />
          </h2>
        </div>
        <p className={styles.standfirst}>{post.excerpt}</p>
      </div>
      <div className={styles.leadMedia}>
        <Photo post={post} eager sizes="(min-width: 1600px) 560px, (min-width: 1100px) 36vw, (min-width: 900px) 46vw, 100vw" />
        {/* A cue, not a second link: the headline's link already covers the story. */}
        <span className={styles.readMore} aria-hidden="true">
          Read the story
          <Arrow />
        </span>
      </div>
    </section>
  );
}

/**
 * An older entry, set like a magazine index card: photo, headline, label,
 * a short excerpt, then a quiet Read more under a hairline. Its five parts
 * sit on a shared grid, so photos, titles and text line up across the row.
 */
function Story({ post }: { post: JournalPost }) {
  return (
    <li className={styles.story}>
      <Photo
        post={post}
        // Two to a row below 1100px, phones included (JournalPage.module.css).
        sizes="(min-width: 1600px) 370px, (min-width: 1100px) 24vw, 48vw"
      />
      <h3 className={styles.storyTitle}>
        <Headline post={post} />
      </h3>
      <p className={styles.storyLabel}>
        {post.label} · <time dateTime={post.date}>{formatDate(post.date)}</time>
      </p>
      <p className={styles.storyExcerpt}>{post.excerpt}</p>
      {/* A cue, not a second link: the headline's link already covers the card. */}
      <span className={styles.storyMore} aria-hidden="true">
        Read more
        <Arrow />
      </span>
    </li>
  );
}

/**
 * The old blog's posts, set as a ruled index under the stories: date, headline,
 * a line of summary. No photos, so twenty entries stay one quiet column.
 */
function Archive({ posts }: { posts: JournalPost[] }) {
  return (
    <section className={styles.archive} aria-labelledby="from-the-archive">
      <h2 id="from-the-archive" className={styles.archiveTitle}>
        From the archive
      </h2>
      <ul className={styles.archiveList} role="list">
        {posts.map((p) => (
          <li key={p.slug} className={styles.archiveItem}>
            <time dateTime={p.date} className={styles.archiveDate}>
              {formatDate(p.date)}
            </time>
            <h3 className={styles.archiveHeadline}>
              <Headline post={p} />
            </h3>
            <p className={styles.archiveExcerpt}>{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The Journal index, set as a newspaper front page. */
export function JournalPage() {
  const { lead, older } = front;
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="ink" mark="ink" currentHref="/journal" />

      <h1 className={styles.title}>
        {/* Sized to match GALLERY: as wide as its ink and as tall as its capitals
            (JOURNAL is wider, so its letters are squished a little less). */}
        <FitTitle text="Journal" squish={0.95} />
        <span className="sr-only"> — news and stories from Bintang</span>
      </h1>

      <div className={styles.wrap}>

        {(lead || older.length > 0) && (
          <div className={styles.stories}>
            {lead && <Lead post={lead} />}
            {older.length > 0 && (
              /* The section and list are display: contents, so each card is a cell of the
                 stories grid; role="list" keeps the list semantics Safari would drop. */
              <section className={styles.olderSection} aria-labelledby="older-entries">
                <h2 id="older-entries" className="sr-only">
                  Older entries
                </h2>
                <ul className={styles.older} role="list">
                  {older.map((p) => (
                    <Story key={p.slug} post={p} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {archive.length > 0 && <Archive posts={archive} />}
      </div>

      {/* Outside the content column, so its rules run as wide as the title's. */}
      <section className={styles.advert} aria-labelledby="karaoke-ad">
        <h2 id="karaoke-ad" className={styles.advertTitle}>
          Karaoke at Bintang
        </h2>
        <p className={styles.advertLine}>Open-mic: Saturday 5pm – 11pm</p>
        <div className={styles.advertLinks}>
          <Link href="/contact" className="cine-book">
            <span className="cine-frame">Book a table</span>
          </Link>
          <Link href="/contact/karaoke" className={styles.line}>
            Karaoke enquiries
            <Arrow />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/** An archive post's text. Headings are H2 under the post's H1; external links open in a new tab. */
function Body({ blocks }: { blocks: Block[] }) {
  const out: ReactNode[] = [];
  let items: Block[] = [];
  const flushList = () => {
    if (items.length) {
      out.push(
        <ul key={`ul${out.length}`}>
          {items.map((b, i) => (
            <li key={i}>
              <Runs block={b} />
            </li>
          ))}
        </ul>,
      );
      items = [];
    }
  };
  blocks.forEach((b, i) => {
    if (b.t === "li") return void items.push(b);
    flushList();
    out.push(
      b.t === "h" ? (
        <h2 key={i}>
          <Runs block={b} />
        </h2>
      ) : (
        <p key={i}>
          <Runs block={b} />
        </p>
      ),
    );
  });
  flushList();
  return <div className={styles.prose}>{out}</div>;
}

function Runs({ block }: { block: Block }) {
  return block.runs.map((r, i) =>
    !r.href ? (
      r.text
    ) : r.href.startsWith("/") ? (
      <Link key={i} href={r.href}>
        {r.text}
      </Link>
    ) : (
      <a key={i} href={r.href} target="_blank" rel="noopener">
        {r.text}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ),
  );
}

/** A single post: its photo, headline and summary, then its full text (archive) or a link to the full story where it lives. */
export function JournalPostArticle({ post }: { post: JournalPost }) {
  return (
    <article className={styles.postBody}>
      <p className={styles.kicker}>
        <span>{post.label}</span>
        <time dateTime={post.date}>{formatLongDate(post.date)}</time>
      </p>
      <h1 className={styles.postTitle}>{post.title}</h1>
      <Photo post={post} framed eager sizes="(min-width: 860px) 760px, 100vw" className={styles.postPhoto} />
      {post.body ? (
        <>
          <p className={styles.archiveNote}>
            From the Bintang blog archive, first published {formatLongDate(post.date)}. Dishes, prices and opening
            times may have changed since: see <Link href="/menu">today’s menu</Link>.
          </p>
          <Body blocks={post.body} />
        </>
      ) : (
        <>
          <p className={styles.postLede}>{post.excerpt}</p>
          {post.readMore ? (
            <a href={post.readMore.href} className={styles.line} target="_blank" rel="noopener">
              {post.readMore.text}
              <span className="sr-only"> (opens in a new tab)</span>
              <Arrow />
            </a>
          ) : (
            <p className={styles.postNote}>
              Full story coming soon · <span lang="tl">Malapit na</span>
            </p>
          )}
        </>
      )}
    </article>
  );
}

/** Post page chrome that doesn't depend on which post: header, back link, Book CTA. */
export function JournalPostShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="ink" mark="ink" currentHref="/journal" />

      <div className={styles.post}>
        <Link href="/journal" className={styles.back}>
          <span aria-hidden="true">←</span> Journal
        </Link>
        {children}
      </div>

      <div className={styles.cta}>
        <Link href="/contact" className="cine-book">
          <span className="cine-frame">Book a table</span>
        </Link>
      </div>

      <SiteFooter />
    </main>
  );
}

/** Branded 404 for a journal link that doesn't match a post. */
export function JournalNotFound() {
  return (
    <JournalPostShell>
      <section className={styles.missing}>
        <h1 className={styles.postTitle}>We couldn’t find that story</h1>
        <p className={styles.postLede}>
          The link may be mistyped, or the post may have moved. Everything we’ve written is on the Journal page.
        </p>
        <p className={styles.postNote} lang="tl">
          Wala rito ang hinahanap mo
        </p>
        <Link href="/journal" className={styles.line}>
          See all stories
          <Arrow />
        </Link>
      </section>
    </JournalPostShell>
  );
}
