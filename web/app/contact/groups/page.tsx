import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
import { pageMeta } from "@/lib/seo";

// Not indexed while the page only says "Coming soon"; drop `robots` when it has real content.
export const metadata: Metadata = {
  ...pageMeta({ path: "/contact/groups", title: "Groups", description: "Group dining and large bookings at Bintang, London’s oldest Filipino restaurant on Kentish Town Road, Camden." }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <Placeholder title="Groups" tl="Grupo" href="/contact/groups" background="var(--yellow)" tone="ink" />;
}
