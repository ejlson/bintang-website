import type { Metadata } from "next";
import { MenuPage } from "@/components/MenuPage";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Bintang’s menus: à la carte Filipino plates, weekend brunch with silogs and bottomless drinks, Filipino desserts and karaoke.",
};

export default function Page() {
  return <MenuPage />;
}
