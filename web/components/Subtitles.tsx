"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { subtitleLines, type SubtitleFx, type SubtitleLine } from "@/lib/nav";
import {
  KARAOKE,
  Spring,
  lineSchedule,
  litFraction,
  onTwos,
  wordTimings,
  type WordBox,
  type WordTiming,
} from "@/lib/karaoke";
import { loadSakuga, type SakugaFX, type SoundWord } from "@/lib/sakuga";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Subtitles.module.css";

type Props = {
  /** Freeze everything where it is (pause control). */
  paused?: boolean;
  lines?: SubtitleLine[];
  /** Show the "100 — Ang galing mo!" card after the last line. */
  scoreCard?: boolean;
};

type View = "still" | "line" | "score";

type Wipe = { el: HTMLElement; fill: HTMLElement; timings: WordTiming[]; boxes: WordBox[] };

/** Everything the animation loop owns. Lives in a ref so frames don't re-render React. */
type Run = {
  started: boolean;
  view: Exclude<View, "still">;
  line: number;
  t: number;
  /** DOM for the current line/score has been set up. */
  ready: boolean;
  fired: boolean;
  /** Exit speed lines have fired. */
  smeared: boolean;
  en: Wipe | null;
  tl: Wipe | null;
  pops: { el: HTMLElement; s: Spring }[];
  dots: (Spring | null)[];
};

const freshRun = (): Run => ({
  started: false,
  view: "line",
  line: 0,
  t: 0,
  ready: false,
  fired: false,
  smeared: false,
  en: null,
  tl: null,
  pops: [],
  dots: [],
});

function Words({ text }: { text: string }) {
  return text.split(" ").map((w, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span data-word="">{w}</span>
    </Fragment>
  ));
}

/** Word boxes as fractions of the line width, so a resize doesn't throw the wipe off. */
function measure(el: HTMLElement, text: string): Wipe | null {
  const fill = el.querySelector<HTMLElement>('[data-layer="fill"]');
  if (!fill) return null;
  const words = [...el.querySelectorAll<HTMLElement>('[data-layer="base"] [data-word]')];
  const W = el.offsetWidth;
  const boxes = words.map((w, i) =>
    W > 0 ? { left: w.offsetLeft / W, width: w.offsetWidth / W } : { left: i / words.length, width: 1 / words.length },
  );
  return { el, fill, timings: wordTimings(text), boxes };
}

const setLit = (w: Wipe, frac: number) => {
  w.fill.style.clipPath = `inset(-0.4em ${(100 - Math.min(1, Math.max(0, frac)) * 100).toFixed(2)}% -0.4em -0.4em)`;
};

/** Squash and stretch that keeps the volume: taller means thinner. */
const squash = (el: HTMLElement, y: number) => {
  el.style.transform = `scale(${(1 / Math.sqrt(Math.max(0.2, y))).toFixed(3)}, ${y.toFixed(3)})`;
};

/** Exit: stretch sideways and lean, then gone. Never a fade. */
const smear = (el: HTMLElement, k: number) => {
  const s = 1 + k * 0.6;
  el.style.transform = `translateX(${(k * 70).toFixed(1)}px) skewX(${(-k * 22).toFixed(1)}deg) scale(${s.toFixed(3)}, ${(1 / Math.sqrt(s)).toFixed(3)})`;
};

/** Effects that land at the end of a line, placed around the English line. */
function lineFx(fx: SakugaFX, kind: SubtitleFx | undefined, el: HTMLElement) {
  const end = fx.at(el, 1, 0.3);
  const mid = fx.at(el, 0.5, 0.5);
  const big = Math.min(220, Math.max(120, window.innerWidth * 0.14));
  // Keep a sound word fully on screen (narrow phones especially).
  const word = (name: SoundWord, x: number, y: number, size: number, rot: number) => {
    const half = size * 0.6;
    const lo = window.scrollX + half + 8;
    const hi = window.scrollX + window.innerWidth - half - 8;
    fx.sfx(name, Math.min(hi, Math.max(lo, x)), y, { size, rot });
  };
  switch (kind) {
    case "welcome":
      for (let i = 0; i < 4; i++)
        fx.later(i * 90, () =>
          fx.kira(mid.x - mid.w * 0.55 + Math.random() * mid.w * 1.1, mid.y - 30 + Math.random() * 50, {
            r: 10 + Math.random() * 6,
          }),
        );
      word("salamat", end.x + 40, end.y - 60, big * 0.9, -0.12);
      break;
    case "eat":
      fx.puff(end.x + 10, end.y, { n: 6, size: 15, vy: -40 });
      word("sarap", end.x + 50, end.y - 70, big, -0.16);
      break;
    case "since":
      fx.burst(end.x + 20, end.y + 6, { r: 46 });
      word("don", end.x + 60, end.y - 60, big * 0.7, -0.2);
      break;
    case "rice":
      fx.puff(mid.x, mid.y - 20, { n: 5, size: 12, vy: -30, spread: 2 });
      word("pon", end.x + 40, end.y - 54, big * 0.6, 0.1);
      break;
    case "sing":
      fx.lines(end.x + 30, end.y, { n: 9, dir: -0.4, len: 60, spread: 40, life: 0.4 });
      fx.kira(end.x + 70, end.y - 90, { r: 14 });
      word("gogo", mid.x + mid.w * 0.15, end.y - 80, big * 1.3, -0.08);
      break;
  }
}

function scoreFx(fx: SakugaFX, el: HTMLElement) {
  const c = fx.at(el, 0.5, 0.35);
  fx.burst(c.x, c.y, { r: 120, spikes: 17, life: 0.45 });
  for (let k = 0; k < 6; k++)
    fx.later(100 + k * 120, () =>
      fx.kira(c.x + (Math.random() - 0.5) * c.w * 1.3, c.y + (Math.random() - 0.5) * c.h, { r: 12 + Math.random() * 10 }),
    );
  fx.later(350, () => {
    const size = Math.min(200, window.innerWidth * 0.4);
    const x = Math.min(window.scrollX + window.innerWidth - size * 0.6 - 8, c.x + c.w * 0.45);
    fx.sfx("salamat", x, c.y - c.h * 0.45, { size, rot: -0.18 });
  });
}

/**
 * Filipino videoke subtitles, animated in the Sakuga VFX style: a countdown,
 * a word-by-word colour wipe, a sound word when the line lands, a smear out,
 * and a score card to close the loop. Decorative: the page's H1 carries the message.
 */
export function Subtitles({ paused = false, lines = subtitleLines, scoreCard = true }: Props) {
  const reducedMotion = useReducedMotion();
  const [view, setView] = useState<View>("still");
  const [index, setIndex] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  // Reduced motion (or not knowing yet) always shows the still first line.
  const still = reducedMotion !== false || view === "still";
  const shownView: View = still ? "still" : view;
  const line = lines[(still ? 0 : index) % lines.length];

  const rootRef = useRef<HTMLDivElement>(null);
  const enRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<HTMLSpanElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const fxRef = useRef<SakugaFX | null>(null);
  const visibleRef = useRef(true);
  const run = useRef<Run>(freshRun());
  const linesRef = useRef(lines);
  const scoreRefOpt = useRef(scoreCard);
  const pausedRef = useRef(paused);

  useEffect(() => {
    linesRef.current = lines;
    scoreRefOpt.current = scoreCard;
    pausedRef.current = paused;
    if (fxRef.current) fxRef.current.paused = paused;
  }, [lines, scoreCard, paused]);

  // Going still (reduced motion switched on) restarts from the top next time.
  useEffect(() => {
    if (still) run.current = freshRun();
  }, [still]);

  // Word positions must be measured in Aquavit, not the fallback.
  useEffect(() => {
    let alive = true;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const done = () => alive && setFontsReady(true);
    if (!fonts?.load) {
      void Promise.resolve().then(done);
    } else {
      const timeout = new Promise((r) => setTimeout(r, 3000));
      void Promise.race([fonts.load("700 40px aquavit").then(() => fonts.ready), timeout]).then(done, done);
    }
    return () => {
      alive = false;
    };
  }, []);

  // Effects are optional: load the core lazily, and only for visitors who get motion.
  // The core's canvas is global and fixed, so when these subtitles stop for good
  // (unmount, or reduced motion switched on) wipe it rather than leave a frozen frame.
  useEffect(() => {
    if (reducedMotion !== false) return;
    let alive = true;
    void loadSakuga().then((fx) => {
      if (!alive || !fx) return;
      fx.paused = pausedRef.current;
      fxRef.current = fx;
    });
    return () => {
      alive = false;
      const fx = fxRef.current;
      fxRef.current = null;
      if (fx) {
        fx.clear();
        fx.paused = false;
      }
    };
  }, [reducedMotion]);

  // Nothing moves while the hero is scrolled away.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = !paused && reducedMotion === false && fontsReady;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();

    const enterLine = (r: Run) => {
      const ls = linesRef.current;
      const cur = ls[r.line % ls.length];
      const en = enRef.current;
      const tl = tlRef.current;
      if (!en || !tl) return false;
      r.en = measure(en, cur.en);
      r.tl = measure(tl, cur.tl);
      if (!r.en || !r.tl) return false;
      setLit(r.en, 0);
      setLit(r.tl, 0);
      r.pops = [
        { el: en, s: new Spring(0.25, 1) },
        { el: tl, s: new Spring(0.4, 1) },
      ];
      r.dots = Array(KARAOKE.dots).fill(null);
      dotRefs.current.forEach((d) => {
        if (!d) return;
        d.style.transform = "";
        d.style.display = "";
      });
      return true;
    };

    const enterScore = (r: Run) => {
      const el = scoreRef.current;
      if (!el) return false;
      r.pops = [{ el, s: new Spring(0.1, 1) }];
      if (fxRef.current) scoreFx(fxRef.current, el);
      return true;
    };

    const advance = (r: Run) => {
      const ls = linesRef.current;
      const next = r.line + 1;
      r.t = 0;
      r.ready = false;
      r.fired = false;
      r.smeared = false;
      if (r.view === "line" && next >= ls.length && scoreRefOpt.current) {
        r.view = "score";
        setView("score");
      } else {
        r.view = "line";
        r.line = next < ls.length ? next : 0;
        setView("line");
        setIndex(r.line);
      }
    };

    const step = (dt: number) => {
      const r = run.current;
      const root = rootRef.current;
      if (!root) return;
      if (!r.started) {
        r.started = true;
        r.view = "line";
        r.line = 0;
        setView("line");
        setIndex(0);
        return;
      }
      // Wait until React has rendered what the loop expects.
      if (root.dataset.view !== r.view || (r.view === "line" && root.dataset.line !== String(r.line))) return;
      if (!r.ready) {
        r.ready = r.view === "line" ? enterLine(r) : enterScore(r);
        if (!r.ready) return;
      }
      r.t += dt;
      const t = r.t;

      if (r.view === "score") {
        const [pop] = r.pops;
        if (t < KARAOKE.score) squash(pop.el, pop.s.step(dt));
        else {
          smear(pop.el, Math.min(1, onTwos(t - KARAOKE.score) / KARAOKE.exit));
          if (t - KARAOKE.score >= KARAOKE.exit) {
            pop.el.style.transform = "";
            r.line = -1; // advance() wraps to the first line
            r.view = "line";
            advance(r);
          }
        }
        return;
      }

      const ls = linesRef.current;
      const cur = ls[r.line % ls.length];
      const S = lineSchedule(cur.en, cur.tl);
      const en = r.en!;
      const tl = r.tl!;

      if (t < S.exitStart) for (const p of r.pops) squash(p.el, p.s.step(dt));

      // Countdown dots pop away one per beat.
      dotRefs.current.forEach((d, k) => {
        if (!d) return;
        if (!r.dots[k] && t >= (k + 1) * KARAOKE.beat) r.dots[k] = new Spring(1, 0, 700, 22);
        const s = r.dots[k];
        if (!s) return;
        const v = Math.max(0, s.step(dt));
        d.style.transform = `scale(${v.toFixed(3)})`;
        // Once popped, take it out of the row so the remaining dots re-centre.
        if (v < 0.02) d.style.display = "none";
      });

      const tq = onTwos(t);
      setLit(en, litFraction(tq - S.enStart, en.timings, en.boxes));
      setLit(tl, litFraction(tq - S.tlStart, tl.timings, tl.boxes));

      if (!r.fired && t >= S.tlEnd) {
        r.fired = true;
        if (fxRef.current) lineFx(fxRef.current, cur.fx, en.el);
      }

      if (t >= S.exitStart) {
        // Speed lines trail the smear, starting with it.
        if (!r.smeared) {
          r.smeared = true;
          const fx = fxRef.current;
          if (fx) {
            const c = fx.at(en.el, 0, 0.5);
            fx.lines(c.x, c.y + 10, { n: 6, dir: Math.PI, len: 50, spread: 50, life: KARAOKE.exit });
          }
        }
        const k = Math.min(1, onTwos(t - S.exitStart) / KARAOKE.exit);
        smear(en.el, k);
        smear(tl.el, k);
        if (t >= S.end) advance(r);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visibleRef.current) step(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={`${styles.subtitles} ${still ? styles.still : ""}`}
      aria-hidden="true"
      data-testid="subtitles"
      data-view={shownView}
      data-line={still ? 0 : index}
    >
      {/* Remount on still ↔ live so no inline animation styles carry over. */}
      <div key={still ? "still" : "live"} hidden={shownView === "score"}>
        <p className={`${styles.row} ${styles.en}`}>
          <span ref={enRef} className={styles.line}>
            <span className={styles.layer} data-layer="base" data-testid="subtitle-en">
              <Words text={line.en} />
            </span>
            <span className={`${styles.layer} ${styles.fill}`} data-layer="fill">
              <Words text={line.en} />
            </span>
            {!still && (
              <span className={styles.dots}>
                {Array.from({ length: KARAOKE.dots }, (_, k) => (
                  <span
                    key={k}
                    className={styles.dot}
                    ref={(el) => {
                      dotRefs.current[k] = el;
                    }}
                  />
                ))}
              </span>
            )}
          </span>
        </p>
        <p className={`${styles.row} ${styles.tl}`}>
          <span ref={tlRef} className={styles.line}>
            <span className={styles.layer} data-layer="base" data-testid="subtitle-tl">
              <Words text={line.tl} />
            </span>
            <span className={`${styles.layer} ${styles.fill}`} data-layer="fill">
              <Words text={line.tl} />
            </span>
          </span>
        </p>
      </div>

      {shownView === "score" && (
        <div className={styles.score} data-testid="subtitle-score">
          <span ref={scoreRef} className={styles.scoreIn}>
            <span className={styles.num}>100</span>
            <span className={styles.msg}>
              Ang galing mo!
              <small>You’re a star!</small>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
