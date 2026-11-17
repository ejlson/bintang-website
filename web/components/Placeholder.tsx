import Link from "next/link";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { FitTitle } from "./FitTitle";
import styles from "./Placeholder.module.css";

type Props = {
  title: string;
  /** Tagalog subtitle — pending native-speaker review. */
  tl: string;
  href: string;
  /** Page flood colour from the v2 design. */
  background: string;
  tone: "paper" | "ink";
};

/** Stand-in for pages not built yet, in the page's own colour. */
export function Placeholder({ title, tl, href, background, tone }: Props) {
  return (
    <main className={styles.page} style={{ background, color: tone === "paper" ? "var(--paper)" : "var(--ink)" }}>
      <SiteHeader variant="page" tone={tone} mark={tone === "paper" ? "paper" : "ink"} currentHref={href} />
      <section className={styles.body}>
        <h1 className={styles.title}>
          <FitTitle text={title} />
        </h1>
        <p className={styles.tl} lang="tl">
          {tl}
        </p>
        <p className={styles.note}>
          Coming soon
          <br />
          <span lang="tl">Malapit na</span>
        </p>
        <Link href="/" className={styles.back}>
          ← Back home
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
