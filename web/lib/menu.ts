/**
 * Bintang menus, from the Maginhawa Group's shared Sanity CMS.
 *
 * `npm run pull-cms` (scripts/pull-cms.mjs) fetches the four published menu
 * documents into lib/menu.snapshot.json; this file turns that snapshot back
 * into the shapes components/MenuPage.tsx has always used. What stays here,
 * in code: each menu's id, tab label and colours, and per printed sheet the
 * "Karaoke at Bintang" line and whether the legal notes show.
 *
 * Prices are in pounds; the page shows bare numbers like the printed cards.
 * Dietary marks are appended to the dish name: V vegetarian, GF gluten free,
 * VE vegan, PN peanuts, in that order ("Okoy Fritters (GF) (VE)").
 */
import snapshot from "./menu.snapshot.json";
import { CHRISTMAS_ENDS } from "./promo";

export type MenuItem = {
  name: string;
  /** Bare number(s), e.g. "17.5" or "32 / 8" (bottle / glass). Omitted when the note carries the price. */
  price?: string;
  desc?: string;
  /** Bold line under the description: portion options, "Suitable for 2", etc. */
  note?: string;
};

export type MenuSection = {
  title: string;
  /** Second heading line, e.g. "Curries & stews" under "Ulam". */
  sub?: string;
  /** Italic line under the heading. */
  intro?: string;
  /** Right-aligned column label above prices, e.g. "BOTTLE / GLASS". */
  colHead?: string;
  /** Italic line after the list. */
  foot?: string;
  /** Drawn inside a hairline box, like Silogs on the printed card. */
  boxed?: boolean;
  items: MenuItem[];
};

/** Full-width block after the columns (e.g. Bottomless drinks). */
export type MenuFeature = {
  title: string;
  lead?: string;
  foot?: string;
  items: MenuItem[];
};

export type MenuSheet = {
  /** Band heading, e.g. "À la carte · Food". */
  label: string;
  sections: MenuSection[];
  wide?: MenuFeature[];
  /** Line under the "Karaoke at Bintang" banner; no banner when omitted. */
  karaoke?: string;
  /** Show the halal / allergen / service-charge notes. */
  legal?: boolean;
  /**
   * The printed sheet as a picture (the Christmas menus). Shown instead of the
   * columns, which move into a "Read this menu as text" disclosure under it.
   */
  image?: {
    src: string;
    width: number;
    height: number;
    alt: string;
    /** The printed PDF, opened in a new tab (a `#page=` fragment picks the page). */
    pdf?: string;
  };
};

/** The menus kept in the CMS (`menu-bintang-<id>`). */
export type CmsMenuId = "carte" | "brunch" | "desserts" | "karaoke";

/** Every tab: the CMS menus plus the seasonal ones kept in code. */
export type MenuId = CmsMenuId | "christmas";

export type Menu = {
  id: MenuId;
  label: string;
  /** Text colour for the whole page while this menu is open (headings, MENU title, body, rules). */
  accent: string;
  /** Page background while this menu is open. The page fades between menus, like Mala Project. */
  background: string;
  sheets: MenuSheet[];
  /** Seasonal menus only: the moment (ms since epoch) the tab disappears. Checked in the browser, never at build. */
  until?: number;
};

/* ---------- The snapshot (shape written by scripts/pull-cms.mjs) ---------- */

export type Dietary = "v" | "gf" | "ve" | "pn";

export type SnapshotItem = {
  name: string;
  price?: string;
  description?: string;
  note?: string;
  dietary?: string[];
  hide?: boolean;
};

export type SnapshotSection = {
  /** Which printed sheet the section is on: a key of SHEETS[menu id]. */
  part: string;
  title: string;
  subtitle?: string;
  intro?: string;
  priceLabel?: string;
  foot?: string;
  boxed?: boolean;
  /** A full-width block after the columns rather than a column section. */
  wide?: boolean;
  items: SnapshotItem[];
};

export type SnapshotMenu = {
  id: string;
  title: string;
  sections: SnapshotSection[];
};

export type MenuSnapshot = { menus: SnapshotMenu[] };

/* ---------- What stays in code ---------- */

type Look = Omit<Menu, "sheets" | "id" | "until"> & { id: CmsMenuId };

/** Every menu, in tab order, with its colours. The CMS document is `menu-bintang-<id>`. */
const LOOKS: Look[] = [
  {
    id: "carte",
    label: "À la carte",
    accent: "#2D2D2D",
    background: "#EDE9E9",
  },
  { id: "brunch", label: "Brunch", accent: "#2D2D2D", background: "#F6DE43" },
  {
    id: "desserts",
    label: "Desserts",
    accent: "#2D2D2D",
    background: "#E9C0D4",
  },
  { id: "karaoke", label: "Karaoke", accent: "#EDE9E9", background: "#D92E36" },
];

/**
 * Per menu, per printed sheet (the CMS section's "part"): the karaoke banner
 * line and the legal notes. Every part the CMS allows (BINTANG_PARTS in the
 * Studio's schemaTypes/menu.ts) must be listed; an unknown part fails the build.
 */
export const SHEETS: Record<
  CmsMenuId,
  Record<string, Pick<MenuSheet, "karaoke" | "legal">>
> = {
  carte: {
    Food: {},
    Drinks: { karaoke: "Large space available for booking", legal: true },
  },
  brunch: {
    Food: {},
    Drinks: { karaoke: "Open mic: Saturday 5pm – 11pm", legal: true },
  },
  desserts: {
    Panghimagas: { legal: true },
  },
  karaoke: {
    "Sharing set menu": {
      karaoke:
        "Complimentary karaoke for all private hires of our lower ground floor. Email us for room hire prices and time slots.",
      legal: true,
    },
  },
};

/* ---------- Snapshot -> page shapes ---------- */

const MARK_ORDER: Dietary[] = ["v", "gf", "ve", "pn"];

/** "Okoy Fritters" + ["ve", "gf"] -> "Okoy Fritters (GF) (VE)". */
function joinMarks(name: string, dietary: string[] = []) {
  const marks = [...dietary]
    .sort(
      (a, b) =>
        MARK_ORDER.indexOf(a as Dietary) - MARK_ORDER.indexOf(b as Dietary),
    )
    .map((d) => `(${d.toUpperCase()})`);
  return [name, ...marks].join(" ");
}

function toItem(i: SnapshotItem): MenuItem {
  return {
    name: joinMarks(i.name, i.dietary),
    ...(i.price ? { price: i.price } : {}),
    ...(i.description ? { desc: i.description } : {}),
    ...(i.note ? { note: i.note } : {}),
  };
}

function toMenu(look: Look, doc: SnapshotMenu): Menu {
  const parts = SHEETS[look.id];
  const sheets: MenuSheet[] = [];
  for (const s of doc.sections) {
    if (!Object.hasOwn(parts, s.part)) {
      throw new Error(
        `lib/menu: "${doc.id}" has a section "${s.title}" on unknown part "${s.part}"`,
      );
    }
    // Hidden dishes are left out, and a section with none left is too.
    const items = s.items.filter((i) => !i.hide).map(toItem);
    if (items.length === 0) continue;

    // Sheets in the order their first section appears.
    const label = `${look.label} · ${s.part}`;
    let sheet = sheets.find((x) => x.label === label);
    if (!sheet)
      sheets.push((sheet = { label, sections: [], ...parts[s.part] }));

    if (s.wide) {
      (sheet.wide ??= []).push({
        title: s.title,
        ...(s.intro ? { lead: s.intro } : {}),
        ...(s.foot ? { foot: s.foot } : {}),
        items,
      });
    } else {
      sheet.sections.push({
        title: s.title,
        ...(s.subtitle ? { sub: s.subtitle } : {}),
        ...(s.intro ? { intro: s.intro } : {}),
        ...(s.priceLabel ? { colHead: s.priceLabel } : {}),
        ...(s.foot ? { foot: s.foot } : {}),
        ...(s.boxed ? { boxed: true } : {}),
        items,
      });
    }
  }
  return { ...look, sheets };
}

/** Turns a menu snapshot into the menus the page shows, in tab order. */
export function menusFrom(snap: MenuSnapshot): Menu[] {
  return LOOKS.map((look) => {
    const id = `menu-bintang-${look.id}`;
    const doc = snap.menus.find((m) => m.id === id);
    if (!doc)
      throw new Error(
        `lib/menu: the snapshot has no "${id}"; run npm run pull-cms`,
      );
    return toMenu(look, doc);
  });
}

/* ---------- Seasonal menus, kept in code ---------- */

/** Both printed Christmas menus (a lean copy of "BINTANG MENU V5 DRAFT.pdf": page 1 Group, page 2 Sharing). */
export const CHRISTMAS_PDF = "/media/promo/bintang-christmas-menus.pdf";

const CHRISTMAS_DINING_NOTE =
  "12.5% service charge will be added to the bill. Please ask our team if you have any questions.";

/**
 * Christmas 2026 (SPEC.md › Christmas 2026 promotion), from the printed
 * "BINTANG MENU V5 DRAFT" PDF: each sheet is the printed page as a picture, with
 * the same dishes as text underneath for screen readers, search and zoom.
 */
export const CHRISTMAS_MENU: Menu = {
  id: "christmas",
  label: "Christmas",
  accent: "#EDE9E9",
  background: "#1D3A26",
  until: CHRISTMAS_ENDS,
  sheets: [
    {
      label: "Group set menu · £47",
      image: {
        src: "/media/promo/christmas-menu-group.webp",
        width: 1654,
        height: 2339,
        pdf: `${CHRISTMAS_PDF}#page=1`,
        alt: "The printed Group set menu, £47 per person, all dishes served as platters. The full menu follows as text.",
      },
      sections: [
        {
          title: "Starters",
          items: [
            {
              name: "Calamansi Hot Honey Wings",
              desc: "Crispy fried chicken wings tossed in calamansi hot honey sauce",
            },
            {
              name: "Okoy Fritters",
              desc: "Shredded root vegetables, Bintang pinakurat",
            },
            {
              name: "Lumpiang Shanghai",
              desc: "Beef & lamb mince spring rolls, sweet and spicy sauce",
            },
            {
              name: "Papaya Salad",
              desc: "Green beans, dried shrimp, peanuts, fish sauce",
            },
          ],
        },
        {
          title: "Mains",
          items: [
            {
              name: "Braised Beef Humba",
              desc: "Sweet, salty braised beef, cooked in pineapple juice and star anise, served with pak choi, fried plantains and pineapple",
            },
            {
              name: "Stir-Fried Brussels Sprouts",
              desc: "Shredded Brussels sprouts in oyster sauce",
            },
            {
              name: "Stir-Fry Prawn with Banana Ketchup",
              desc: "Peeled prawns, bamboo shoots in sweet, spicy banana ketchup",
            },
            {
              name: "Oak Smoked Chicken Inasal",
              desc: "½ on the bone & boneless thigh, lemongrass, ginger, soy",
            },
          ],
        },
        {
          title: "Bintang special mains",
          intro: "£4 per person supplement",
          items: [
            {
              name: "Tita Lita’s Palabok",
              desc: "Filipino rice noodles, shrimp-annatto sauce, mackerel, egg, fried garlic & chicken chicharrón",
            },
            {
              name: "Bintang’s Spaghetti",
              desc: "Sweet Filipino spaghetti with beef mince, sliced hot dog and a sweetened tomato sauce",
            },
            {
              name: "Pancit Canton",
              desc: "Egg noodles, stir-fried mixed vegetables, fish balls",
            },
          ],
        },
        { title: "Sides", items: [{ name: "Jasmine Rice" }] },
        {
          title: "Desserts",
          intro:
            "Each guest can enjoy an Ube Profiterole, or swap it for a scoop of sorbet.",
          items: [
            { name: "Ube Cream Profiterole", desc: "With cocojam sauce" },
            {
              name: "House Sorbet",
              desc: "Choose from calamansi, mango and lychee",
            },
          ],
        },
        {
          title: "Group dining info",
          boxed: true,
          intro:
            "All dishes come in the set to share family style. Add one of our Christmas special mains as an additional sharing dish for the table.",
          foot: CHRISTMAS_DINING_NOTE,
          items: [],
        },
      ],
      karaoke:
        "For an additional £5 per head, add our Bintang Karaoke on our lower ground floor. Email us for details.",
      legal: true,
    },
    {
      label: "Sharing set menu · £42",
      image: {
        src: "/media/promo/christmas-menu-sharing.webp",
        width: 1654,
        height: 2339,
        pdf: `${CHRISTMAS_PDF}#page=2`,
        alt: "The printed Sharing set menu, £42 per person, all dishes served as platters. The full menu follows as text.",
      },
      sections: [
        {
          title: "Starters",
          items: [
            {
              name: "Calamansi Hot Honey Wings",
              desc: "Crispy fried chicken wings tossed in calamansi hot honey sauce",
            },
            {
              name: "Okoy Fritters",
              desc: "Shredded root vegetables, Bintang pinakurat",
            },
            {
              name: "Lumpiang Shanghai",
              desc: "Beef & lamb mince spring rolls, sweet and spicy sauce",
            },
            {
              name: "Papaya Salad",
              desc: "Papaya, Asian herbs, dried shrimp and fish sauce",
            },
          ],
        },
        {
          title: "Mains",
          items: [
            {
              name: "Beef Sisig",
              desc: "Sizzling beef brisket, chilli, soy, calamansi, topped with chicken chicharon",
            },
            {
              name: "Ulek Curry",
              desc: "Mangosteen and Naga chilli based curry",
            },
            { name: "Oxtail Curry", desc: "Garlic, vegetarian oyster sauce" },
            {
              name: "Filipino Lamb Curry",
              desc: "Slow cooked lamb, coconut and lemongrass",
            },
            {
              name: "Oak Smoked Chicken Inasal",
              desc: "Smoked chicken on the bone marinated in classic Filipino aromatics",
            },
          ],
        },
        {
          title: "Bintang special main",
          intro: "£3 per person supplement",
          items: [
            {
              name: "Pancit Guisado",
              desc: "Filipino rice noodle dish with a mix of stir-fried vegetables. Can be made gluten free and vegan.",
            },
          ],
        },
        { title: "Sides", items: [{ name: "Jasmine Rice" }] },
        {
          title: "Dessert",
          intro:
            "Each guest can enjoy our home-made Ube Flan. It includes dairy; please ask about the sorbets available.",
          items: [
            {
              name: "Ube Flan",
              desc: "Our in-house ube chiffon cake with a smooth caramel flan",
            },
          ],
        },
        {
          title: "Group dining info",
          boxed: true,
          intro:
            "Choose 3 starters and 3 mains, all served in sharing portions, jasmine rice included. Add our Bintang main, Pancit Guisado, as an additional sharing dish for the table (£3 per person supplement).",
          foot: CHRISTMAS_DINING_NOTE,
          items: [],
        },
      ],
      karaoke:
        "For an additional £5 per head, add our Bintang Karaoke on our lower ground floor. Email us for details.",
      legal: true,
    },
  ],
};

/** Every tab, in order: the CMS menus, then the seasonal ones (MenuPage drops those past their `until`). */
export const menus: Menu[] = [
  ...menusFrom(snapshot as MenuSnapshot),
  CHRISTMAS_MENU,
];
