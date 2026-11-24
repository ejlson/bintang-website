import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { AboutPage } from "@/components/AboutPage";

export const metadata: Metadata = pageMeta({
  path: "/about",
  title: "About London’s oldest Filipino restaurant",
  description:
    "The story of Bintang, London’s oldest Filipino restaurant: the same kitchen on Kentish Town Road since 1987, cooking Filipino food made to share.",
  image: { url: "/media/about/history-bamboo-dining-room.jpg", width: 1600, height: 1066, alt: "The Bintang team in the old bamboo-walled dining room" },
});

export default function Page() {
  return <AboutPage />;
}
