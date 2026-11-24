import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// The Cloudflare preview stays out of search through its X-Robots-Tag: noindex
// header (next.config.ts, scripts/preview-noindex.mjs), not through this file.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
