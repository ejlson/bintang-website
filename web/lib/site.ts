/** Bintang's contact details and opening hours: used by the footer and the JSON-LD in app/layout. */

export const site = {
  street: "93 Kentish Town Road",
  locality: "London",
  postcode: "NW1 8NY",
  phone: "020 7267 2197",
  phoneIntl: "+442072672197",
  email: "bintangnw1@gmail.com",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Bintang+93+Kentish+Town+Road+London+NW1+8NY",
} as const;

/** Bintang's social accounts, shown as icons in the footer (and as sameAs in the JSON-LD). */
export const socials = [
  { name: "Instagram", handle: "@bintang_restaurant", url: "https://www.instagram.com/bintang_restaurant/" },
  { name: "TikTok", handle: "@bintang_restaurant", url: "https://www.tiktok.com/@bintang_restaurant" },
] as const;

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export type Hours = {
  /** Shown in the footer. */
  label: string;
  days: Day[];
  /** 24h "HH:MM"; null when closed. */
  opens: string | null;
  closes: string | null;
  /** Shown in the footer, e.g. "5–9.30pm". */
  time: string;
};

export const hours: Hours[] = [
  { label: "Tue–Thu", days: ["Tuesday", "Wednesday", "Thursday"], opens: "17:00", closes: "21:30", time: "5–9.30pm" },
  { label: "Fri–Sat", days: ["Friday", "Saturday"], opens: "11:00", closes: "22:00", time: "11am–10pm" },
  { label: "Sun", days: ["Sunday"], opens: "11:00", closes: "18:00", time: "11am–6pm" },
  { label: "Mon", days: ["Monday"], opens: null, closes: null, time: "Closed" },
];
