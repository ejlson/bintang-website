import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { KaraokePage } from "@/components/KaraokePage";

export const metadata: Metadata = pageMeta({
  path: "/contact/karaoke",
  title: "Private karaoke room & party hire in Camden",
  description:
    "Karaoke at Bintang: complimentary with every private hire of our lower ground floor on Kentish Town Road, with a £38 sharing set menu for groups.",
  image: { url: "/media/karaoke/karaoke-poster.jpg", width: 1920, height: 1080, alt: "The karaoke room at Bintang" },
});

export default function Page() {
  return <KaraokePage />;
}
