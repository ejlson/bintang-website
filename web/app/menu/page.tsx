import type { Metadata } from "next";
import { jsonLdHtml, menuJsonLd, pageMeta } from "@/lib/seo";
import { MenuPage } from "@/components/MenuPage";

export const metadata: Metadata = pageMeta({
  path: "/menu",
  title: "Filipino menu & weekend brunch in Kentish Town",
  description:
    "Bintang’s Filipino menu in Kentish Town, London: sharing plates like kare-kare and sisig, weekend brunch with silogs and bottomless drinks, and ube desserts.",
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
