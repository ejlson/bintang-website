/**
 * The Christmas 2026 promotion (SPEC.md › Christmas 2026 promotion): the Home
 * pop-up, its corner mini and the Menu page's Christmas tab.
 *
 * Whether it is live is only ever decided in the browser, from the visitor's
 * clock (in an effect, after hydration): pages are prerendered, so a check at
 * build or render time would freeze the answer.
 */

/** The first moment the promotion is over: midnight at the start of 1 January 2027, UK time (GMT). */
export const CHRISTMAS_ENDS = Date.UTC(2027, 0, 1, 0, 0, 0);

export function isChristmasLive(now: number = Date.now()) {
  return now < CHRISTMAS_ENDS;
}

/** sessionStorage: set once the pop-up has opened by itself this visit. */
export const CHRISTMAS_PROMO_KEY = "bintang-xmas-2026";

/** Delay between the Home intro finishing (or being skipped) and the pop-up opening. */
export const PROMO_DELAY_MS = 600;

export const CHRISTMAS_ART = {
  src: "/media/promo/christmas-2026.webp",
  width: 1920,
  height: 1080,
  alt:
    "Bintang Christmas: a festive table of Filipino dishes — pancit, braised beef with plantain, rice, prawns — " +
    "among baubles and tinsel. Book your festive feast at Bintang now! Karaoke available.",
};

export const CHRISTMAS_MINI = {
  src: "/media/promo/christmas-mini.webp",
  width: 172,
  height: 172,
};
