import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
// Same look as the journal's "couldn't find that story" page.
import styles from "@/components/JournalPage.module.css";

export const metadata: Metadata = { title: "Page not found" };

/** Branded 404 for any URL that doesn't match a page (old Squarespace links are redirected in next.config). */
export default function NotFound() {
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="ink" mark="ink" />
      <div className={styles.post}>
        <section className={styles.missing}>
          <h1 className={styles.postTitle}>We couldn’t find that page</h1>
          <p className={styles.postLede}>
            The link may be mistyped, or the page may have moved. Our menu, opening hours and bookings are a click away.
          </p>
          <p className={styles.postNote} lang="tl">
            Wala rito ang hinahanap mo
          </p>
          <Link href="/menu" className={styles.line}>
            See the menu
          </Link>
          <Link href="/contact" className={styles.line}>
            Find us &amp; book a table
          </Link>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
