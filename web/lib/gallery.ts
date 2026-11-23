/**
 * Gallery photos. The gallery set (public/media/gallery) is 1600×900 or
 * 900×1600 stills from the hero film (bintang-hero.mp4) and the about film
 * (aboutbig.mov); each has a short clip of its shot beside it (`video`,
 * 960×540 or 540×960, played forwards then backwards so it loops without a
 * jump, muted, no sound track), and the still is its poster. Five more photos
 * come from the journal set (public/media/journal, 960×1200), stills only.
 */
export type Photo = { id: string; src: string; alt: string; width: number; height: number; video?: string };

const film = (id: string) => ({ src: `/media/gallery/${id}.jpg`, video: `/media/gallery/${id}.mp4` });
const land = (id: string, alt: string): Photo => ({ id, ...film(id), alt, width: 1600, height: 900 });
const port = (id: string, alt: string): Photo => ({ id, ...film(id), alt, width: 900, height: 1600 });
const journal = (file: string, alt: string): Photo => ({
  id: `journal-${file}`,
  src: `/media/journal/${file}.jpg`,
  alt,
  width: 960,
  height: 1200,
});

/** Every photo, in reading order of the grid. The viewer steps through them in this order. */
export const PHOTOS = [
  land("garden", "The garden at golden hour"),
  journal("archive-family", "Two of the family, from an old photo"),
  port("shopfront", "The shopfront on Kentish Town Road today"),
  land("friends", "Friends at a garden table"),
  land("trays", "Trays from the kitchen, topped with lemon"),
  journal("karaoke", "Singing in the karaoke room"),
  land("summer", "A full garden on a summer evening"),
  port("then-and-now", "Then and now: the old dining room at today’s shopfront"),
  land("spaghetti", "Filipino spaghetti, topped with cheese"),
  journal("private-hire", "A private party downstairs"),
  port("dining-room", "The dining room, years ago"),
  land("buffet", "A buffet for a private party"),
  land("bar", "Behind the bar"),
  port("family-album", "The family, from the album, in the garden today"),
  port("shopfront-1987", "The original shopfront"),
  land("karaoke-room", "The karaoke room, full"),
  land("singing", "A young guest in the karaoke room"),
  journal("brunch", "Weekend brunch at the buffet"),
  journal("garden", "Under the bunting in the garden"),
] as const satisfies readonly Photo[];

export type PhotoId = (typeof PHOTOS)[number]["id"];

/**
 * Where each photo sits in the bento grid. Wide screens: six square columns,
 * each photo placed at `col`/`row` spanning `w` × `h` cells, six rows with no
 * holes (landscape photos mostly 2 × 1, portrait 1 × 2, two 2 × 2 features).
 * Phones: two square columns, spans `pw` × `ph`, placed in order (no
 * back-filling, so the reading and focus order is the visual order), also
 * without holes.
 */
export type Tile = { col: number; row: number; w: 1 | 2; h: 1 | 2; pw: 1 | 2; ph: 1 | 2 };

export const BENTO: Record<PhotoId, Tile> = {
  garden: { col: 1, row: 1, w: 2, h: 2, pw: 2, ph: 1 },
  "journal-archive-family": { col: 3, row: 1, w: 1, h: 1, pw: 1, ph: 2 },
  shopfront: { col: 4, row: 1, w: 1, h: 2, pw: 1, ph: 2 },
  friends: { col: 5, row: 1, w: 2, h: 1, pw: 2, ph: 1 },
  trays: { col: 3, row: 2, w: 1, h: 1, pw: 1, ph: 1 },
  "journal-karaoke": { col: 5, row: 2, w: 1, h: 1, pw: 1, ph: 1 },
  summer: { col: 6, row: 2, w: 1, h: 1, pw: 2, ph: 1 },
  "then-and-now": { col: 1, row: 3, w: 1, h: 2, pw: 1, ph: 2 },
  spaghetti: { col: 2, row: 3, w: 2, h: 1, pw: 1, ph: 1 },
  "journal-private-hire": { col: 4, row: 3, w: 2, h: 2, pw: 1, ph: 1 },
  "dining-room": { col: 6, row: 3, w: 1, h: 2, pw: 1, ph: 2 },
  buffet: { col: 2, row: 4, w: 2, h: 1, pw: 1, ph: 1 },
  bar: { col: 1, row: 5, w: 2, h: 1, pw: 1, ph: 1 },
  "family-album": { col: 3, row: 5, w: 1, h: 2, pw: 1, ph: 2 },
  "shopfront-1987": { col: 4, row: 5, w: 1, h: 2, pw: 1, ph: 2 },
  "karaoke-room": { col: 5, row: 5, w: 2, h: 1, pw: 2, ph: 1 },
  singing: { col: 1, row: 6, w: 2, h: 1, pw: 2, ph: 1 },
  "journal-brunch": { col: 5, row: 6, w: 1, h: 1, pw: 1, ph: 1 },
  "journal-garden": { col: 6, row: 6, w: 1, h: 1, pw: 1, ph: 1 },
};
