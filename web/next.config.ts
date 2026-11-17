import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Hide the on-screen route indicator in dev; errors still surface.
  devIndicators: false,
};

export default nextConfig;
