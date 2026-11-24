"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { MenuSheet } from "@/lib/menu";
import { getLenis } from "./SmoothScroll";
import styles from "./PrintedSheetViewer.module.css";

type Props = {
  label: string;
  image: NonNullable<MenuSheet["image"]>;
  onClose: () => void;
};

/**
 * A printed menu page full screen (SPEC.md › Christmas 2026 promotion): the
 * page at reading size, scrolling inside the overlay (pinch-zoom works on
 * phones), with Close and the PDF. Esc closes, Tab stays inside, focus starts
 * on Close and the page behind doesn't scroll. The caller returns focus.
 */
export function PrintedSheetViewer({ label, image, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.querySelector<HTMLButtonElement>("[data-close]")?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex="0"]',
        ) ?? [],
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      getLenis()?.start();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-lenis-prevent
    >
      <div className={styles.bar}>
        <p className={styles.title}>{label}</p>
        {image.pdf && (
          <a
            className={styles.pdf}
            href={image.pdf}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open PDF <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        <button
          type="button"
          className={styles.close}
          data-close
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {/* Focusable, so keyboard users can scroll the page with the arrow keys. */}
      <div
        className={styles.scroller}
        tabIndex={0}
        role="region"
        aria-label={`${label}, printed page`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a static printed page, already sized and compressed */}
        <img
          className={styles.page}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
        />
      </div>
    </div>,
    document.body,
  );
}
