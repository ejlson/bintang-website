"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FitTitle } from "./FitTitle";
import styles from "./ErrorScreen.module.css";

type Props = {
  /** Re-renders the part of the page that failed (Next's `retry` from error.tsx / global-error.tsx). */
  onRetry: () => void;
  /** The shared header, when the root layout is still standing (error.tsx). */
  header?: ReactNode;
  /** The shared footer, likewise. */
  footer?: ReactNode;
};

/**
 * The runtime error page, from "Error C — Red title card" on the Claude Design
 * canvas "Bintang error + privacy": About's red, a giant cream SORRY across the
 * width, then a line of apology and two ways on: "Try again", drawn like the
 * header's Book, and a link home. Same voice as the 404 (app/not-found.tsx).
 */
export function ErrorScreen({ onRetry, header, footer }: Props) {
  return (
    <main className={styles.page}>
      {header}
      <section className={styles.card}>
        <h1 className={styles.title}>
          <FitTitle text="Sorry" squish={1} />
        </h1>
        <div className={styles.foot}>
          <div className={styles.words}>
            <p className={styles.lede}>Something went wrong on our side and this page didn’t load.</p>
            {/* Tagalog: pending native-speaker review, like the rest of the site's Tagalog. */}
            <p className={styles.note} lang="tl">
              Pasensya na po, may nagkaproblema
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/" className={styles.line}>
              Back to home <span aria-hidden="true">→</span>
            </Link>
            <button type="button" className={styles.retry} onClick={() => onRetry()}>
              Try again
            </button>
          </div>
        </div>
      </section>
      {footer}
    </main>
  );
}
