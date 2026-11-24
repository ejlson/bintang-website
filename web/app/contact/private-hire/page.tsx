import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
import { pageMeta } from "@/lib/seo";

// Not indexed while the page only says "Coming soon"; drop `robots` when it has real content.
export const metadata: Metadata = {
  ...pageMeta({ path: "/contact/private-hire", title: "Private hire", description: "Private hire of Bintang’s lower ground floor on Kentish Town Road, Camden, with complimentary karaoke." }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <Placeholder title="Private hire" tl="Pribado" href="/contact/private-hire" background="var(--yellow)" tone="ink" />;
}
