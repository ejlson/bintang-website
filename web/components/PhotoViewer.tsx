"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Photo } from "@/lib/gallery";
import { getLenis } from "./SmoothScroll";
import styles from "./PhotoViewer.module.css";

type Props = {
  photos: readonly Photo[];
  index: number;
  onClose: () => void;
  onStep: (by: number) => void;
};

/**
 * Full-screen photo viewer: Close / Previous / Next, Esc closes, arrow keys
 * step, Tab stays inside, focus starts on Close, and the page behind doesn't
 * scroll. The caller returns focus to whatever opened it.
 */
export function PhotoViewer({ photos, index, onClose, onStep }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const p = photos[index];

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("[data-close]")?.focus();
    const lenis = getLenis();
    lenis?.stop();
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      lenis?.start();
      html.style.overflow = before;
    };
  }, []);

  // Keys are heard on the document, not the dialog: clicking the photo or the
  // backdrop (or any button in Safari, which doesn't focus on click) leaves
  // focus on <body>, and the keys must still work then.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onStep(-1);
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "Tab") {
        const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        const inside = ref.current?.contains(document.activeElement) ?? false;
        if (e.shiftKey && (!inside || document.activeElement === first)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
          e.preventDefault();
          first.focus();
        }
        return;
      } else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, onStep]);

  return (
    <div ref={ref} className={styles.viewer} role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button type="button" className={`${styles.round} ${styles.close}`} aria-label="Close" data-close onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
      <Image
        key={p.id}
        className={styles.big}
        src={p.src}
        alt={p.alt}
        width={p.width}
        height={p.height}
        sizes={p.height > p.width ? "(width >= 768px) 520px, 100vw" : "(width >= 1200px) 1100px, 100vw"}
      />
      <div className={styles.controls}>
        <button type="button" className={styles.round} aria-label="Previous photo" onClick={() => onStep(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <p className={styles.caption} aria-live="polite">
          {p.alt}
          <span className={styles.count}>
            {index + 1} / {photos.length}
          </span>
        </p>
        <button type="button" className={styles.round} aria-label="Next photo" onClick={() => onStep(1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
