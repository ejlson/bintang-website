import Image from "next/image";
import type { ReactNode } from "react";
import Link from "next/link";
import { formatDate, posts, type JournalPost } from "@/lib/journal";
import { OPEN_POST } from "./PageTransition";
import { SiteHeader } from "./SiteHeader";
import styles from "./JournalPage.module.css";

/** Long thin arrow for the Read more bar. */
export function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 36 12" width="36" height="12" aria-hidden="true" focusable="false">
      <path d="M0 6h34M29 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/** Cover photo with the date bottom-right, like a printed card. */
/** `eager` marks the above-the-fold cover: loaded straight away at high priority. */
export function Cover({ post, sizes, eager }: { post: JournalPost; sizes: string; eager?: boolean }) {
  return (
    <div className={styles.media}>
      <Image src={post.image.src} alt={post.image.alt} fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        fetchPriority={eager ? "high" : undefined}
        className={styles.img}
      />
      <time dateTime={post.date} className={styles.date}>
        {formatDate(post.date)}
      </time>
    </div>
  );
}

function Card({ post, index }: { post: JournalPost; index: number }) {
  return (
    <li className={styles.card}>
      <article className={styles.cardInner}>
        <Cover
          post={post}
          eager={index === 0}
          sizes="(min-width: 1200px) 300px, (min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw"
        />
        <h2 className={styles.cardTitle}>
          {/* The link's ::after covers the whole card, so the card is one tap target. */}
          <Link href={`/journal/${post.slug}`} className={styles.cardLink} transitionTypes={[OPEN_POST]}>
            {post.title}
          </Link>
        </h2>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <span className={styles.more} aria-hidden="true">
          Read more
          <Arrow />
        </span>
      </article>
    </li>
  );
}

/** A single post. Until full stories are written it shows the cover, title and excerpt. */
export function JournalPostArticle({ post }: { post: JournalPost }) {
  return (
    <article className={styles.postBody}>
      <Cover post={post} sizes="(min-width: 760px) 680px, 100vw" eager />
      <h1 className={styles.postTitle}>{post.title}</h1>
      <p className={styles.postLede}>{post.excerpt}</p>
      <p className={styles.postNote}>
        Full story coming soon · <span lang="tl">Malapit na</span>
      </p>
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
        <Link href="/contact" className={styles.book}>
          Book a table
        </Link>
      </div>
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
        <Link href="/journal" className={styles.missingLink}>
          See all stories
          <Arrow />
        </Link>
      </section>
    </JournalPostShell>
  );
}

/** The Journal index: big title, then every post as a card in a 4/3/2/1-column grid. */
export function JournalPage() {
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="ink" mark="ink" currentHref="/journal" />

      <header className={styles.intro}>
        <h1 className={styles.title}>Journal</h1>
        <p className={styles.lede}>
          <span lang="tl">Balita</span> · News, stories and the family album from Kentish Town Road
        </p>
      </header>

      <ul className={styles.grid}>
        {posts.map((p, i) => (
          <Card key={p.slug} post={p} index={i} />
        ))}
      </ul>

      <div className={styles.cta}>
        <Link href="/contact" className={styles.book}>
          Book a table
        </Link>
      </div>
    </main>
  );
}
