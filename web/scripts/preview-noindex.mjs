/* Static files (photos, video, _next/static) on the Cloudflare preview are
 * served straight from the assets binding and never reach Next, so its
 * headers do not apply to them. A `_headers` file in the built assets gives
 * them `X-Robots-Tag: noindex` too. Runs after `opennextjs-cloudflare build`
 * (npm run preview:build); public/ and `npm run build` are untouched.
 */
import fs from "node:fs";
import path from "node:path";

const assets = path.resolve(import.meta.dirname, "..", ".open-next", "assets");
if (!fs.existsSync(assets)) throw new Error("preview-noindex: no .open-next/assets; run opennextjs-cloudflare build first");
fs.writeFileSync(path.join(assets, "_headers"), "/*\n  X-Robots-Tag: noindex\n");
console.log("preview-noindex: wrote .open-next/assets/_headers");
