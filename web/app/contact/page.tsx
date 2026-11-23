import type { Metadata } from "next";
import { ContactPage } from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Find Bintang at 93 Kentish Town Road, London NW1 8NY: phone, email, opening hours and table bookings.",
};

export default function Page() {
  return <ContactPage />;
}
