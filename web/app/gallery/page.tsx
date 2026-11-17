import type { Metadata } from "next";
import { GalleryPage } from "@/components/GalleryPage";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs from Bintang, London’s oldest Filipino restaurant: the kitchen, the garden, the karaoke room and the family album since 1987.",
};

export default function Page() {
  return <GalleryPage />;
}
