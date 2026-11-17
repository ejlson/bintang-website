import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <Placeholder title="About" tl="Tungkol" href="/about" background="var(--red-deep)" tone="paper" />;
}
