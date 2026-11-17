import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Gallery" };

export default function Page() {
  return <Placeholder title="Gallery" tl="Larawan" href="/gallery" background="var(--ink)" tone="paper" />;
}
