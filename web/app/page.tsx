import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
// The CSS module itself, not HomeTitle's introClasses: this is a server
// component, and exports of a client module arrive here as references.
import introStyles from "@/components/HomeTitle.module.css";
import { SiteHeader } from "@/components/SiteHeader";
import { HOME_IMAGE, HOME_TITLE, ogBase, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...ogBase, type: "website", url: "/", title: HOME_TITLE, description: SITE_DESCRIPTION, images: [HOME_IMAGE] },
};

export default function Home() {
  return (
    <main className={introStyles.home} style={{ color: "var(--paper)" }}>
      <SiteHeader variant="overlay" tone="paper" mark="paper" wordmark currentHref="/" />
      <Hero />
    </main>
  );
}
