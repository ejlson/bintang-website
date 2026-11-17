import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Private hire" };

export default function Page() {
  return <Placeholder title="Private hire" tl="Pribado" href="/contact/private-hire" background="var(--yellow)" tone="ink" />;
}
