// OpenNext turns the Next build into the Cloudflare Worker (wrangler.jsonc).
//
// `npm run preview:build` pulls the CMS and then runs `opennextjs-cloudflare
// build`, which runs `buildCommand` below: `next build` only, so the CMS is
// not pulled twice. BINTANG_PREVIEW=1 makes next.config.ts send
// `X-Robots-Tag: noindex` on every page, so any OpenNext build of this site
// is kept out of search engines while `npm run build` is unaffected.
//
// @opennextjs/cloudflare is pinned in package.json (as on Café Mama): 1.20.18
// accepts Next >=16.4.5, and this site is on 16.4.6.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig({
    // For best results consider enabling R2 caching
    // See https://opennext.js.org/cloudflare/caching for more details
  }),
  buildCommand: "BINTANG_PREVIEW=1 npx next build",
};

export default config;
