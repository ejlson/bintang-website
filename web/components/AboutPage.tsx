import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { AboutFilm } from "./AboutFilm";
import styles from "./AboutPage.module.css";

/** Tagalog lines pending native-speaker review, like the rest of the site. */
export const CHAPTERS = [
  {
    en: "1987",
    tl: "Ang simula",
    // Founding story (who opened it, and why) still to come from the family.
    body: "A door on Kentish Town Road, a few minutes from Camden Town.",
  },
  {
    en: "The kitchen",
    tl: "Ang kusina",
    body: "Kare-kare in a thick peanut sauce, adobo braised in vinegar and soy, and the owner’s own sambal chicken inasal.",
  },
  {
    en: "Today",
    tl: "Ngayon",
    body: "A garden strung with bunting, weekend Filipino brunch, and private karaoke downstairs.",
  },
];

/** About: the statement beside the then-and-now film (golden ratio), then three short chapters. */
export function AboutPage() {
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="paper" mark="paper" currentHref="/about" />

      <section className={styles.intro}>
        {/* No visible title on About: the statement leads. The H1 stays for screen readers and search. */}
        <h1 className="sr-only">About</h1>
        <p className={styles.statement}>
          Bintang is London’s oldest Filipino restaurant. Since 1987 we’ve cooked from the same kitchen on Kentish
          Town Road — Filipino favourites with Asian influences, made to be shared. It’s a place for big flavours,
          big nights, and long tables of friends and family.
        </p>
        <AboutFilm />
      </section>

      <section className={styles.chapters} aria-label="Our story">
        {CHAPTERS.map((c) => (
          <div key={c.en} className={styles.chapter}>
            <h2 className={styles.label}>
              <span className={styles.line}>{c.en}</span>{" "}
              <span className={styles.line} lang="tl">
                {c.tl}
              </span>
            </h2>
            <p className={styles.body}>{c.body}</p>
          </div>
        ))}
      </section>

      <SiteFooter />
    </main>
  );
}
