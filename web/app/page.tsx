import { Hero } from "@/components/Hero";
// The CSS module itself, not HomeTitle's introClasses: this is a server
// component, and exports of a client module arrive here as references.
import introStyles from "@/components/HomeTitle.module.css";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main className={introStyles.home} style={{ color: "var(--paper)" }}>
      <SiteHeader variant="overlay" tone="paper" mark="paper" wordmark currentHref="/" />
      <Hero />
    </main>
  );
}
