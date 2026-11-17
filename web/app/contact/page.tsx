import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Contact us" };

export default function Page() {
  return <Placeholder title="Contact us" tl="Makipag-ugnayan" href="/contact" background="var(--yellow)" tone="ink" />;
}
