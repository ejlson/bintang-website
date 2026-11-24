import type { Metadata } from "next";
import { jsonLdHtml, menuJsonLd, pageMeta } from "@/lib/seo";
import { MenuPage } from "@/components/MenuPage";

export const metadata: Metadata = pageMeta({
  path: "/menu",
  title: "Filipino menu & weekend brunch in Camden",
  description:
    "Bintang’s menus: à la carte Filipino plates, weekend brunch with silogs and bottomless drinks, Filipino desserts and karaoke. Kentish Town Road, Camden NW1.",
  image: { url: "/media/gallery/trays.jpg", width: 1600, height: 900, alt: "Trays from the Bintang kitchen, topped with lemon" },
});

export default function Page() {
  return (
    <>
      <MenuPage />
      {/* Every menu, not only the open tab, so search engines can read them all. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(menuJsonLd())} />
    </>
  );
}
