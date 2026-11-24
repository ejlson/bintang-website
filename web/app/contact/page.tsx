import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ContactPage } from "@/components/ContactPage";

export const metadata: Metadata = pageMeta({
  path: "/contact",
  title: "Contact & book a table in Kentish Town",
  description:
    "Book a table at Bintang, the Filipino restaurant at 93 Kentish Town Road, NW1 8NY, a short walk from Camden Town station. Open Tuesday to Sunday.",
  image: { url: "/media/about/history-halloween-shopfront.jpg", width: 1600, height: 968, alt: "Halloween outside the original Bintang shopfront" },
});

export default function Page() {
  return <ContactPage />;
}
