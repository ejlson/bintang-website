import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CHRISTMAS_MENU, CHRISTMAS_PDF, menus, menusFrom, SHEETS, type MenuSnapshot } from "@/lib/menu";
import { CHRISTMAS_ENDS } from "@/lib/promo";
import cms from "@/lib/cms.json";
import live from "@/lib/menu.snapshot.json";
/* The snapshot as it was the day the menus moved into the CMS (2026-11-23),
   frozen, so these tests do not change every time a price changes in the
   Studio. lib/menu.snapshot.json is the live one the site builds from. */
import frozen from "./fixtures/menu.snapshot.json";
import { menus as before } from "./fixtures/menu.main";

const snap = frozen as MenuSnapshot;
const clone = (): MenuSnapshot => structuredClone(snap);
const carte = (s: MenuSnapshot) => s.menus.find((m) => m.id === "menu-bintang-carte")!;

describe("lib/menu (CMS adapter)", () => {
  it("turns the CMS snapshot into exactly the menus that were hard-coded before the move", () => {
    expect(menusFrom(snap)).toStrictEqual(before);
  });

  it("builds the live menus from the live snapshot, then adds the seasonal Christmas menu last", () => {
    expect(menus).toStrictEqual([...menusFrom(live as MenuSnapshot), CHRISTMAS_MENU]);
    expect(menusFrom(live as MenuSnapshot).map((m) => m.id)).toEqual(["carte", "brunch", "desserts", "karaoke"]);
    expect(menus.map((m) => m.id)).toEqual(["carte", "brunch", "desserts", "karaoke", "christmas"]);
  });

  it("lists the same printed sheets as the pull script checks against (cms.json)", () => {
    for (const [docId, parts] of Object.entries(cms.menus.parts)) {
      const id = docId.replace(/^menu-bintang-/, "") as keyof typeof SHEETS;
      expect(Object.keys(SHEETS[id]).sort()).toEqual([...parts].sort());
    }
    expect(Object.keys(cms.menus.parts).sort()).toEqual([...cms.menus.ids].sort());
  });

  it("knows every part the snapshots use", () => {
    for (const s of [snap, live as MenuSnapshot]) {
      for (const m of s.menus) {
        const id = m.id.replace(/^menu-bintang-/, "") as keyof typeof SHEETS;
        for (const sec of m.sections) expect(Object.keys(SHEETS[id])).toContain(sec.part);
      }
    }
  });

  it("leaves out hidden dishes", () => {
    const s = clone();
    const small = carte(s).sections.find((x) => x.title === "Small plates")!;
    small.items.find((i) => i.name === "Pandesal")!.hide = true;
    small.items.find((i) => i.name === "Okoy Fritters")!.hide = false;

    const sheet = menusFrom(s).find((m) => m.id === "carte")!.sheets[0];
    const names = sheet.sections.find((x) => x.title === "Small plates")!.items.map((i) => i.name);
    expect(names).not.toContain("Pandesal");
    expect(names).toContain("Okoy Fritters (GF) (VE)");
    expect(names).toHaveLength(small.items.length - 1);
  });

  it("leaves out a section whose dishes are all hidden, and a sheet left with nothing", () => {
    const s = clone();
    const desserts = s.menus.find((m) => m.id === "menu-bintang-desserts")!;
    for (const sec of desserts.sections.filter((x) => x.title === "Ice cream")) for (const i of sec.items) i.hide = true;
    const brunch = s.menus.find((m) => m.id === "menu-bintang-brunch")!;
    for (const sec of brunch.sections.filter((x) => x.wide)) for (const i of sec.items) i.hide = true;
    for (const sec of carte(s).sections.filter((x) => x.part === "Food")) for (const i of sec.items) i.hide = true;

    const out = menusFrom(s);
    const titles = out.find((m) => m.id === "desserts")!.sheets[0].sections.map((x) => x.title);
    expect(titles).toEqual(["Desserts", "Weekend brunch"]);
    expect(out.find((m) => m.id === "brunch")!.sheets[1].wide).toBeUndefined();
    expect(out.find((m) => m.id === "carte")!.sheets.map((x) => x.label)).toEqual(["À la carte · Drinks"]);
  });

  it("orders dietary marks V, GF, VE, PN whatever order the CMS stores them in", () => {
    const s = clone();
    const item = carte(s).sections[0].items[0];
    item.dietary = ["pn", "ve", "v", "gf"];
    expect(menusFrom(s)[0].sheets[0].sections[0].items[0].name).toBe(`${item.name} (V) (GF) (VE) (PN)`);
  });

  it("fails loudly on a missing menu or an unknown part", () => {
    const missing = clone();
    missing.menus = missing.menus.filter((m) => m.id !== "menu-bintang-karaoke");
    expect(() => menusFrom(missing)).toThrow(/menu-bintang-karaoke/);

    const stray = clone();
    carte(stray).sections[0].part = "Snacks";
    expect(() => menusFrom(stray)).toThrow(/unknown part "Snacks"/);
  });
});

describe("lib/menu: the Christmas 2026 menu (kept in code)", () => {
  it("is a pine-green, cream-text tab that ends with the promotion", () => {
    expect(CHRISTMAS_MENU).toMatchObject({
      id: "christmas",
      label: "Christmas",
      accent: "#EDE9E9",
      background: "#1D3A26",
      until: CHRISTMAS_ENDS,
    });
  });

  it("only the seasonal menu has an end date; the CMS menus never expire", () => {
    expect(menus.filter((m) => m.until !== undefined)).toEqual([CHRISTMAS_MENU]);
  });

  it("shows the two printed sheets as pictures that exist in public/, with alt text pointing to the text version", () => {
    expect(CHRISTMAS_MENU.sheets.map((s) => s.label)).toEqual(["Group set menu · £47", "Sharing set menu · £42"]);
    expect(CHRISTMAS_MENU.sheets.map((s) => s.image?.src)).toEqual([
      "/media/promo/christmas-menu-group.webp",
      "/media/promo/christmas-menu-sharing.webp",
    ]);
    for (const s of CHRISTMAS_MENU.sheets) {
      const img = s.image!;
      expect(existsSync(join(process.cwd(), "public", img.src)), img.src).toBe(true);
      expect([img.width, img.height]).toEqual([1654, 2339]);
      expect(img.alt).toMatch(/^The printed .+ The full menu follows as text\.$/);
      expect(s.legal).toBe(true);
      expect(s.sections.length).toBeGreaterThan(0);
    }
  });

  it("no CMS menu has a printed image (only the seasonal sheets do)", () => {
    for (const m of menusFrom(live as MenuSnapshot)) for (const s of m.sheets) expect(s.image).toBeUndefined();
  });
});

describe("lib/menu: the Christmas PDF", () => {
  it("exists in public/ and each printed sheet points at its own page of it", () => {
    expect(CHRISTMAS_PDF).toBe("/media/promo/bintang-christmas-menus.pdf");
    expect(existsSync(join(process.cwd(), "public", CHRISTMAS_PDF))).toBe(true);
    expect(CHRISTMAS_MENU.sheets.map((s) => [s.label, s.image?.pdf])).toEqual([
      ["Group set menu · £47", `${CHRISTMAS_PDF}#page=1`],
      ["Sharing set menu · £42", `${CHRISTMAS_PDF}#page=2`],
    ]);
  });
});
