import Link from "next/link";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";
import styles from "./SiteFooter.module.css";

/**
 * Site footer, after Mala Project's: no colour of its own (it takes the page's
 * background and text colour), stacked links on the left, how to find us on
 * the right, and a small sign-off underneath.
 * Render it as the last child of a page's <main>, like SiteHeader.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav aria-label="More" className={styles.links}>
        <a href={BOOKING_URL} target="_blank" rel="noopener" className={styles.link}>
          Reserve on OpenTable<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <Link href="/contact/groups" className={styles.link}>
          Group bookings
        </Link>
        <Link href="/contact/private-hire" className={styles.link}>
          Private hire
        </Link>
        <a href={`mailto:${site.email}`} className={styles.link}>
          {site.email}
        </a>
        <a href={`tel:${site.phoneIntl}`} className={styles.link}>
          {site.phone}
        </a>
      </nav>

      <div className={styles.visit}>
        <div className={styles.block}>
          <h2 className={styles.heading}>Find us</h2>
          <a href={site.mapUrl} target="_blank" rel="noopener" className={styles.link}>
            <address className={styles.address}>
              {site.street}
              <br />
              Kentish Town, {site.locality} {site.postcode}
            </address>
            <span className="sr-only"> (map, opens in a new tab)</span>
          </a>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Opening hours</h2>
          <dl className={styles.hours}>
            {hours.map((h) => (
              <div key={h.label} className={styles.row}>
                <dt>{h.label}</dt>
                <dd>{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p className={styles.signoff}>
        <span>© Bintang · Kentish Town, London</span>
        <span>Since 1987</span>
      </p>
    </footer>
  );
}
