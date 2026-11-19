import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards on the page motion CSS. jsdom can't run CSS animations, let alone scroll-driven
 * ones, so these read the stylesheets as text and check the rules the motion relies on:
 * - every animation sits inside @media (prefers-reduced-motion: no-preference), so a
 *   reduced-motion visitor gets a still page;
 * - every scroll/view timeline sits inside @supports (animation-timeline: ...), so a
 *   browser without scroll timelines never runs a scroll animation as a timed one;
 * - every animation names a @keyframes in the same file (CSS modules scope keyframes
 *   per file, so a name defined only in another module silently does nothing).
 */

const FILES = ["AboutPage.module.css", "JournalPage.module.css", "MenuPage.module.css"];

const css = (file: string) => readFileSync(join(process.cwd(), "components", file), "utf8");

type Decl = { prop: string; value: string; context: string[] };

/** Every declaration in the sheet, with the preludes of the blocks around it (outermost first). */
function declarations(source: string): Decl[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Decl[] = [];
  const stack: string[] = [];
  let buf = "";
  const flush = () => {
    const d = buf.trim();
    buf = "";
    const colon = d.indexOf(":");
    if (!d || d.startsWith("@") || colon < 0) return;
    out.push({ prop: d.slice(0, colon).trim(), value: d.slice(colon + 1).trim(), context: [...stack] });
  };
  for (const ch of text) {
    if (ch === "{") {
      stack.push(buf.trim());
      buf = "";
    } else if (ch === "}") {
      flush();
      stack.pop();
    } else if (ch === ";") {
      flush();
    } else {
      buf += ch;
    }
  }
  return out;
}

const inKeyframes = (d: Decl) => d.context.some((c) => c.startsWith("@keyframes"));
const reducedMotionSafe = (d: Decl) =>
  d.context.some((c) => /^@media\b.*prefers-reduced-motion:\s*no-preference/.test(c));
const timelineSupported = (d: Decl) => d.context.some((c) => /^@supports\s*\(\s*animation-timeline:/.test(c));

const KEYWORDS = new Set([
  "linear", "ease", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end",
  "both", "forwards", "backwards", "none", "infinite", "normal", "reverse", "alternate",
  "alternate-reverse", "running", "paused",
]);

/** The keyframes names an `animation` shorthand or `animation-name` refers to. */
function animationNames(d: Decl): string[] {
  const value = d.value.replace(/[a-z-]+\([^)]*\)/g, " ");
  return value.split(",").flatMap((part) =>
    part
      .trim()
      .split(/\s+/)
      .filter((t) => /^-?[a-zA-Z_][\w-]*$/.test(t) && !KEYWORDS.has(t)),
  );
}

describe.each(FILES)("%s motion", (file) => {
  const decls = declarations(css(file)).filter((d) => !inKeyframes(d));
  const animations = decls.filter((d) => d.prop === "animation" || d.prop === "animation-name");
  const timelines = decls.filter((d) => d.prop === "animation-timeline" || d.prop === "view-timeline");

  it("has motion to guard", () => {
    expect(animations.length).toBeGreaterThan(0);
    expect(timelines.length).toBeGreaterThan(0);
  });

  it("only animates for visitors who haven't asked for reduced motion", () => {
    const loose = animations.filter((d) => !reducedMotionSafe(d)).map((d) => `${d.context.join(" > ")} { ${d.prop}: ${d.value} }`);
    expect(loose).toEqual([]);
  });

  it("keeps every scroll timeline behind @supports (animation-timeline) and reduced-motion guards", () => {
    const loose = timelines
      .filter((d) => !timelineSupported(d) || !reducedMotionSafe(d))
      .map((d) => `${d.context.join(" > ")} { ${d.prop}: ${d.value} }`);
    expect(loose).toEqual([]);
  });

  it("defines every keyframes it uses in the same file", () => {
    const defined = new Set(Array.from(css(file).matchAll(/@keyframes\s+([\w-]+)/g), (m) => m[1]));
    const used = new Set(animations.flatMap(animationNames));
    expect(used.size).toBeGreaterThan(0);
    expect([...used].filter((n) => !defined.has(n))).toEqual([]);
  });
});
