import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { GalleryPage } from "@/components/GalleryPage";

export const metadata: Metadata = pageMeta({
  path: "/gallery",
  title: "Photos of our Filipino restaurant in Kentish Town",
  description:
    "Photos of Bintang, London’s oldest Filipino restaurant in Kentish Town: Filipino dishes, the garden, the karaoke room and the family album since 1987.",
  image: { url: "/media/gallery/garden.jpg", width: 1600, height: 900, alt: "The Bintang garden at golden hour" },
});

export default function Page() {
  return <GalleryPage />;
}
