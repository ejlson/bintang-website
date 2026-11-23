import { describe, expect, it } from "vitest";
import { menus, menusFrom, SHEETS, type MenuSnapshot } from "@/lib/menu";
import snapshot from "@/lib/menu.snapshot.json";
import { menus as before } from "./fixtures/menu.main";

const snap = snapshot as MenuSnapshot;
const clone = (): MenuSnapshot => structuredClone(snap);
const carte = (s: MenuSnapshot) => s.menus.find((m) => m.id === "menu-bintang-carte")!;

describe("lib/menu (CMS adapter)", () => {
  it("turns the CMS snapshot into exactly the menus that were hard-coded before the move", () => {
    expect(menus).toStrictEqual(before);
  });

  it("knows every part the snapshot uses", () => {
    for (const m of snap.menus) {
      const id = m.id.replace(/^menu-bintang-/, "") as keyof typeof SHEETS;
      for (const s of m.sections) expect(Object.keys(SHEETS[id])).toContain(s.part);
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
