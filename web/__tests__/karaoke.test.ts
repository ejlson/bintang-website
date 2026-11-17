import { describe, expect, it } from "vitest";
import {
  KARAOKE,
  Spring,
  lineSchedule,
  litFraction,
  onTwos,
  syllables,
  totalDuration,
  wordTimings,
  type WordBox,
} from "@/lib/karaoke";
import { subtitleLines } from "@/lib/nav";

describe("KARAOKE timing constants (SPEC Home item 3)", () => {
  it("matches the spec: 4 dots on a 0.34s beat, 0.2s/syllable, 0.14s gap, 0.85s hold, 0.25s smear, 2.6s score, 12fps", () => {
    expect(KARAOKE).toMatchObject({
      dots: 4,
      beat: 0.34,
      syllable: 0.2,
      gap: 0.14,
      hold: 0.85,
      exit: 0.25,
      score: 2.6,
      fps: 12,
    });
  });
});

describe("syllables", () => {
  it("counts vowel groups in a word", () => {
    expect(syllables("Welcome")).toBe(3);
    expect(syllables("to")).toBe(1);
    expect(syllables("Bintang")).toBe(2);
    expect(syllables("Maligayang")).toBe(3); // y is a vowel, so "aya" is one group (rough by design)
    expect(syllables("rice,")).toBe(2); // vowel groups, not phonetic: "i", "e"
  });

  it("is case-insensitive and counts y as a vowel", () => {
    expect(syllables("BINTANG")).toBe(syllables("bintang"));
    expect(syllables("rhythm")).toBe(1);
  });

  it("gives a word with no vowels at least one beat", () => {
    expect(syllables("Hmm")).toBe(1);
    expect(syllables("!")).toBe(1);
  });

  it("counts a ♪ as one beat", () => {
    expect(syllables("♪")).toBe(1);
  });

  it("counts a year (all digits) as four", () => {
    expect(syllables("1987")).toBe(4);
    expect(syllables("7")).toBe(4);
  });
});

describe("wordTimings / totalDuration", () => {
  it("starts each word where the previous one ends, at 0.2s per syllable", () => {
    const t = wordTimings("Welcome to Bintang");
    expect(t).toHaveLength(3);
    expect(t[0].start).toBe(0);
    expect(t[0].duration).toBeCloseTo(0.6);
    expect(t[1].start).toBeCloseTo(0.6);
    expect(t[1].duration).toBeCloseTo(0.2);
    expect(t[2].start).toBeCloseTo(0.8);
    expect(t[2].duration).toBeCloseTo(0.4);
    expect(totalDuration(t)).toBeCloseTo(1.2);
  });

  it("handles ♪ and years", () => {
    const t = wordTimings("♪ Since 1987 ♪");
    expect(t.map((w) => w.duration / KARAOKE.syllable)).toEqual([1, 2, 4, 1].map((n) => expect.closeTo(n)));
    expect(totalDuration(t)).toBeCloseTo(8 * KARAOKE.syllable);
  });

  it("takes a custom per-syllable time", () => {
    const t = wordTimings("Bintang to", 1);
    expect(t).toEqual([
      { start: 0, duration: 2 },
      { start: 2, duration: 1 },
    ]);
  });

  it("totalDuration of no words is 0", () => {
    expect(totalDuration([])).toBe(0);
  });
});

describe("lineSchedule", () => {
  const { en, tl } = subtitleLines[0];

  it("orders the phases: countdown → English → gap → Tagalog → hold → smear", () => {
    const s = lineSchedule(en, tl);
    expect(s.enStart).toBeCloseTo(KARAOKE.beat * KARAOKE.dots);
    expect(s.enEnd).toBeCloseTo(s.enStart + totalDuration(wordTimings(en)));
    expect(s.tlStart).toBeCloseTo(s.enEnd + KARAOKE.gap);
    expect(s.tlEnd).toBeCloseTo(s.tlStart + totalDuration(wordTimings(tl)));
    expect(s.exitStart).toBeCloseTo(s.tlEnd + KARAOKE.hold);
    expect(s.end).toBeCloseTo(s.exitStart + KARAOKE.exit);

    const order = [s.enStart, s.enEnd, s.tlStart, s.tlEnd, s.exitStart, s.end];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("is strictly increasing for every home-page line", () => {
    for (const line of subtitleLines) {
      const s = lineSchedule(line.en, line.tl);
      expect(s.enStart).toBeGreaterThan(0);
      expect(s.enEnd).toBeGreaterThan(s.enStart);
      expect(s.tlStart).toBeGreaterThan(s.enEnd);
      expect(s.tlEnd).toBeGreaterThan(s.tlStart);
      expect(s.exitStart).toBeGreaterThan(s.tlEnd);
      expect(s.end).toBeGreaterThan(s.exitStart);
    }
  });

  it("without dots starts the wipe after 0.3s and shifts every phase by the same amount", () => {
    const withDots = lineSchedule(en, tl);
    const noDots = lineSchedule(en, tl, false);
    expect(noDots.enStart).toBeCloseTo(0.3);
    const shift = withDots.enStart - noDots.enStart;
    expect(shift).toBeCloseTo(KARAOKE.beat * KARAOKE.dots - 0.3);
    for (const k of ["enEnd", "tlStart", "tlEnd", "exitStart", "end"] as const) {
      expect(withDots[k] - noDots[k]).toBeCloseTo(shift);
    }
  });
});

describe("litFraction", () => {
  // "Welcome to Bintang": 0.6s, 0.2s, 0.4s
  const timings = wordTimings("Welcome to Bintang");
  const boxes: WordBox[] = [
    { left: 0, width: 0.5 },
    { left: 0.55, width: 0.15 },
    { left: 0.75, width: 0.25 },
  ];

  it("is 0 at (and before) the start", () => {
    expect(litFraction(0, timings, boxes)).toBe(0);
    expect(litFraction(-1, timings, boxes)).toBe(0);
  });

  it("lights part of the current word mid-word", () => {
    expect(litFraction(0.3, timings, boxes)).toBeCloseTo(0.25); // half of "Welcome"
    expect(litFraction(0.9, timings, boxes)).toBeCloseTo(0.75 + 0.25 * 0.25); // a quarter into "Bintang"
  });

  it("jumps to the next word's left edge when a word starts", () => {
    expect(litFraction(0.6 + 1e-9, timings, boxes)).toBeCloseTo(0.55);
  });

  it("is fully lit at and after the end", () => {
    expect(litFraction(totalDuration(timings), timings, boxes)).toBe(1);
    expect(litFraction(99, timings, boxes)).toBe(1);
  });

  it("is never more than 1 and never decreases over the wipe", () => {
    let prev = 0;
    for (let t = 0; t <= 1.3; t += 0.01) {
      const f = litFraction(t, timings, boxes);
      expect(f).toBeGreaterThanOrEqual(prev);
      expect(f).toBeLessThanOrEqual(1);
      prev = f;
    }
  });

  it("returns 0 with no timings or a missing box", () => {
    expect(litFraction(0.5, [], [])).toBe(0);
    expect(litFraction(0.5, timings, [])).toBe(0);
  });
});

describe("onTwos", () => {
  it("snaps down to 12fps frames by default", () => {
    expect(onTwos(0)).toBe(0);
    expect(onTwos(1 / 12 - 0.001)).toBe(0);
    expect(onTwos(1 / 12 + 0.001)).toBeCloseTo(1 / 12);
    expect(onTwos(0.5)).toBeCloseTo(0.5);
    expect(onTwos(1.01)).toBeCloseTo(1);
  });

  it("holds the same value within a frame and steps between frames", () => {
    const values = new Set<number>();
    for (let t = 0; t < 1; t += 0.001) values.add(onTwos(t));
    expect(values.size).toBe(12);
  });

  it("takes a custom frame rate", () => {
    expect(onTwos(0.74, 2)).toBe(0.5);
    expect(onTwos(0.76, 4)).toBe(0.75);
  });
});

describe("Spring", () => {
  it("converges to its target", () => {
    const s = new Spring(0.25, 1);
    for (let i = 0; i < 120; i++) s.step(1 / 60);
    expect(s.x).toBeCloseTo(1, 3);
    expect(Math.abs(s.v)).toBeLessThan(0.01);
  });

  it("overshoots on the way (pop, not ease)", () => {
    const s = new Spring(0, 1);
    let max = 0;
    for (let i = 0; i < 60; i++) max = Math.max(max, s.step(1 / 60));
    expect(max).toBeGreaterThan(1);
  });

  it("converges downwards too (countdown dot spring)", () => {
    const s = new Spring(1, 0, 700, 22);
    for (let i = 0; i < 120; i++) s.step(1 / 60);
    expect(s.x).toBeCloseTo(0, 3);
  });

  it("gives the same result for one big step as for many small ones (substeps)", () => {
    const a = new Spring(0, 1);
    const b = new Spring(0, 1);
    a.step(0.4);
    for (let i = 0; i < 50; i++) b.step(0.008);
    expect(a.x).toBeCloseTo(b.x, 6);
  });

  it("ignores zero, negative and NaN steps", () => {
    const s = new Spring(0.3, 1);
    expect(s.step(0)).toBe(0.3);
    expect(s.step(-1)).toBe(0.3);
    expect(s.step(NaN)).toBe(0.3);
    expect(s.v).toBe(0);
  });
});
