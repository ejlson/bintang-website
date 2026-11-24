import type { Metadata, Viewport } from "next";
import { HistoryWipe } from "@/components/PageTransition";
import { SmoothScroll } from "@/components/SmoothScroll";
import { INTRO_SCRIPT } from "@/lib/homeIntro";
import { BOOKING_URL } from "@/lib/nav";
import { HOME_IMAGE, HOME_TITLE, jsonLdHtml, ogBase, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";
import { hours, site, socials } from "@/lib/site";
import "lenis/dist/lenis.css";
import "./globals.css";

const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: "%s · Bintang",
  },
  description,
  // No canonical here, or every page would inherit "/". Pages set their own (lib/seo pageMeta).
  openGraph: {
    ...ogBase,
    type: "website",
    // No url here: pages without their own openGraph would share as the home page.
    title: HOME_TITLE,
    description,
    images: [HOME_IMAGE],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": `${SITE_URL}/#restaurant`,
  name: "Bintang",
  description,
  url: SITE_URL,
  telephone: site.phoneIntl,
  email: site.email,
  image: [
    `${SITE_URL}/media/hero-poster.jpg`,
    `${SITE_URL}/media/gallery/garden.jpg`,
    `${SITE_URL}/media/about/history-bamboo-dining-room.jpg`,
  ],
  servesCuisine: ["Filipino", "Asian"],
  priceRange: site.priceRange,
  menu: `${SITE_URL}/menu`,
  hasMenu: { "@id": `${SITE_URL}/menu#menu` },
  acceptsReservations: BOOKING_URL,
  foundingDate: "1987",
  sameAs: socials.map((s) => s.url),
  address: {
    "@type": "PostalAddress",
    streetAddress: site.street,
    addressLocality: site.locality,
    postalCode: site.postcode,
    addressCountry: "GB",
  },
  geo: { "@type": "GeoCoordinates", ...site.geo },
  hasMap: site.mapUrl,
  openingHoursSpecification: hours
    .filter((h) => h.opens)
    .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Bintang",
  inLanguage: "en-GB",
  publisher: { "@id": `${SITE_URL}/#restaurant` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: INTRO_SCRIPT sets data-home-intro on <html> before hydration.
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* Decides the Home title intro before first paint (lib/homeIntro). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        {/* Adobe Fonts kit: Aquavit (700 = Black, 400 = Regular), used for all text.
            Preconnect: font files come from use.typekit.net over CORS; the kit CSS
            @imports p.typekit.net without CORS, so that one gets no crossOrigin. */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" />
        <link rel="stylesheet" href="https://use.typekit.net/pev2vne.css" />
      </head>
      <body>
        <HistoryWipe />
        <SmoothScroll />
        {children}
        {/* The soft dark fade at the edges of the screen, on every page (globals.css). */}
        <div className="vignette" aria-hidden="true" />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml([restaurantJsonLd, websiteJsonLd])} />
      </body>
    </html>
  );
}
