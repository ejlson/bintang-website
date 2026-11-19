"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ALBUM_CARDS, PHOTOS, ROOMS, SECTION_COLOURS, indexOf, photo, type PhotoId } from "@/lib/gallery";
import { BOOKING_URL } from "@/lib/nav";
import { ColourSweep } from "./ColourSweep";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { getLenis } from "./SmoothScroll";
import styles from "./GalleryPage.module.css";

type Open = (index: number, from: HTMLElement) => void;

/** A photo as a button that opens the viewer. Sized by its parent (the image fills it). */
function Shot({
  id,
  onOpen,
  sizes,
  className,
  eager = false,
}: {
  id: PhotoId;
  onOpen: Open;
  sizes: string;
  className?: string;
  /** Above the fold on load: fetch now, at high priority. */
  eager?: boolean;
}) {
  const p = photo(id);
  return (
    <button
      type="button"
      className={`${styles.shot} ${className ?? ""}`}
      aria-label={`Open photo: ${p.alt}`}
      onClick={(e) => onOpen(indexOf(id), e.currentTarget)}
    >
      <Image
        src={p.src}
        alt={p.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
      />
    </button>
  );
}

/** Full-screen photo viewer: Esc closes, arrow keys step, focus stays inside. */
function Viewer({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (by: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const p = PHOTOS[index];

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
            {index + 1} / {PHOTOS.length}
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

function BookLink() {
  return (
    <a className={styles.book} href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
      Book a table<span className="sr-only"> on OpenTable (opens in a new tab)</span>
    </a>
  );
}

/**
 * Gallery, option D from the Claude Design canvas: a big garden photo beside a
 * small framed shopfront; the family album photo split by a narrow column of album
 * cards; three rooms; one big and one small photo with a booking line.
 * Each section has its own background colour, swept in on scroll (ColourSweep).
 */
export function GalleryPage() {
  const rootRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const onOpen = useCallback<Open>((index, from) => {
    openerRef.current = from;
    setOpen(index);
  }, []);
  const onClose = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);
  const onStep = useCallback((by: number) => {
    setOpen((i) => (i === null ? i : (i + by + PHOTOS.length) % PHOTOS.length));
  }, []);

  return (
    <main ref={rootRef} className={styles.page}>
      <ColourSweep root={rootRef} />

      <div className={styles.content}>
        <SiteHeader variant="page" tone="ink" mark="ink" currentHref="/gallery" />
        <h1 className="sr-only">Gallery — photographs from Bintang, Kentish Town, since 1987</h1>

        <section className={styles.hero} data-sweep={SECTION_COLOURS.hero} aria-label="Bintang">
          <Shot id="garden" onOpen={onOpen} className={styles.heroShot} sizes="(width >= 768px) 50vw, 100vw" eager />
          <div className={styles.heroSide}>
            <div className={styles.framed}>
              <p className={styles.small}>
                Since
                <br />
                1987
              </p>
              <Shot id="shopfront" onOpen={onOpen} className={styles.frame} sizes="200px" eager />
              <p className={styles.small}>
                Kentish
                <br />
                Town
              </p>
            </div>
            <p className={`${styles.small} ${styles.centred}`}>
              The kitchen, the garden, the room downstairs, and the family album.
              <br />
              <span lang="tl">Kusina, hardin, kantahan at lumang larawan.</span>
            </p>
            <BookLink />
          </div>
        </section>

        <section className={styles.album} data-sweep={SECTION_COLOURS.album} aria-label="From the album">
          <p className={`${styles.small} ${styles.albumIntro}`}>
            Open the family album: thirty-nine years of birthdays, karaoke and long tables on Kentish Town Road.
          </p>
          <div className={styles.split}>
            <Shot id="family-album" onOpen={onOpen} className={styles.wide} sizes="100vw" />
            <div className={styles.column}>
              {ALBUM_CARDS.map((id) => (
                <figure key={id} className={styles.card}>
                  <Shot id={id} onOpen={onOpen} className={styles.cardShot} sizes="300px" />
                  <figcaption className={styles.cardCap}>
                    <span>{photo(id).alt}</span>
                    <span>Album</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.rooms} data-sweep={SECTION_COLOURS.rooms} aria-labelledby="rooms-label">
          <h2 id="rooms-label" className={styles.dot}>
            Gallery
          </h2>
          <div className={styles.trio}>
            {ROOMS.map((r) => (
              <figure key={r.id} className={styles.room}>
                <figcaption className={styles.small}>
                  {r.en} <span lang="tl">/ {r.tl}</span>
                </figcaption>
                <Shot id={r.id} onOpen={onOpen} className={styles.roomShot} sizes="(width >= 768px) 30vw, 100vw" />
              </figure>
            ))}
          </div>
        </section>

        <div data-sweep={SECTION_COLOURS.nights}>
          <section className={styles.nights} aria-labelledby="nights-label">
            <Shot id="karaoke-room" onOpen={onOpen} className={styles.nightsBig} sizes="(width >= 768px) 65vw, 100vw" />
            <div className={styles.nightsSide}>
              <div className={styles.nightsCol}>
                <Shot id="bar" onOpen={onOpen} className={styles.nightsSmall} sizes="260px" />
                <div className={styles.nightsText}>
                  <p className={styles.small}>
                    Planning a birthday, a leaving do or a long Saturday downstairs? Tell us and we’ll set the room.
                  </p>
                  <BookLink />
                </div>
              </div>
              <h2 id="nights-label" className={styles.dot}>
                Book
              </h2>
            </div>
          </section>
          <SiteFooter />
        </div>
      </div>

      {open !== null && <Viewer index={open} onClose={onClose} onStep={onStep} />}
    </main>
  );
}
