import type { Metadata, Viewport } from "next";
import { HistoryWipe } from "@/components/PageTransition";
import { SmoothScroll } from "@/components/SmoothScroll";
import { INTRO_SCRIPT } from "@/lib/homeIntro";
import { hours, site } from "@/lib/site";
import "lenis/dist/lenis.css";
import "./globals.css";

const description =
  "London’s oldest Filipino restaurant. Filipino home cooking made for sharing, private karaoke and a garden on Kentish Town Road, Camden — since 1987.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bintangrestaurant.co.uk"),
  title: {
    default: "Bintang — Filipino restaurant in Camden since 1987",
    template: "%s · Bintang",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Bintang",
    locale: "en_GB",
    title: "Bintang — Filipino restaurant in Camden since 1987",
    description,
    images: [{ url: "/media/hero-poster.jpg", width: 1920, height: 1080, alt: "The Bintang garden at golden hour" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2d2d2d",
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Bintang",
  description,
  url: "https://www.bintangrestaurant.co.uk",
  telephone: "+44 20 7267 2197",
  email: site.email,
  servesCuisine: ["Filipino", "Asian"],
  foundingDate: "1987",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.street,
    addressLocality: site.locality,
    postalCode: site.postcode,
    addressCountry: "GB",
  },
  openingHoursSpecification: hours
    .filter((h) => h.opens)
    .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
