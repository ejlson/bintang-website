import Link from "next/link";
import type { CSSProperties } from "react";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";
import { BackToTop } from "./BackToTop";
import styles from "./SiteFooter.module.css";

/**
 * The lion fades away towards the bottom, softening a little as it goes:
 * three copies (sharp, slightly soft, soft), each shown in a band of the lion's
 * height (% from the top) and fading out, so it's gone by ~90%, clear of the
 * text along the bottom. Blurs are a fraction of --lion-blur (CSS, per breakpoint).
 */
const fadeLayers: { blur: number; mask: string }[] = [
  { blur: 0, mask: "linear-gradient(to bottom, #000 30%, transparent 56%)" },
  { blur: 0.4, mask: "linear-gradient(to bottom, transparent 30%, #000 50%, transparent 74%)" },
  { blur: 1, mask: "linear-gradient(to bottom, transparent 50%, rgb(0 0 0 / 0.7) 68%, transparent 90%)" },
];

const blurLayers: CSSProperties[] = fadeLayers.map(({ blur, mask }) => ({
  filter: blur ? `blur(calc(var(--lion-blur) * ${blur}))` : undefined,
  WebkitMaskImage: mask,
  maskImage: mask,
}));

/**
 * Site footer: the full Bintang lion across the page, sharp at the head and
 * fading away towards the bottom, with small type at the edges.
 * It has no colour of its own: the lion and text take the page's text colour,
 * the background is the page's. Render it as the last child of a page's <main>.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.lion} aria-hidden="true">
        {blurLayers.map((style, k) => (
          // Blur first, then cut the band: masking before blurring smears the band's
          // edges into streaks. The band box is wider than the lion (see .band) so
          // the blur's sideways spill isn't clipped.
          <div key={k} className={styles.band} style={{ WebkitMaskImage: style.WebkitMaskImage, maskImage: style.maskImage }}>
            <div className={styles.layer} style={{ filter: style.filter }}>
              <div className={styles.shape} />
            </div>
          </div>
        ))}
      </div>

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
