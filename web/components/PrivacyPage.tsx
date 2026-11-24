import type { ReactNode } from "react";
import { BOOKING_URL } from "@/lib/nav";
import { site } from "@/lib/site";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./PrivacyPage.module.css";

/** A fact the owner must fill in or confirm before launch. Shown in brackets so it can't be missed. */
function Todo({ children }: { children: ReactNode }) {
  return <span className={styles.todo}>[{children}]</span>;
}

const email = (
  <a href={`mailto:${site.email}`}>{site.email}</a>
);
const phone = <a href={`tel:${site.phoneIntl}`}>{site.phone}</a>;

type Section = { id: string; title: string; body: ReactNode };

export const privacySections: Section[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          This website is run by <Todo>LEGAL ENTITY NAME</Todo> (“Bintang”, “we”), {site.street}, {site.locality}{" "}
          {site.postcode}. We decide how the data described here is used, which makes us its controller under UK GDPR.
        </p>
        <p>
          ICO registration: <Todo>ICO REGISTRATION NUMBER</Todo>. Questions about your data: {email} or {phone}.
        </p>
      </>
    ),
  },
  {
    id: "when-you-visit",
    title: "When you visit",
    body: (
      <p>
        The site is hosted by Cloudflare. To send you pages and protect the site from attacks, Cloudflare processes the
        technical details every browser sends: your IP address, browser type and the pages you ask for. We rely on our
        legitimate interest in running a working, secure website. <Todo>CONFIRM: how long Cloudflare keeps these logs,
        and that no Cloudflare cookie such as __cf_bm is set</Todo>
      </p>
    ),
  },
  {
    id: "our-typeface",
    title: "Our typeface",
    body: (
      <p>
        Our lettering comes from Adobe Fonts. Your browser fetches it from use.typekit.net and p.typekit.net, so Adobe
        receives your IP address and the address of the page. Adobe says it does not set cookies for this, and its own
        privacy policy covers that data.
      </p>
    ),
  },
  {
    id: "in-your-browser",
    title: "In your browser",
    body: (
      <p>
        This site sets no cookies. It keeps two small notes in your browser’s session storage: whether you’ve already
        seen the opening animation, and where you were on a page so the back button returns you there. They contain
        nothing about you, are never sent to us, and are cleared when you close the tab.
      </p>
    ),
  },
  {
    id: "bookings-and-links",
    title: "Bookings and links",
    body: (
      <p>
        <a href={BOOKING_URL} target="_blank" rel="noopener">
          Book a table<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        takes you to OpenTable, which handles your booking under its own privacy policy. Links to Instagram, TikTok and
        Google Maps work the same way: once you’re on their site, their policies apply.
      </p>
    ),
  },
  {
    id: "when-you-contact-us",
    title: "When you contact us",
    body: (
      <>
        <p>
          If you email or phone us, we use what you tell us (your name, contact details, the date and size of your
          party, and anything you share about allergies or access) to reply and to look after your visit. We rely on
          taking the steps you’ve asked for before a booking, and on our legitimate interests. Allergy and access
          details count as health information: we use them only to look after you, with your consent.
        </p>
        <p>
          We keep emails for <Todo>RETENTION PERIOD</Todo>, then delete them.
        </p>
      </>
    ),
  },
  {
    id: "who-else-sees-it",
    title: "Who else sees it",
    body: (
      <p>
        We never sell your data or use it for marketing. Cloudflare, Adobe and Google (who runs our email) process data
        for the purposes above. Some of them work outside the UK; they rely on the safeguards UK law requires for
        international transfers.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          You can ask us for a copy of the data we hold about you, to correct it, to delete it, to restrict or object
          to how we use it, or to receive it in a portable form. Email {email} and we’ll reply within one month.
        </p>
        <p>
          If you’re unhappy with how we’ve handled your data, you can complain to the Information Commissioner’s
          Office:{" "}
          <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener">
            ico.org.uk<span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          or <a href="tel:+443031231113">0303 123 1113</a>.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        If we ever add analytics or anything else that collects data, we’ll update this page first.{" "}
        <Todo>CONFIRM: no analytics planned at launch</Todo>
      </p>
    ),
  },
];

/**
 * The privacy notice at /privacy, from "Privacy C — Quiet paper with contents"
 * on the Claude Design canvas "Bintang error + privacy", set on About's red
 * with white type: a short summary, an "On this page" list, then the
 * numbered sections. Bracketed facts are for the owner to fill in.
 */
export function PrivacyPage() {
  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="paper" mark="paper" />
      <div className={styles.wrap}>
        <p className={styles.kicker}>
          UK GDPR · Last updated <Todo>DATE</Todo>
        </p>
        <h1 className={styles.title}>Privacy notice</h1>
        <p className={styles.lede}>
          This website has no forms, no tracking and sets no cookies. Below is everything it does with your data, and
          what we do when you get in touch.
        </p>

        <div className={styles.columns}>
          <nav aria-label="On this page" className={styles.toc}>
            <p className={styles.tocLabel} aria-hidden="true">
              On this page
            </p>
            <ol>
              {privacySections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className={styles.num} aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.body}>
            {privacySections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className={styles.section}>
                <h2 id={`${s.id}-title`} className={styles.h2}>
                  <span className={styles.num} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
