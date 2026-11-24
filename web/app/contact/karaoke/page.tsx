import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { KaraokePage } from "@/components/KaraokePage";

export const metadata: Metadata = pageMeta({
  path: "/contact/karaoke",
  title: "Private karaoke room & party hire in Kentish Town",
  description:
    "Private karaoke room in Kentish Town for parties: hire Bintang’s lower ground floor with karaoke included and a £38 per head Filipino sharing menu for groups.",
  image: { url: "/media/karaoke/karaoke-poster.jpg", width: 1920, height: 1080, alt: "The karaoke room at Bintang" },
});

export default function Page() {
  return <KaraokePage />;
}
