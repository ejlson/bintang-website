import type { NextConfig } from "next";

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
    { source: "/large-group-bookings", destination: "/contact/groups", permanent: true },
    { source: "/karaoke", destination: "/contact/karaoke", permanent: true },
    { source: "/private-hires", destination: "/contact/private-hire", permanent: true },
    {
      source: "/blog/2023/9/11/londons-best-new-cocktail-bintangs-clarified-ube-colada",
      destination: "/journal/bintang-clarified-ube-colada",
      permanent: true,
    },
    { source: "/blog/:path*", destination: "/journal", permanent: true },
  ],
  // The preview on workers.dev must never be indexed.
  ...(preview
    ? { headers: async () => [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] }] }
    : {}),
};

export default nextConfig;
