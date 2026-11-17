import { Hero } from "@/components/Hero";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main>
      <SiteHeader variant="overlay" tone="paper" mark="paper" currentHref="/" />
      <Hero />
    </main>
  );
}
