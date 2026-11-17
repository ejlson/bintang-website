/** Gallery photos (public/media/gallery). Landscape shots are 1600×900, portrait 900×1600. */
export type Photo = { id: string; src: string; alt: string; width: number; height: number };

const land = (id: string, alt: string): Photo => ({ id, src: `/media/gallery/${id}.jpg`, alt, width: 1600, height: 900 });
const port = (id: string, alt: string): Photo => ({ id, src: `/media/gallery/${id}.jpg`, alt, width: 900, height: 1600 });

/** Every photo, in page order. The lightbox steps through them in this order. */
export const PHOTOS = [
  land("garden", "The garden at golden hour"),
  port("shopfront-today", "The shopfront on Kentish Town Road today"),
  port("lanterns", "Lanterns in the old dining room"),
  port("shopfront-1987", "The original shopfront"),
  port("dining-room", "The dining room, years ago"),
  port("family", "The family"),
  land("trays", "Trays from the kitchen, topped with lemon"),
  land("summer", "A full garden on a summer evening"),
  land("singing", "Singing in the karaoke room"),
  land("karaoke-room", "The karaoke room, full"),
  land("bar", "Behind the bar"),
  land("noodles", "Noodles with grated cheese"),
  land("friends", "Friends at a garden table"),
  land("buffet", "A buffet for a private party"),
] as const satisfies readonly Photo[];

export type PhotoId = (typeof PHOTOS)[number]["id"];

const BY_ID = new Map<string, number>(PHOTOS.map((p, i) => [p.id, i]));

/** Position of a photo in PHOTOS. */
export function indexOf(id: PhotoId): number {
  return BY_ID.get(id)!;
}

export function photo(id: PhotoId): Photo {
  return PHOTOS[indexOf(id)];
}

/** The narrow column over the lanterns photo: three from the family album. */
export const ALBUM_CARDS: PhotoId[] = ["shopfront-1987", "dining-room", "family"];

/** The three rooms, each with an English and a Tagalog label (Tagalog pending native-speaker review). */
export const ROOMS: { id: PhotoId; en: string; tl: string }[] = [
  { id: "trays", en: "Kitchen", tl: "Kusina" },
  { id: "summer", en: "Garden", tl: "Hardin" },
  { id: "singing", en: "Karaoke", tl: "Kantahan" },
];

/**
 * One background colour per section, swept in as each section reaches the
 * middle of the screen (Mala Project style). All light, so ink text stays.
 */
export const SECTION_COLOURS = {
  hero: "#ffffff",
  album: "var(--paper)",
  rooms: "var(--yellow)",
  nights: "var(--pink)",
} as const;
