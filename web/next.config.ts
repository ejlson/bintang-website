import type { NextConfig } from "next";
import archive from "./lib/journal.archive.json";

/** Set by the Cloudflare preview build (open-next.config.ts), never by `npm run build`. */
const preview = process.env.BINTANG_PREVIEW === "1";

const nextConfig: NextConfig = {
  /* Off in the Cloudflare preview build: OpenNext does not support Cache
     Components yet (opennextjs-cloudflare PR #1318), and with them on the
     Worker hangs on every request. Every page here is prerendered anyway. */
  cacheComponents: !preview,
  partialPrefetching: !preview,
  // Hide the on-screen route indicator in dev; errors still surface.
  devIndicators: false,
  // Lets a phone on the same Wi-Fi load the dev server from the Mac's LAN
  // address (dev only; ignored by builds). Update if the Mac's IP changes.
  allowedDevOrigins: ["192.168.1.149"],
  // 301s from the old Squarespace site's URLs, so links and search rankings carry over.
  redirects: async () => [
    { source: "/home", destination: "/", permanent: true },
    { source: "/menus0", destination: "/menu", permanent: true },
    { source: "/menus", destination: "/menu", permanent: true },
    { source: "/reservations", destination: "/contact", permanent: true },
    // Groups and private hire have no pages of their own: the Contact page takes both enquiries.
    { source: "/large-group-bookings", destination: "/contact", permanent: true },
    { source: "/karaoke", destination: "/contact/karaoke", permanent: true },
    { source: "/private-hires", destination: "/contact", permanent: true },
    {
      source: "/blog/2023/9/11/londons-best-new-cocktail-bintangs-clarified-ube-colada",
      destination: "/journal/bintang-clarified-ube-colada",
      permanent: true,
    },
    // The old blog's evergreen posts, ported in full (lib/journal.ts). Before the catch-all.
    ...archive.posts.map((p) => ({ source: p.oldPath, destination: `/journal/${p.slug}`, permanent: true })),
    // Everything else from the old blog (seasonal offers, tag and category pages).
    { source: "/blog/:path*", destination: "/journal", permanent: true },
  ],
  // The preview on workers.dev must never be indexed.
  ...(preview
    ? { headers: async () => [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] }] }
    : {}),
};

export default nextConfig;
