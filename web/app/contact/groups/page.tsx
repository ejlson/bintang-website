import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";

export const metadata: Metadata = { title: "Groups" };

export default function Page() {
  return <Placeholder title="Groups" tl="Grupo" href="/contact/groups" background="var(--yellow)" tone="ink" />;
}
