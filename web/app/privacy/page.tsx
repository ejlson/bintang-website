import type { Metadata } from "next";
import { PrivacyPage } from "@/components/PrivacyPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/privacy",
  title: "Privacy notice",
  description:
    "How the Bintang website handles your data: no forms, no tracking and no cookies, plus what we do when you email or call us.",
});

export default function Privacy() {
  return <PrivacyPage />;
}
