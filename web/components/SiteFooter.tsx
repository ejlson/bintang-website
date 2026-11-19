import Link from "next/link";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";
import { BackToTop } from "./BackToTop";
import { FooterLion } from "./FooterLion";
import styles from "./SiteFooter.module.css";

/**
 * Site footer: the full Bintang lion across the page, sharp at the head and
 * fading away towards the bottom, its tail swaying when the footer comes into
 * view (components/FooterLion), with small type at the edges.
 * It has no colour of its own: the lion and text take the page's text colour,
 * the background is the page's. Render it as the last child of a page's <main>.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <FooterLion />

      <div className={styles.top}>
        <p className={styles.since}>Since 1987</p>
        <nav aria-label="More" className={styles.links}>
          <Link href="/contact/groups">Groups</Link>
          <Link href="/contact/private-hire">Private hire</Link>
          <Link href="/contact/karaoke">Karaoke</Link>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phoneIntl}`}>{site.phone}</a>
        </nav>
        <a href={BOOKING_URL} target="_blank" rel="noopener" className={styles.book}>
          Book a table<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      <div className={styles.bottom}>
        <p className={styles.where}>
          London’s oldest Filipino restaurant.
          <br />
          <a href={site.mapUrl} target="_blank" rel="noopener">
            {site.street}, {site.postcode}.<span className="sr-only"> (map, opens in a new tab)</span>
          </a>
        </p>
        <div className={styles.end}>
          <div role="group" aria-labelledby="footer-hours">
            <p id="footer-hours" className="sr-only">
              Opening hours
            </p>
            <dl className={styles.hours}>
              {hours.map((h) => (
                <div key={h.label} className={styles.row}>
                  <dt>{h.label}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <BackToTop className={styles.backTop} />
        </div>
      </div>
    </footer>
  );
}
