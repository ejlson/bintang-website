import type { ReactNode } from "react";
import Link from "next/link";
import { formatLongDate, front, type JournalPost } from "@/lib/journal";
import { FitTitle } from "./FitTitle";
import { Arrow, Headline, Photo } from "./JournalParts";
import { OlderEntries } from "./OlderEntries";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./JournalPage.module.css";

/* The Journal is set like an old newspaper, after the printed brunch card:
   maroon ink on cream, ruled columns, photos. Every story has exactly
   one link (its headline), stretched over its block so the block is one tap
   target. Headline links carry OPEN_POST for the iris transition.
   Older entries (with its search box) is a client component. */

/** The latest story: headline and summary on the left, photo and Read the story on the right. */
function Lead({ post }: { post: JournalPost }) {
  return (
    <section className={styles.front} aria-label="Top story">
      <div className={styles.leadText}>
        <h2 className={styles.leadTitle}>
          <Headline post={post} />
        </h2>
        <p className={styles.standfirst}>{post.excerpt}</p>
      </div>
      <div className={styles.leadMedia}>
        <Photo post={post} framed eager sizes="(min-width: 1200px) 560px, (min-width: 900px) 48vw, 100vw" />
        {/* A cue, not a second link: the headline's link already covers the story. */}
        <span className={styles.readMore} aria-hidden="true">
          Read the story
          <Arrow />
        </span>
      </div>
    </section>
  );
}

/** The Journal index, set as a newspaper front page. */
export function JournalPage() {
  const { lead, older } = front;
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="ink" mark="ink" currentHref="/journal" />

      <div className={styles.wrap}>
        <h1 className={styles.title}>
          <FitTitle text="Journal" />
        </h1>

        {lead && <Lead post={lead} />}

        {older.length > 0 && <OlderEntries posts={older} />}

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

        <p className={styles.colophon}>Bintang · Kentish Town, London · London’s oldest Filipino restaurant, open since 1987</p>
      </div>

      <SiteFooter />
    </main>
  );
}

/** A single post: its photo, headline and summary, and a link to the full story where it lives. */
export function JournalPostArticle({ post }: { post: JournalPost }) {
  return (
    <article className={styles.postBody}>
      <p className={styles.kicker}>
        <span>{post.label}</span>
        <time dateTime={post.date}>{formatLongDate(post.date)}</time>
      </p>
      <h1 className={styles.postTitle}>{post.title}</h1>
      <Photo post={post} framed eager sizes="(min-width: 860px) 760px, 100vw" className={styles.postPhoto} />
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
