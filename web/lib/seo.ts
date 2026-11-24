/**
 * Search and social metadata shared by every page: the canonical origin,
 * per-page canonical + Open Graph, and the JSON-LD builders.
 *
 * Metadata merges shallowly in Next, so a page that sets `openGraph` replaces
 * the layout's whole object; `pageMeta` restates the site-wide fields.
 */
import type { Metadata } from "next";
import { menus } from "./menu";
import snapshot from "./menu.snapshot.json";
import type { MenuSnapshot, SnapshotItem } from "./menu";
import type { JournalPost } from "./journal";

export const SITE_URL = "https://www.bintangrestaurant.co.uk";

export type OgImage = { url: string; width: number; height: number; alt: string };

export const HOME_IMAGE: OgImage = {
  url: "/media/hero-poster.jpg",
  width: 1920,
  height: 1080,
  alt: "The Bintang garden at golden hour",
};

export const ogBase = { siteName: "Bintang", locale: "en_GB" } as const;

export const HOME_TITLE = "Bintang | Filipino restaurant in Camden, London since 1987";
export const SITE_DESCRIPTION =
  "London’s oldest Filipino restaurant. Filipino home cooking made for sharing, private karaoke and a garden on Kentish Town Road, Camden — since 1987.";

/** Title, description, canonical and a matching Open Graph card for one page. */
export function pageMeta(opts: {
  path: string;
  title: string;
  description: string;
  image?: OgImage;
  /** The Open Graph / Twitter title. Defaults to `${title} · Bintang`, matching the tab title the layout's template makes. */
  socialTitle?: string;
}): Metadata {
  const { path, title, description, image = HOME_IMAGE } = opts;
  const socialTitle = opts.socialTitle ?? `${title} · Bintang`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...ogBase, type: "website", url: path, title: socialTitle, description, images: [image] },
  };
}

/** Wraps JSON-LD for a <script type="application/ld+json">, with `<` escaped. */
export function jsonLdHtml(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/* ---------- JSON-LD ---------- */

const DIET: Record<string, string> = {
  v: "https://schema.org/VegetarianDiet",
  ve: "https://schema.org/VeganDiet",
  gf: "https://schema.org/GlutenFreeDiet",
};

/** First number in a price string: "32 / 8" (bottle / glass) → "32", "38 pp" → "38". */
function firstPrice(p?: string) {
  return p?.match(/\d+(\.\d+)?/)?.[0];
}

function menuItem(i: SnapshotItem) {
  const price = firstPrice(i.price);
  const diets = (i.dietary ?? []).map((d) => DIET[d]).filter(Boolean);
  return {
    "@type": "MenuItem",
    name: i.name,
    ...(i.description ? { description: i.description } : {}),
    ...(diets.length ? { suitableForDiet: diets } : {}),
    ...(price ? { offers: { "@type": "Offer", price, priceCurrency: "GBP" } } : {}),
  };
}

/** Every menu (not only the open tab) as schema.org Menu, for /menu. */
export function menuJsonLd() {
  const snap = snapshot as MenuSnapshot;
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${SITE_URL}/menu#menu`,
    name: "Bintang menus",
    url: `${SITE_URL}/menu`,
    inLanguage: "en-GB",
    hasMenuSection: snap.menus.map((m, idx) => ({
      "@type": "MenuSection",
      name: menus[idx]?.label ?? m.title,
      hasMenuSection: m.sections.map((s) => ({
        "@type": "MenuSection",
        name: s.title,
        ...(s.intro ? { description: s.intro } : {}),
        hasMenuItem: s.items.filter((i) => !i.hide).map(menuItem),
      })),
    })),
  };
}

export function breadcrumbJsonLd(items: [name: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  };
}

/** Article markup for a journal post. None for press: that article belongs to the newspaper. */
export function articleJsonLd(post: JournalPost) {
  if (post.kind === "press") return null;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title.slice(0, 110),
    description: post.excerpt,
    datePublished: post.date,
    image: [`${SITE_URL}${post.image.src}`],
    mainEntityOfPage: `${SITE_URL}/journal/${post.slug}`,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@id": `${SITE_URL}/#restaurant` },
    ...(post.readMore ? { isBasedOn: post.readMore.href } : {}),
  };
}
