import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { JournalPage } from "@/components/JournalPage";

export const metadata: Metadata = pageMeta({
  path: "/journal",
  title: "Journal",
  description:
    "News, stories and the family album from Bintang, London’s oldest Filipino restaurant, on Kentish Town Road.",
});

export default function Page() {
  return <JournalPage />;
}
