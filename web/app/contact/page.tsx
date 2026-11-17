import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Book" };

export default function Page() {
  return <Placeholder title="Book" tl="Magpareserba" href="/contact" background="var(--yellow)" tone="ink" />;
}
