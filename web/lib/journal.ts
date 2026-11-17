/**
 * Journal posts, newest first.
 *
 * SAMPLE CONTENT: titles, dates and excerpts are placeholders written for the
 * layout, not real posts. Replace them (or move them into the CMS) before
 * launch. Images are stills from the hero and About films, cropped 4:5.
 */
export type JournalPost = {
  slug: string;
  title: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  excerpt: string;
  image: { src: string; alt: string };
};

export const posts: JournalPost[] = [
  {
    slug: "karaoke-nights",
    title: "Karaoke nights in the back room",
    date: "2026-11-12",
    excerpt:
      "How karaoke works at Bintang: open mic in the bar, or the private room for your own group, with plates from the kitchen coming through all night.",
    image: { src: "/media/journal/karaoke.jpg", alt: "A woman singing into a microphone in the warm red light of the karaoke room" },
  },
  {
    slug: "feasting-trays",
    title: "Feasting trays, made for sharing",
    date: "2026-11-03",
    excerpt:
      "Our group set menus come out on big trays, family style. What goes on them, how much to order, and how to book a table for ten or more.",
    image: { src: "/media/journal/feast.jpg", alt: "A full tray of rice with vegetables, chillies and lime wedges on the pass" },
  },
  {
    slug: "brunch-in-the-garden",
    title: "Weekend brunch: silogs and bottomless",
    date: "2026-10-24",
    excerpt:
      "Garlic fried rice, a fried egg and your choice of longganisa, tocino, bangus or laing. A guide to the Saturday and Sunday brunch menu.",
    image: { src: "/media/journal/brunch.jpg", alt: "Guests helping themselves from a buffet of trays in the garden" },
  },
  {
    slug: "from-the-family-album",
    title: "From the family album, 1987",
    date: "2026-10-10",
    excerpt:
      "The first Bintang shopfront, the striped awning and the photos we found while making our film. A look back at where it started.",
    image: { src: "/media/journal/archive-storefront.jpg", alt: "An old photograph of the original Bintang shopfront with its striped awning" },
  },
  {
    slug: "the-garden",
    title: "The garden, under the bunting",
    date: "2026-09-26",
    excerpt:
      "String lights, paper bunting and the plants that have grown up around the tables. Why the garden is the best seat in the house on a warm evening.",
    image: { src: "/media/journal/garden.jpg", alt: "Diners at tables in the garden under coloured paper bunting at golden hour" },
  },
  {
    slug: "private-hire",
    title: "Birthdays, christenings and karaoke",
    date: "2026-09-12",
    excerpt:
      "Hiring the karaoke room or the whole restaurant for a party: what it costs, how many it holds, and what we can cook for you.",
    image: { src: "/media/journal/private-hire.jpg", alt: "A mother and her small daughter laughing together in the karaoke room" },
  },
  {
    slug: "two-generations",
    title: "Two generations in the kitchen",
    date: "2026-08-29",
    excerpt:
      "The children in the old photographs grew up behind the counter. The family on keeping the recipes, and the regulars, the same since 1987.",
    image: { src: "/media/journal/archive-family.jpg", alt: "An old family photograph of two young children smiling" },
  },
  {
    slug: "summer-evenings",
    title: "Long summer evenings in the garden",
    date: "2026-08-15",
    excerpt:
      "A season in the garden, from the first warm Friday to the last of the light. Thank you to everyone who came and stayed for one more round.",
    image: { src: "/media/journal/summer.jpg", alt: "Friends laughing over drinks at a garden table in the evening sun" },
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

/** "2026-10-20" → "20 Oct 2026". Parsed by hand so server and client always agree. */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
