import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Served at /robots.txt. Private and one-off pages are also marked noindex in their own layouts. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/setup", "/forgot-password", "/reset-password/", "/api/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
