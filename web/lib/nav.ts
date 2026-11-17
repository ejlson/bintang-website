export type NavLink = {
  href: string;
  en: string;
  /** Tagalog label — pending native-speaker review. */
  tl: string;
};

export const exploreLinks: NavLink[] = [
  { href: "/about", en: "About", tl: "Tungkol" },
  { href: "/menu", en: "Menu", tl: "Mga Ulam" },
  { href: "/gallery", en: "Gallery", tl: "Larawan" },
  { href: "/journal", en: "Journal", tl: "Balita" },
];

/** Table bookings go straight to OpenTable (the header's Book button). */
export const BOOKING_URL = "https://www.opentable.co.uk/r/bintang-london";

/** Enquiry pages, listed on the right of the header. */
export const bookLinks: NavLink[] = [
  { href: "/contact/karaoke", en: "Karaoke", tl: "Kantahan" },
  { href: "/contact", en: "Contact us", tl: "Makipag-ugnayan" },
];

export const allLinks: NavLink[] = [...exploreLinks, ...bookLinks];

/** The sakuga effect that lands when a line finishes (see components/Subtitles). */
export type SubtitleFx = "welcome" | "eat" | "since" | "rice" | "sing";

export type SubtitleLine = { en: string; tl: string; fx?: SubtitleFx };

export const subtitleLines: SubtitleLine[] = [
  { en: "Welcome to Bintang", tl: "Maligayang pagdating sa Bintang", fx: "welcome" },
  { en: "♪ Let’s eat! ♪", tl: "♪ Kain tayo! ♪", fx: "eat" },
  { en: "Since 1987", tl: "Simula pa noong 1987", fx: "since" },
  { en: "Pass the rice, please", tl: "Pakiabot ang kanin", fx: "rice" },
  { en: "♪ Let’s sing! ♪", tl: "♪ Kantahan na! ♪", fx: "sing" },
];
