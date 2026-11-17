import { Hero } from "@/components/Hero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main style={{ color: "var(--paper)" }}>
      <SiteHeader variant="overlay" tone="paper" mark="paper" currentHref="/" />
      <Hero />
      <SiteFooter />
    </main>
  );
}
