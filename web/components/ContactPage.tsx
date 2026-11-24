import Link from "next/link";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";
import { ContactFilm } from "./ContactFilm";
import { FitTitle } from "./FitTitle";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./ContactPage.module.css";

/*
 * Contact us: one compact yellow screen (the footer is the next). The title across the width, then the
 * Home film's portrait loop (ContactFilm) beside an index of numbered rows (visit, call, write, hours),
 * each split by a rule, and the Book button at the foot. Patterned on the
 * typographic restaurant contact pages on Awwwards (Root Food, UVE, Les Burgers
 * de Colette): big type, few words, every detail a link.
 * Facts come from lib/site.ts, shared with the footer and the JSON-LD.
 * Tagalog lines are pending a native-speaker check, like the rest of the site.
 */

const ARROW = (
  <svg
    width="28"
    height="10"
    viewBox="0 0 36 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <path d="M0 5h34M30 1l4 4-4 4" />
  </svg>
);

export function ContactPage() {
  return (
    <main className={styles.page}>
      {/* Header, title and details share one screen; the footer is the next. */}
      <div className={styles.screen}>
        <SiteHeader
          variant="page"
          tone="ink"
          mark="ink"
          currentHref="/contact"
        />

        {/* Across the page between two rules, like the Journal's masthead; the
            letters keep the site's usual proportions (FitTitle's default squish). */}
        <h1 className={styles.title}>
          <span className={styles.titleMask}>
            <FitTitle text="Contact us" />
          </span>
          <span className="sr-only"> — Bintang, 93 Kentish Town Road, Camden</span>
        </h1>

        <div className={styles.wrap}>

          <div className={styles.grid}>
            <ContactFilm />

            <div className={styles.list}>
              <section className={styles.row} aria-labelledby="contact-visit">
                <p className={styles.k} aria-hidden="true">01</p>
                <h2 id="contact-visit" className={styles.h}>
                  Visit <span lang="tl">Bisitahin</span>
                </h2>
                <div className={styles.v}>
                  <a
                    href={site.mapUrl}
                    target="_blank"
                    rel="noopener"
                    className={styles.big}
                  >
                    {site.street}, {site.locality} {site.postcode}
                    <span className="sr-only">
                      {" "}
                      (Google Maps, opens in a new tab)
                    </span>
                  </a>
                </div>
              </section>

              <section className={styles.row} aria-labelledby="contact-call">
                <p className={styles.k} aria-hidden="true">02</p>
                <h2 id="contact-call" className={styles.h}>
                  Call <span lang="tl">Tumawag</span>
                </h2>
                <div className={styles.v}>
                  <a href={`tel:${site.phoneIntl}`} className={styles.big}>
                    {site.phone}
                  </a>
                </div>
              </section>

              <section className={styles.row} aria-labelledby="contact-write">
                <p className={styles.k} aria-hidden="true">03</p>
                <h2 id="contact-write" className={styles.h}>
                  Write <span lang="tl">Sumulat</span>
                </h2>
                <div className={styles.v}>
                  <a href={`mailto:${site.email}`} className={styles.big}>
                    {site.email}
                  </a>
                  <p className={styles.note}>
                    Groups, private hire and karaoke nights.
                  </p>
                </div>
              </section>

              <section className={styles.row} aria-labelledby="contact-hours">
                <p className={styles.k} aria-hidden="true">04</p>
                <h2 id="contact-hours" className={styles.h}>
                  Hours <span lang="tl">Oras</span>
                </h2>
                <dl className={styles.hours}>
                  {hours.map((h) => (
                    <div key={h.label}>
                      <dt>{h.label}</dt>
                      <dd>{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <div className={styles.actions}>
                {/* Drawn like the header's Book button (SiteHeader.module.css .book). */}
                <a href={BOOKING_URL} target="_blank" rel="noopener" className={styles.book}>
                  Book a table{" "}
                  <span className="sr-only">on OpenTable (opens in a new tab)</span>
                </a>
                <Link href="/contact/karaoke" className={styles.more}>
                  Karaoke &amp; private hire {ARROW}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
