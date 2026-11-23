"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Photo } from "@/lib/gallery";
import { LoopVideo } from "./LoopVideo";
import styles from "./FlickStage.module.css";

/** A swipe has to travel this far (px), mostly sideways, to count. */
const SWIPE = 40;
/** Scroll-wheel travel that turns one photo, and the pause before the next. */
const WHEEL_STEP = 40;
const WHEEL_REST_MS = 450;

type Layer = { photo: Photo; key: number; fresh: boolean };

type Props = {
  photo: Photo;
  onStep: (by: number) => void;
  sizes: string;
  className?: string;
  /** Turn photos with the scroll wheel (only where the page can't scroll anyway). */
  wheel?: boolean;
  children?: ReactNode;
};

/**
 * The photo, flicked through like the BUNSO gallery: each new photo is laid
 * on top of the last and opens out from the centre (clip-path, 0.36s).
 * Touch screens swipe; with `wheel`, the scroll wheel turns photos too.
 * A photo with a clip plays it over the still.
 * Reduced motion: the new photo just replaces the old one, and clips stay still.
 */
export function FlickStage({
  photo,
  onStep,
  sizes,
  className,
  wheel = false,
  children,
}: Props) {
  const [layers, setLayers] = useState<Layer[]>([
    { photo, key: 0, fresh: false },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  // A swipe that ends over a button inside the stage mustn't also click it.
  const swiped = useRef(false);

  // A new photo goes on top of the one showing; older layers are dropped.
  const top = layers[layers.length - 1];
  if (top.photo.id !== photo.id) {
    setLayers(
      [top, { photo, key: top.key + 1, fresh: true }].map((l, i) =>
        i === 0 ? { ...l, fresh: false } : l,
      ),
    );
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || !wheel) return;
    let travel = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      // Pinch-zoom arrives as a wheel event with ctrlKey: leave it to the browser.
      if (e.ctrlKey) return;
      e.preventDefault();
      const now = performance.now();
      // Trackpad momentum keeps firing after a turn: ignore it until it has
      // rested for WHEEL_REST_MS (each ignored event restarts the wait).
      if (now - last < WHEEL_REST_MS) {
        travel = 0;
        last = now;
        return;
      }
      travel += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(travel) < WHEEL_STEP) return;
      onStep(travel > 0 ? 1 : -1);
      travel = 0;
      last = now;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheel, onStep]);

  return (
    <div
      ref={ref}
      className={`${styles.stage} ${className ?? ""}`}
      data-testid="flick-stage"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse")
          start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy)) {
          swiped.current = true;
          onStep(dx < 0 ? 1 : -1);
        }
      }}
      onClickCapture={(e) => {
        if (!swiped.current) return;
        swiped.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      {layers.map((l, i) => {
        const current = i === layers.length - 1;
        return (
          <div
            key={l.key}
            className={styles.layer}
            data-fresh={l.fresh || undefined}
            aria-hidden={current ? undefined : true}
            onAnimationEnd={() => {
              if (current)
                setLayers((ls) =>
                  ls.slice(-1).map((x) => ({ ...x, fresh: false })),
                );
            }}
          >
            <Image
              className={styles.img}
              src={l.photo.src}
              alt={current ? l.photo.alt : ""}
              fill
              sizes={sizes}
              loading="eager"
            />
            {l.photo.video && (
              <LoopVideo src={l.photo.video} className={styles.clip} />
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
}
