/**
 * Timing for the Home page's videoke subtitles. Pure functions, no DOM:
 * the component measures word positions and asks these when to light them.
 */

/** Seconds. */
export const KARAOKE = {
  /** One countdown dot. */
  beat: 0.34,
  dots: 4,
  /** Wipe time per syllable. */
  syllable: 0.2,
  /** English finished → Tagalog starts. */
  gap: 0.14,
  /** Line fully lit while its effect plays. */
  hold: 0.85,
  /** Smear out. */
  exit: 0.25,
  /** Score card on screen, before its own exit. */
  score: 2.6,
  /** Animation frame rate for the wipe and smear ("on twos"). */
  fps: 12,
} as const;

/** Rough syllable count: vowel groups, a ♪ is one beat, a year is four ("nineteen eighty-seven"). */
export function syllables(word: string): number {
  if (word === "♪") return 1;
  if (/^\d+$/.test(word)) return 4;
  return Math.max(1, (word.toLowerCase().match(/[aeiouy]+/g) ?? []).length);
}

export type WordTiming = { start: number; duration: number };

/** When each word of a line starts and how long its wipe lasts, from the line's own start. */
export function wordTimings(text: string, perSyllable: number = KARAOKE.syllable): WordTiming[] {
  let t = 0;
  return text.split(" ").map((w) => {
    const duration = syllables(w) * perSyllable;
    const timing = { start: t, duration };
    t += duration;
    return timing;
  });
}

export const totalDuration = (timings: WordTiming[]) =>
  timings.length ? timings[timings.length - 1].start + timings[timings.length - 1].duration : 0;

/**
 * Seconds from a line's start at which each phase begins.
 *   0 → enStart: countdown · enStart → enEnd: English wipe · tlStart → tlEnd: Tagalog wipe
 *   tlEnd: effect fires · exitStart → end: smear out
 */
export function lineSchedule(en: string, tl: string, withDots = true) {
  const enStart = withDots ? KARAOKE.beat * KARAOKE.dots : 0.3;
  const enEnd = enStart + totalDuration(wordTimings(en));
  const tlStart = enEnd + KARAOKE.gap;
  const tlEnd = tlStart + totalDuration(wordTimings(tl));
  const exitStart = tlEnd + KARAOKE.hold;
  return { enStart, enEnd, tlStart, tlEnd, exitStart, end: exitStart + KARAOKE.exit };
}

/** Word edges as fractions (0–1) of the line's width. */
export type WordBox = { left: number; width: number };

/**
 * How much of a line is lit (0–1) `t` seconds into its wipe: whole words before
 * the current one, plus the sung part of the current word.
 */
export function litFraction(t: number, timings: WordTiming[], boxes: WordBox[]): number {
  if (t <= 0 || !timings.length) return 0;
  for (let i = 0; i < timings.length; i++) {
    const { start, duration } = timings[i];
    if (t < start + duration) {
      const box = boxes[i];
      if (!box) return 0;
      return box.left + box.width * Math.max(0, (t - start) / duration);
    }
  }
  return 1;
}

/** Snap time to the animation frame rate, so motion steps like hand-drawn frames. */
export const onTwos = (t: number, fps: number = KARAOKE.fps) => Math.floor(t * fps) / fps;

/**
 * A damped spring (same maths as the Sakuga VFX core): overshoots and settles
 * instead of stopping dead. k = stiffness, d = damping.
 */
export class Spring {
  v = 0;
  constructor(
    public x: number,
    public to: number,
    public k = 560,
    public d = 16,
  ) {}
  step(dt: number): number {
    if (!(dt > 0)) return this.x;
    for (let n = Math.ceil(dt / 0.008), h = dt / n; n--; ) {
      this.v += (-this.k * (this.x - this.to) - this.d * this.v) * h;
      this.x += this.v * h;
    }
    return this.x;
  }
}
