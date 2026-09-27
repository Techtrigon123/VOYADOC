import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://voyenta.com";

type Entry = [path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]];

// Public pages only — the dashboard sits behind login.
const PAGES: Entry[] = [
  ["", 1, "weekly"],
  ["/signup", 0.9, "monthly"],
  ["/login", 0.8, "monthly"],
  ["/about", 0.6, "monthly"],
  ["/contact", 0.6, "monthly"],
  ["/tools/hotel-voucher", 0.7, "monthly"],
  ["/tools/proforma-invoice", 0.7, "monthly"],
  ["/tools/gst-invoice", 0.7, "monthly"],
  ["/tools/payment-receipt", 0.7, "monthly"],
  ["/tools/travel-quotation", 0.7, "monthly"],
  ["/tools/document-polish", 0.5, "monthly"],
  ["/tools/pdf-export", 0.5, "monthly"],
  ["/privacy", 0.3, "yearly"],
  ["/terms", 0.3, "yearly"],
  ["/refunds", 0.3, "yearly"],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(([path, priority, changeFrequency]) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
