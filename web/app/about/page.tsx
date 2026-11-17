import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "Bintang is London’s oldest Filipino restaurant: the same kitchen on Kentish Town Road since 1987, Filipino favourites made to be shared.",
};

export default function Page() {
  return <AboutPage />;
}
