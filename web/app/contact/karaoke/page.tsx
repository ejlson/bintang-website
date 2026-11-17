import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Karaoke" };

export default function Page() {
  return <Placeholder title="Karaoke" tl="Kantahan" href="/contact/karaoke" background="var(--yellow)" tone="ink" />;
}
