/* Pull the Journal from the Maginhawa Group's shared Sanity CMS.
 *
 * Asks for every post that mentions Bintang (tagged "bintang", or the word
 * in its title, summary or text), downloads each post's main photo into
 * public/cms/, and writes lib/journal.snapshot.json, which lib/journal.ts
 * reads. Same arrangement as the group site's and BUNSO's pull scripts.
 *
 * The snapshot and photos are committed, so the site, its tests and `next
 * dev` work offline and visitors never touch Sanity. `npm run build` pulls
 * first so a deploy carries the latest posts; it fails loudly if the CMS
 * can't be reached rather than shipping an old journal without saying so.
 *
 * Only downloads from Sanity's image host for this project, only WebP/JPEG,
 * only up to MAX_BYTES, never follows a redirect, and names every file after
 * Sanity's content hash, so nothing typed in the Studio picks a URL or path.
 *
 *   npm run pull-cms
 *   SKIP_CMS_PULL=1 npm run build    builds from the committed snapshot (Sanity down)
 */
import fs from "node:fs/promises";
import path from "node:path";
import cms from "../lib/cms.json" with { type: "json" };

if (process.env.SKIP_CMS_PULL === "1") {
  console.log("pull-cms: SKIP_CMS_PULL=1, using the committed snapshot.");
  process.exit(0);
}

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGE_DIR = path.join(ROOT, cms.imageDir);
// Photos land here and replace the old set only once every one has arrived.
const WORK_DIR = `${IMAGE_DIR}.partial`;
const SNAPSHOT = path.join(ROOT, cms.snapshot);
const CDN = `https://cdn.sanity.io/images/${cms.project}/${cms.dataset}/`;
const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = { "image/webp": "webp", "image/jpeg": "jpg" };
/** Saved width; next/image resizes from here. */
const WIDTH = 1600;

async function query() {
  const url = new URL(`https://${cms.project}.api.sanity.io/v${cms.apiVersion}/data/query/${cms.dataset}`);
  url.searchParams.set("query", cms.query);
  url.searchParams.set("perspective", "published");
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Sanity query failed (${res.status}): ${await res.text()}`);
  return (await res.json()).result;
}

/** "image-374db48…-1600x1067-jpg" -> "374db48…". Anything else is refused. */
function hashOf(asset) {
  const m = /^image-([a-f0-9]{20,64})-\d+x\d+-[a-z]+$/.exec(asset?._id ?? "");
  if (!m) throw new Error(`pull-cms: unexpected image id ${JSON.stringify(asset?._id)}`);
  if (!asset.url?.startsWith(CDN)) throw new Error(`pull-cms: image not on ${CDN}: ${asset.url}`);
  return m[1];
}

const images = new Map();
async function localImage(asset) {
  if (images.has(asset._id)) return images.get(asset._id);
  const hash = hashOf(asset);
  // Never wider than the original: Sanity would upscale.
  const w = Math.min(WIDTH, asset.w);
  const url = `${asset.url}?${new URLSearchParams({ w: String(w), fm: "webp", q: "80" })}`;
  const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`pull-cms: ${res.status} for ${url}`);
  if (Number(res.headers.get("content-length")) > MAX_BYTES) throw new Error(`pull-cms: ${url} is too large`);
  const ext = TYPES[(res.headers.get("content-type") ?? "").split(";")[0]];
  if (!ext) throw new Error(`pull-cms: ${url} is ${res.headers.get("content-type")}, not WebP/JPEG`);
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > MAX_BYTES) throw new Error(`pull-cms: ${url} is ${body.length} bytes`);
  const file = `${hash}.${ext}`;
  await fs.writeFile(path.join(WORK_DIR, file), body);
  const image = { src: `${cms.imagePath}/${file}`, width: w, height: Math.round((asset.h * w) / asset.w) };
  images.set(asset._id, image);
  return image;
}

const KINDS = new Set(["ours", "press", "link"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Everything lib/journal.ts relies on, checked before anything on disk changes. */
function check(p) {
  const where = `pull-cms: "${p.slug}"`;
  if (!SLUG.test(p.slug ?? "")) throw new Error(`pull-cms: bad slug ${JSON.stringify(p.slug)}`);
  if (!DATE.test(p.date ?? "")) throw new Error(`${where} has no YYYY-MM-DD date`);
  if (!p.title?.trim()) throw new Error(`${where} has no title`);
  if (!p.summary?.trim()) throw new Error(`${where} has no summary`);
  if (!KINDS.has(p.kind)) throw new Error(`${where} has unknown kind ${JSON.stringify(p.kind)}`);
  if (p.kind !== "ours" && !p.url?.startsWith("https://")) throw new Error(`${where} has no https link`);
  if (p.kind === "press" && !p.outlet) throw new Error(`${where} has no publication`);
  hashOf(p.image?.asset);
}

async function pull() {
  const posts = await query();
  /* An empty answer is far more likely a broken query or a private dataset
     than a journal with nothing in it, and an empty snapshot also fails
     `next build` (the post route must prerender at least one page). */
  if (!Array.isArray(posts) || posts.length === 0) throw new Error("pull-cms: the CMS returned no posts; keeping the last snapshot.");
  posts.forEach(check);
  await fs.rm(WORK_DIR, { recursive: true, force: true });
  await fs.mkdir(WORK_DIR, { recursive: true });

  const shaped = [];
  for (const p of posts) {
    shaped.push({
      kind: p.kind,
      slug: p.slug,
      title: p.title,
      date: p.date,
      summary: p.summary,
      restaurants: p.restaurants ?? [],
      category: p.category ?? null,
      url: p.url ?? null,
      outlet: p.outlet ?? null,
      image: { ...(await localImage(p.image.asset)), alt: p.image.alt ?? "" },
    });
  }

  // Write the new snapshot beside the old one first, so the swap below is two quick renames.
  await fs.writeFile(`${SNAPSHOT}.partial`, `${JSON.stringify({ posts: shaped }, null, 2)}\n`);
  await fs.rm(IMAGE_DIR, { recursive: true, force: true });
  await fs.rename(WORK_DIR, IMAGE_DIR);
  await fs.rename(`${SNAPSHOT}.partial`, SNAPSHOT);
  console.log(`pull-cms: ${shaped.length} posts, ${images.size} photos -> ${cms.imageDir}`);
}

try {
  await pull();
} finally {
  // A failed pull leaves the last good set alone and nothing half-written in public/.
  await fs.rm(WORK_DIR, { recursive: true, force: true });
  await fs.rm(`${SNAPSHOT}.partial`, { force: true });
}
