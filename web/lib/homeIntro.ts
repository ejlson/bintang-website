/**
 * The Home loader and title intro ("Welcome to Bintang", poster cut) show once
 * per browser session, never for reduced motion. The state lives on
 * <html data-home-intro>:
 *   "load" — the loader (red lion, tail swinging, red ring) holds on black
 *            until the site is ready;
 *   "play" — the rest of the sequence in HomeTitle.module.css runs, timed from
 *            when it was set (data-home-intro-at);
 *   "skip" — the intro is hidden and the hero shows as it ends (also its end state);
 *   unset  — not decided yet (no JS, or a page other than Home loaded first).
 */
export type IntroState = "load" | "play" | "skip";

export const INTRO_KEY = "bintang-home-intro";
/** From "play" to finished: the title is gone by 6.3s, the header and controls are in by 6.45s. */
export const INTRO_MS = 6500;
/** The loader shows for at least this long (the lion has dissolved in and the ring drawn on)… */
export const LOAD_MIN_MS = 1600;
/** …and at most this long, however slow the network (or if a script never runs). */
export const LOAD_MAX_MS = 8000;
/** After the page has loaded, how long to wait for the hero film's first frame. */
export const VIDEO_WAIT_MS = 2500;

/** Move from the loader to the sequence, if still loading; records when. */
export function startPlay(): void {
  const root = document.documentElement;
  if (root.dataset.homeIntro !== "load") return;
  root.dataset.homeIntroAt = String(performance.now());
  root.dataset.homeIntro = "play";
}

/**
 * Decide and record it. Same rules as INTRO_SCRIPT below, for when Home is
 * reached by a client-side navigation and that script never ran for it.
 */
export function decideIntro(): Exclude<IntroState, "play"> {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "skip";
    if (window.sessionStorage.getItem(INTRO_KEY)) return "skip";
    window.sessionStorage.setItem(INTRO_KEY, "1");
    return "load";
  } catch {
    // Storage blocked: we couldn't stop it replaying on every visit, so don't play it.
    return "skip";
  }
}

/**
 * Runs in <head> before the first paint on a full page load of Home, so the
 * loader is up from the very first frame (no flash of the hero underneath).
 * It also decides when loading is done, without waiting for React: once the
 * page has loaded (scripts, styles, fonts) and the hero film has a frame to
 * show (or VIDEO_WAIT_MS after that), and the loader has shown for
 * LOAD_MIN_MS; and never later than LOAD_MAX_MS, so it can't get stuck.
 */
export const INTRO_SCRIPT = `(function(){try{
if(location.pathname!=="/")return;
var r=document.documentElement,k=${JSON.stringify(INTRO_KEY)};
if(matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem(k)){r.dataset.homeIntro="skip";return}
sessionStorage.setItem(k,"1");r.dataset.homeIntro="load";
var t0=performance.now(),loaded=false,film=false;
function go(){if(r.dataset.homeIntro!=="load")return;r.dataset.homeIntroAt=String(performance.now());r.dataset.homeIntro="play"}
function check(){if(loaded&&film)setTimeout(go,Math.max(0,${LOAD_MIN_MS}-(performance.now()-t0)))}
function filmReady(){if(film)return;film=true;check()}
addEventListener("load",function(){loaded=true;
var v=document.querySelector('[data-testid="hero-video"]');
if(!v||v.readyState>=2)filmReady();else{v.addEventListener("loadeddata",filmReady,{once:true});setTimeout(filmReady,${VIDEO_WAIT_MS})}
check()});
setTimeout(go,${LOAD_MAX_MS});
}catch(e){document.documentElement.dataset.homeIntro="skip"}})();`;
