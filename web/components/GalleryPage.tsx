"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { FIELD, PHOTOS, type Photo, type PhotoId } from "@/lib/gallery";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { PhotoViewer } from "./PhotoViewer";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./GalleryPage.module.css";

const FLEX = { start: "flex-start", center: "center", end: "flex-end" } as const;

/** Grow towards the middle of the screen, so an enlarged photo stays in view. */
function origin(col: number, row: number) {
  const x = col <= 2 ? "left" : col >= 5 ? "right" : "center";
  const y = row === 1 ? "top" : row === 4 ? "bottom" : "center";
  return `${x} ${y}`;
}

/**
 * Keyboard focus names a photo in the middle; mouse focus (a click, or the
 * viewer handing focus back after a mouse close) doesn't, because the photo
 * isn't enlarged then either.
 */
function keyboardFocus(el: Element) {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

/** Mouse parallax only where there is a mouse and room for the field. */
const PARALLAX_QUERY = "(width >= 768px) and (hover: hover) and (pointer: fine)";

/** How quickly the field catches up with the mouse each frame (0–1). */
const FOLLOW = 0.08;

/**
 * Moves the field with the mouse: writes --px and --py (-1 to 1, eased) on
 * the element, and CSS turns them into a shift per depth layer. Off for
 * touch screens, phones and reduced motion.
 */
function subscribeParallax(onChange: () => void) {
  const mql = window.matchMedia(PARALLAX_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const canParallax = () => window.matchMedia(PARALLAX_QUERY).matches;
const cannotParallaxOnServer = () => false;

function useParallax(ref: RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion();
  // Re-checked when the window crosses the breakpoint or the input changes.
  const able = useSyncExternalStore(subscribeParallax, canParallax, cannotParallaxOnServer);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce !== false || !able) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    const tick = () => {
      x += (tx - x) * FOLLOW;
      y += (ty - y) * FOLLOW;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      frame = Math.abs(tx - x) > 0.0005 || Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      start();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      start();
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      el.style.removeProperty("--px");
      el.style.removeProperty("--py");
    };
  }, [ref, reduce, able]);
}

/**
 * Gallery, option E on the Claude Design canvas (after the Simon Wheatley
 * portfolio pin): one screen of photographs scattered across a white field,
 * each in its own grid cell, in front of a big GALLERY title. Photos sit at
 * three depths: far ones are soft-focus and move least with the mouse, near
 * ones are sharp and move most. Hovering or focusing one enlarges it in place,
 * brings it into focus and names it under the title; clicking opens the viewer.
 * Phones: three columns that scroll, tap to open. The whole field is one
 * screen on wide screens, so every photo loads up front.
 */
export function GalleryPage() {
  // Pointer and keyboard are tracked apart, so leaving one photo with the
  // mouse doesn't clear the name of another that has keyboard focus.
  const [pointed, setPointed] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const hovered = pointed ?? focused;
  const [open, setOpen] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  useParallax(fieldRef);

  const onClose = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);
  const onStep = useCallback((by: number) => {
    setOpen((i) => (i === null ? i : (i + by + PHOTOS.length) % PHOTOS.length));
  }, []);

  const shown: Photo | null = hovered === null ? null : PHOTOS[hovered];

  return (
    <main className={styles.page}>
      <SiteHeader variant="page" tone="ink" mark="ink" currentHref="/gallery" />
      <div ref={fieldRef} className={styles.field}>
        {/* Behind the photos. */}
        <div className={styles.backdrop}>
          <h1 className={styles.bigTitle}>
            Gallery<span className="sr-only"> — photographs from Bintang, Kentish Town, since 1987</span>
          </h1>
        </div>
        {/* In front of the photos, so an enlarged one never covers its own name.
            Decorative: each photo button already carries its own name. */}
        <p className={styles.titleSub} aria-hidden="true" data-testid="field-title">
          {shown ? (
            <>
              {shown.alt} · {hovered! + 1} / {PHOTOS.length}
            </>
          ) : (
            <span lang="tl">Larawan</span>
          )}
        </p>

        {PHOTOS.map((p, i) => {
          const spot = FIELD[p.id as PhotoId];
          const cell = {
            "--col": spot.col,
            "--row": spot.row,
            justifyContent: FLEX[spot.x],
            alignItems: FLEX[spot.y],
          } as CSSProperties;
          const shot = {
            "--size": spot.size,
            "--ratio": `${p.width} / ${p.height}`,
            "--ar": p.width / p.height,
            transformOrigin: origin(spot.col, spot.row),
          } as CSSProperties;
          return (
            <div key={p.id} className={styles.cell} style={cell} data-layer={spot.layer}>
              <button
                type="button"
                className={styles.shot}
                style={shot}
                aria-label={`Open photo: ${p.alt}`}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setPointed(i);
                }}
                onPointerLeave={() => setPointed((h) => (h === i ? null : h))}
                onFocus={(e) => setFocused(keyboardFocus(e.currentTarget) ? i : null)}
                onBlur={() => setFocused((h) => (h === i ? null : h))}
                onClick={(e) => {
                  openerRef.current = e.currentTarget;
                  setOpen(i);
                }}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(width >= 768px) 34vw, 30vw"
                  loading="eager"
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.corners}>
        <p className={styles.corner}>
          Bintang
          <br />
          Since 1987
        </p>
        <p className={`${styles.corner} ${styles.right}`}>
          Kentish Town
          <br />
          London NW1
        </p>
      </div>

      <SiteFooter />

      {open !== null && <PhotoViewer photos={PHOTOS} index={open} onClose={onClose} onStep={onStep} />}
    </main>
  );
}
