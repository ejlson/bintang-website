"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { BENTO, PHOTOS, type PhotoId } from "@/lib/gallery";
import { LoopVideo } from "./LoopVideo";
import { PhotoViewer } from "./PhotoViewer";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./GalleryPage.module.css";

const num = (i: number) => String(i + 1).padStart(2, "0");

/** The first block of tiles is on screen when the page opens. */
const ABOVE_FOLD = 4;

/**
 * Gallery: a big red GALLERY title, then one bento grid that scrolls up over
 * it, on the loader's warm black, 4px apart and 4px in
 * from the edges. Tiles of different sizes (landscape wide, portrait tall, big
 * features) packed without holes into six square columns, two on phones. Most tiles
 * are short looping clips from the films over their stills. The caption fades
 * up on hover or focus; clicking a tile opens the viewer, which flicks
 * through them all.
 */
export function GalleryPage() {
  const [open, setOpen] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const onClose = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);
  const onStep = useCallback((by: number) => {
    setOpen((i) => (i === null ? i : (i + by + PHOTOS.length) % PHOTOS.length));
  }, []);

  return (
    <main className={styles.page}>
      <SiteHeader
        variant="page"
        tone="red"
        mark="red"
        currentHref="/gallery"
      />
      <h1 className="sr-only">
        Gallery — photographs from Bintang, Kentish Town, since 1987
      </h1>

      {/* Decorative: the H1 above names the page. Pinned at the top, so the grid
          scrolls up over it. */}
      <div className={styles.title} aria-hidden="true" data-testid="gallery-title">
        <div className={styles.titleRule}>
          <p className={styles.titleText}>Gallery</p>
        </div>
      </div>

      <div className={styles.wrap}>
        <div className={styles.bento} data-testid="gallery-grid">
          {PHOTOS.map((p, i) => {
            const t = BENTO[p.id as PhotoId];
            const place = {
              "--col": t.col,
              "--row": t.row,
              "--w": t.w,
              "--h": t.h,
              "--pw": t.pw,
              "--ph": t.ph,
            } as CSSProperties;
            return (
              <button
                key={p.id}
                type="button"
                className={styles.tile}
                style={place}
                aria-label={`Open photo: ${p.alt}`}
                onClick={(e) => {
                  openerRef.current = e.currentTarget;
                  setOpen(i);
                }}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes={`(width >= 768px) ${t.w * 17}vw, ${t.pw * 50}vw`}
                  loading={i < ABOVE_FOLD ? "eager" : "lazy"}
                />
                {p.video && <LoopVideo src={p.video} className={styles.clip} />}
                <span className={styles.tileCap} aria-hidden="true">
                  <span className={styles.tileNum}>{num(i)}</span> {p.alt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <SiteFooter />

      {open !== null && (
        <PhotoViewer
          photos={PHOTOS}
          index={open}
          onClose={onClose}
          onStep={onStep}
        />
      )}
    </main>
  );
}
