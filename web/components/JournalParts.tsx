import Image from "next/image";
import Link from "next/link";
import type { JournalPost } from "@/lib/journal";
import { OPEN_POST } from "./PageTransition";
import styles from "./JournalPage.module.css";

/* Pieces shared by the Journal's server page and its client Older entries
   search. No "use client" here: each side renders them in its own world. */

/** Long thin arrow for Read links. */
export function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 36 12" width="36" height="12" aria-hidden="true" focusable="false">
      <path d="M0 6h34M29 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/** A story photo, cropped to its frame. */
export function Photo({
  post,
  sizes,
  eager,
  framed,
  className,
}: {
  post: JournalPost;
  sizes: string;
  eager?: boolean;
  framed?: boolean;
  className?: string;
}) {
  return (
    <div className={[styles.photo, framed && styles.framed, className].filter(Boolean).join(" ")}>
      <Image
        src={post.image.src}
        alt={post.image.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        fetchPriority={eager ? "high" : undefined}
        className={styles.img}
      />
    </div>
  );
}

/**
 * A story's one link: its headline, stretched over the story's block so the
 * whole block is one tap target. Carries OPEN_POST for the iris transition.
 */
export function Headline({ post }: { post: JournalPost }) {
  return (
    <Link href={`/journal/${post.slug}`} className={styles.storyLink} transitionTypes={[OPEN_POST]}>
      {post.title}
    </Link>
  );
}
