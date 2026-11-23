import Image from "next/image";
import Link from "next/link";
import { BOOKING_URL } from "@/lib/nav";
import { hours, site } from "@/lib/site";
import { AboutFilm } from "./AboutFilm";
import { FitTitle } from "./FitTitle";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./AboutPage.module.css";

/*
 * About, after the "About option B — Editorial album" board in the Claude Design canvas.
 * History facts come from maginhawagroup.co.uk/about. Tagalog lines are pending a
 * native-speaker check, like the rest of the site.
 */

/** "From one kitchen": the group's years, from the Maginhawa story page. */
export const YEARS = [
  { year: "1987", text: "Bintang opens on Kentish Town Road, run by Chef Omar’s parents." },
  { year: "2007", text: "Guanabana, a halal Caribbean and Latin American kitchen, joins in Kentish Town." },
  { year: "2017", text: "Mamasons opens: London’s first Filipino ice-cream parlour." },
  { year: "2018", text: "Ramo Ramen opens on Kentish Town Road." },
  { year: "2025", text: "Hoodwood, Café Mama & Sons and Belly open in Kentish Town." },
  { year: "2026", text: "Belly enters the Michelin Guide, and Bunso opens on Hawley Road." },
];

/** Then and now: stills from the about film, plus the garden. */
export const ALBUM = [
  {
    src: "/media/about/then-first-shopfront.jpg",
    alt: "An old photograph of the first Bintang shopfront with its scalloped awning, held up in the garden",
    when: ["Then", "Noon"],
    name: ["The first", "shopfront"],
    caption: "The scalloped awning on Kentish Town Road, from the family album.",
  },
  {
    src: "/media/about/then-dining-room.jpg",
    alt: "An old photograph of the original dining room hung with bunting",
    when: ["Then", "Noon"],
    name: ["The dining", "room"],
    caption: "Bunting over every table, from the family album.",
  },
  {
    src: "/media/about/now-kentish-town-road.jpg",
    alt: "The Bintang shopfront on Kentish Town Road today, with its red neon sign",
    when: ["Now", "Ngayon"],
    name: ["Kentish Town", "Road"],
    caption: "The same address today, under a red neon sign.",
  },
  {
    src: "/media/about/now-garden.jpg",
    alt: "Diners at tables in the garden under coloured paper bunting at golden hour",
    when: ["Now", "Ngayon"],
    name: ["The", "garden"],
    caption: "String lights and paper bunting over the tables.",
  },
] as const;

/** Dish names from the current menu (lib/menu.ts), run on like a client list. */
export const DISHES = [
  "Pandesal",
  "Okoy Fritters",
  "Lumpiang Cigarillos",
  "Calamansi Hot Honey Wings",
  "Pandesal Slider",
  "Oak Smoked Chicken Inasal",
  "Spicy Beef Sisig",
  "Inasal Platter",
  "Bintang Noodles",
  "Seafood Palabok",
  "Filipino Lamb Curry",
  "Oxtail Kare Kare",
  "Ulek Curry",
  "Bintang Curry",
  "Chicken Adobo",
  "Laing",
  "Talong and Mango Ensalada",
  "Garlic Fried Rice",
  "Bagoong Fried Rice",
  "Ube Colada",
  "Pandan Old Fashioned",
  "Calamansi-ade",
];

const COME_FOR: { en: string; tl?: string; body: string }[] = [
  {
    en: "Dinner",
    body: "Tuesday to Sunday. Order two or three dishes between two, add a bowl of rice, and eat it the way we would at home.",
  },
  { en: "Brunch", body: "Saturday and Sunday: silogs, garlic fried rice and a fried egg." },
  { en: "Karaoke", tl: "Kantahan", body: "When the night calls for it." },
  {
    en: "Groups",
    tl: "Grupo",
    body: "The big tables at the back are built for birthdays, work dinners, and everyone you’ve been meaning to feed.",
  },
];

const ARROW = (
  <svg width="36" height="10" viewBox="0 0 36 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M0 5h34M30 1l4 4-4 4" />
  </svg>
);

const OPEN = hours.filter((h) => h.opens);

export function AboutPage() {
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="paper" mark="paper" currentHref="/about" />

      <div className={styles.wrap}>
        {/* ---------- Masthead: title, band, ruled facts ---------- */}
        <div className={styles.masthead}>
          <h1 className={styles.title}>
            <FitTitle text="About us" />
          </h1>
        </div>

        <p className={styles.band}>London’s oldest Filipino restaurant · Since 1987</p>

        <dl className={`${styles.facts} ${styles.ruled}`}>
          <div>
            <dt className={styles.k}>
              Since · <span lang="tl">Mula noong</span>
            </dt>
            <dd className={styles.s}>1987, on Kentish Town Road</dd>
          </div>
          <div>
            <dt className={styles.k}>Find us</dt>
            <dd className={styles.s}>
              {site.street}
              <br />
              {site.locality} {site.postcode}
            </dd>
          </div>
          <div>
            <dt className={styles.k}>Open</dt>
            <dd className={styles.s}>
              {OPEN.map((h, i) => (
                <span key={h.label}>
                  {i === 1 ? <br /> : i > 1 ? " · " : null}
                  {h.label} {h.time}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className={styles.k}>Brunch</dt>
            <dd className={styles.s}>
              Saturday 11am–3pm
              <br />
              Sunday all day
            </dd>
          </div>
        </dl>

        {/* ---------- Statement + film, golden ratio ---------- */}
        <section className={styles.intro} aria-label="Bintang today">
          <div className={styles.lead}>
            <p className={styles.statement}>
              Bintang is <em>London’s oldest Filipino restaurant</em>. Since 1987 we’ve cooked from the same kitchen on{" "}
              <em>Kentish Town Road</em> — <em>Filipino</em> favourites with <em>Asian influences</em>, made to be shared.
              It’s a place for big flavours, big nights, and long tables of friends and family.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- small vector drawing, no optimisation needed */}
            <img className={styles.lion} src="/brand/lion-full-paper.svg" alt="" width={156} height={117} />
          </div>
          <AboutFilm />
        </section>

        {/* ---------- History + family album ---------- */}
        <section className={`${styles.sec} ${styles.album}`} aria-labelledby="about-history">
          <p className={`${styles.k} ${styles.center}`}>
            The family album · <span lang="tl">Ang album ng pamilya</span>
          </p>
          <h2 id="about-history" className={`${styles.hl} ${styles.headline}`}>
            Where it began. Camden, 1987.
          </h2>

          <div className={styles.story}>
            <figure className={styles.storyFigure}>
              <div className={styles.frame}>
                <Image
                  src="/media/about/history-halloween-shopfront.jpg"
                  alt="Halloween outside the original Bintang shopfront: two people in costume under the scalloped awning, which carries the old 01-284 1640 phone number"
                  width={1600}
                  height={968}
                  sizes="(width >= 900px) 60vw, 100vw"
                />
              </div>
              <figcaption className={styles.cap}>
                Halloween at the original shopfront. The awning still carries the old 01- London phone number.
              </figcaption>
            </figure>
            <div className={styles.storyText}>
              <p className={styles.k}>
                1987 · <span lang="tl">Ang simula</span>
              </p>
              <p className={styles.m}>
                Chef Omar Shah’s parents opened Bintang on Kentish Town Road in 1987: a Filipino kitchen with a fusion
                accent, cooking Malay, Indonesian, Japanese, Vietnamese and Filipino food side by side. It soon became a
                neighbourhood fixture.
              </p>
            </div>
          </div>

          <div className={`${styles.story} ${styles.storyMirror}`}>
            <figure className={styles.storyFigure}>
              <div className={styles.frame}>
                <Image
                  src="/media/about/history-bamboo-dining-room.jpg"
                  alt="Four people in aprons and everyday clothes smiling together in the old bamboo-walled dining room, a painted fan on the wall behind them"
                  width={1600}
                  height={1066}
                  sizes="(width >= 900px) 60vw, 100vw"
                />
              </div>
              <figcaption className={styles.cap}>The bamboo dining room, from the family album.</figcaption>
            </figure>
            <div className={styles.storyText}>
              <p className={styles.k}>
                The next generation · <span lang="tl">Ang susunod na henerasyon</span>
              </p>
              <p className={styles.m}>
                Omar grew up in his parents’ dining room and took over the stove in his twenties. There was never a plan
                to build a group, only a kitchen to keep open, and then another when the first got too small.
              </p>
            </div>
          </div>

          <div className={styles.brief}>
            <h3 className={`${styles.d} ${styles.rise}`}>From one kitchen</h3>
            <ol className={`${styles.years} ${styles.ruled}`}>
              {YEARS.map((y) => (
                <li key={y.year}>
                  <p className={styles.d}>{y.year}</p>
                  <p className={styles.s}>{y.text}</p>
                </li>
              ))}
            </ol>
            <p className={`${styles.cap} ${styles.boxedLine}`}>
              Still run by the same family, led by Chef Omar · Made with heritage, served with heart.
            </p>
          </div>

          <div className={styles.thenNow}>
            <p className={`${styles.k} ${styles.center}`}>
              Then and now · <span lang="tl">Noon at ngayon</span>
            </p>
            <div className={styles.strip}>
              {ALBUM.map((p) => (
                <figure key={p.src} className={styles.photo}>
                  <div className={styles.photoFrame}>
                    <Image src={p.src} alt={p.alt} fill sizes="(width >= 1000px) 25vw, (width >= 560px) 50vw, 100vw" />
                  </div>
                  <p className={styles.k}>
                    {p.when[0]} · <span lang="tl">{p.when[1]}</span>
                  </p>
                  <figcaption className={styles.photoCaption}>
                    <span className={styles.h3}>
                      {p.name[0]} <i>{p.name[1]}</i>
                    </span>
                    <span className={styles.cap}>{p.caption}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Giant quote ---------- */}
        <section className={`${styles.sec} ${styles.quote}`} aria-label="Same street, same kitchen, same recipes">
          <p className={styles.cap}>
            <span lang="tl">Simula pa noong 1987</span> — since 1987.
          </p>
          <p className={styles.qt}>“Same street, same kitchen, same recipes.”</p>
        </section>

        {/* ---------- Dishes, boxed like the Menu ---------- */}
        <section className={styles.sec} aria-labelledby="about-dishes">
          <div className={styles.dishBox}>
            <h2 id="about-dishes" className={styles.k}>
              From the kitchen · <span lang="tl">Mula sa kusina</span>
            </h2>
            <p className={styles.dishes}>
              {DISHES.map((d, i) => (
                <span key={d}>
                  {i > 0 && " , "}
                  <span className={styles.dish}>{d}</span>
                </span>
              ))}
            </p>
            <Link href="/menu" className={styles.more}>
              See the menu {ARROW}
            </Link>
          </div>
        </section>

        {/* ---------- Come for ---------- */}
        <section className={`${styles.sec} ${styles.come}`} aria-labelledby="about-come">
          <h2 id="about-come" className={styles.k}>
            Come for · <span lang="tl">Halika</span>
          </h2>
          <div className={`${styles.comeGrid} ${styles.ruled}`}>
            {COME_FOR.map((c) => (
              <div key={c.en}>
                <h3 className={styles.h3}>
                  {c.en}
                  {c.tl && (
                    <>
                      {" "}
                      <i lang="tl">{c.tl}</i>
                    </>
                  )}
                </h3>
                <p className={styles.s}>{c.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <a href={BOOKING_URL} target="_blank" rel="noopener" className="cine-book">
              <span className="cine-frame">Book a table</span>{" "}
              <span className="sr-only">on OpenTable (opens in a new tab)</span>
            </a>
            <Link href="/contact/private-hire" className={styles.more}>
              Groups and private hire {ARROW}
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
