/**
 * Gallery photos. The gallery set (public/media/gallery) is 1600×900 or
 * 900×1600; five more come from the journal set (public/media/journal, 960×1200).
 */
export type Photo = { id: string; src: string; alt: string; width: number; height: number };

const land = (id: string, alt: string): Photo => ({ id, src: `/media/gallery/${id}.jpg`, alt, width: 1600, height: 900 });
const port = (id: string, alt: string): Photo => ({ id, src: `/media/gallery/${id}.jpg`, alt, width: 900, height: 1600 });
const journal = (file: string, alt: string): Photo => ({
  id: `journal-${file}`,
  src: `/media/journal/${file}.jpg`,
  alt,
  width: 960,
  height: 1200,
});

/** Every photo, in reading order (left to right, top to bottom). The viewer steps through them in this order. */
export const PHOTOS = [
  land("garden", "The garden at golden hour"),
  journal("archive-family", "Two of the family, from an old photo"),
  port("shopfront", "The shopfront on Kentish Town Road today"),
  land("trays", "Trays from the kitchen, topped with lemon"),
  journal("karaoke", "Singing in the karaoke room"),
  land("friends", "Friends at a garden table"),
  port("then-and-now", "Then and now: the old dining room at today’s shopfront"),
  land("spaghetti", "Filipino spaghetti, topped with cheese"),
  land("summer", "A full garden on a summer evening"),
  journal("private-hire", "A private party downstairs"),
  land("buffet", "A buffet for a private party"),
  port("dining-room", "The dining room, years ago"),
  port("family-album", "The family, from the album, in the garden today"),
  land("bar", "Behind the bar"),
  journal("brunch", "Weekend brunch at the buffet"),
  land("karaoke-room", "The karaoke room, full"),
  port("shopfront-1987", "The original shopfront"),
  journal("garden", "Under the bunting in the garden"),
  land("singing", "A young guest in the karaoke room"),
] as const satisfies readonly Photo[];

export type PhotoId = (typeof PHOTOS)[number]["id"];

type Edge = "start" | "center" | "end";

/**
 * Where each photo sits in the scattered field (after the Simon Wheatley
 * portfolio pin). On wide screens the field is a 6 × 4 grid with the title in
 * the middle four cells; each photo stays inside its own cell, so nothing
 * overlaps until it is enlarged. `x`/`y` place it within the cell and
 * `size` is its height as a share of the cell. On phones the cells flow into
 * three columns and keep the same offsets.
 */
export type Spot = { col: number; row: number; x: Edge; y: Edge; size: number; layer: Layer };

/**
 * How far away a photo looks: 3 near (sharp, moves most with the mouse),
 * 2 middle, 1 far (soft focus, moves least). Bigger photos sit nearer.
 */
export type Layer = 1 | 2 | 3;

export const FIELD: Record<PhotoId, Spot> = {
  garden: { col: 1, row: 1, x: "start", y: "end", size: 62, layer: 2 },
  "journal-archive-family": { col: 2, row: 1, x: "center", y: "start", size: 80, layer: 3 },
  shopfront: { col: 3, row: 1, x: "end", y: "center", size: 92, layer: 3 },
  trays: { col: 4, row: 1, x: "start", y: "end", size: 52, layer: 1 },
  "journal-karaoke": { col: 5, row: 1, x: "end", y: "start", size: 70, layer: 2 },
  friends: { col: 6, row: 1, x: "end", y: "center", size: 48, layer: 1 },
  "then-and-now": { col: 1, row: 2, x: "end", y: "center", size: 95, layer: 3 },
  spaghetti: { col: 2, row: 2, x: "start", y: "end", size: 56, layer: 2 },
  summer: { col: 5, row: 2, x: "center", y: "start", size: 60, layer: 1 },
  "journal-private-hire": { col: 6, row: 2, x: "start", y: "end", size: 78, layer: 2 },
  buffet: { col: 1, row: 3, x: "center", y: "start", size: 50, layer: 1 },
  "dining-room": { col: 2, row: 3, x: "end", y: "end", size: 96, layer: 3 },
  "family-album": { col: 5, row: 3, x: "start", y: "center", size: 88, layer: 2 },
  bar: { col: 6, row: 3, x: "end", y: "end", size: 54, layer: 1 },
  "journal-brunch": { col: 1, row: 4, x: "start", y: "center", size: 82, layer: 3 },
  "karaoke-room": { col: 2, row: 4, x: "end", y: "start", size: 58, layer: 2 },
  "shopfront-1987": { col: 3, row: 4, x: "center", y: "end", size: 90, layer: 3 },
  "journal-garden": { col: 4, row: 4, x: "start", y: "start", size: 74, layer: 2 },
  singing: { col: 6, row: 4, x: "start", y: "center", size: 50, layer: 1 },
};
