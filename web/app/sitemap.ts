import type { MetadataRoute } from "next";
import { posts } from "@/lib/journal";
import { SITE_URL } from "@/lib/seo";

// /contact/groups and /contact/private-hire stay out while they are "Coming soon" (noindex).
const pages: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/menu", priority: 0.9 },
  { path: "/contact", priority: 0.8 },
  { path: "/contact/karaoke", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/gallery", priority: 0.6 },
  { path: "/journal", priority: 0.6 },
  { path: "/privacy", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p.path}`, priority: p.priority })),
    ...posts.map((p) => ({ url: `${SITE_URL}/journal/${p.slug}`, lastModified: p.date, priority: 0.4 })),
  ];
}
