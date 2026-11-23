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
  // The preview on workers.dev must never be indexed.
  ...(preview
    ? { headers: async () => [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] }] }
    : {}),
};

export default nextConfig;
