import type { NextConfig } from "next";

/** Set by the Cloudflare preview build (open-next.config.ts), never by `npm run build`. */
const preview = process.env.BINTANG_PREVIEW === "1";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Hide the on-screen route indicator in dev; errors still surface.
  devIndicators: false,
  // The preview on workers.dev must never be indexed.
  ...(preview
    ? { headers: async () => [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] }] }
    : {}),
};

export default nextConfig;
