import { Hero } from "@/components/Hero";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main style={{ color: "var(--paper)" }}>
      <SiteHeader variant="overlay" tone="paper" mark="paper" currentHref="/" />
      <Hero />
    </main>
  );
}
