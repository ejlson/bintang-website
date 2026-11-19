import type { Metadata } from "next";
import { KaraokePage } from "@/components/KaraokePage";

export const metadata: Metadata = {
  title: "Karaoke",
  description:
    "Karaoke at Bintang: complimentary with every private hire of our lower ground floor on Kentish Town Road, with a £38 sharing set menu for groups.",
};

export default function Page() {
  return <KaraokePage />;
}
