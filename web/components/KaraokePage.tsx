import Link from "next/link";
import { BOOKING_URL } from "@/lib/nav";
import { site } from "@/lib/site";
import { FitTitle } from "./FitTitle";
import { KaraokeHero } from "./KaraokeHero";
import { KaraokeSnap } from "./KaraokeSnap";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./KaraokePage.module.css";

/*
 * Karaoke, after the "Karaoke — night edition" board in the Claude Design canvas.
 * One pinned stage: the video of the room and the Home subtitles, with the yellow header
 * and KARAOKE fixed above it. Scrolling fades the subtitles and dims the room while the
 * information scrolls up over the video in yellow (the board's two columns, the video
 * standing in for their photos) and rests at its foot, with scroll assistance to that
 * view. Scrolling on, the yellow footer slides over it all while it stays pinned, the
 * title and information lifting slightly and fading as it covers them.
 * Facts from the karaoke sheet in lib/menu.ts and the current bintangrestaurant.co.uk
 * Karaoke page. Tagalog lines are pending a native-speaker check, like the rest of the site.
 */

const ARROW = (
  <svg
    width="36"
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

export function KaraokePage() {
  return (
    <main className={styles.page}>
      <div className={styles.scroller}>
        {/* The video stays pinned until the footer covers it. */}
        <div className={styles.pin}>
          <KaraokeHero />
        </div>

        {/* The header and KARAOKE stay at the top; the information scrolls up from the bottom
            and rests at the foot of the video; the footer, last in the group, slides over them. */}
        <div className={styles.group}>
          <div className={styles.bar}>
            <SiteHeader variant="overlay" tone="yellow" mark="yellow" currentHref="/contact/karaoke" />
            <h1 className={styles.title}>
              <FitTitle text="Karaoke" />
              <span className="sr-only"> — private karaoke room at Bintang, Kentish Town</span>
            </h1>
          </div>

          <KaraokeSnap />

          <div className={styles.info} data-testid="karaoke-info">
            <section className={styles.way} aria-labelledby="karaoke-dining">
              <p className={styles.k}>01 · Group dining</p>
              <h2 id="karaoke-dining" className={styles.h3}>
                The sharing <i>feast</i>
              </h2>
              <p className={styles.m}>
                Family-style platters for the table at £38 per person: three starters and three mains with jasmine rice,
                then Buko Pandan.
              </p>
              {/* Keeps the space the photo had, so the buttons sit where they did. */}
              <div className={styles.shot} aria-hidden="true" />
              <div className={styles.actions}>
                <a href={BOOKING_URL} target="_blank" rel="noopener" className="cine-book">
                  <span className="cine-frame">Book a table</span>{" "}
                  <span className="sr-only">on OpenTable (opens in a new tab)</span>
                </a>
                <Link href="/menu#karaoke" className={styles.more}>
                  See the karaoke menu {ARROW}
                </Link>
              </div>
            </section>

            <section className={styles.way} aria-labelledby="karaoke-hire">
              <p className={styles.k}>02 · Private hire</p>
              <h2 id="karaoke-hire" className={styles.h3}>
                The whole <i>room</i>
              </h2>
              <p className={styles.m}>
                Hire our lower ground floor and the karaoke comes with it. Email us for room-hire prices and available
                time slots.
              </p>
              {/* Keeps the space the photo had, so the buttons sit where they did. */}
              <div className={styles.shot} aria-hidden="true" />
              <div className={styles.actions}>
                <a
                  href={`mailto:${site.email}?subject=${encodeURIComponent("Karaoke room hire")}`}
                  className="cine-book"
                >
                  <span className="cine-frame">Enquire</span>{" "}
                  <span className="sr-only">about the karaoke room by email</span>
                </a>
                <a href={`mailto:${site.email}`} className={styles.more}>
                  {site.email}
                </a>
              </div>
            </section>
          </div>

          {/* How long the information stays up before the footer comes. */}
          <div className={styles.hold} aria-hidden="true" />

          {/* The yellow footer slides up over everything while it all stays pinned; the title
              and information lift a little and fade as it covers them. */}
          <div className={styles.footer}>
            <SiteFooter />
          </div>
        </div>
      </div>
    </main>
  );
}
