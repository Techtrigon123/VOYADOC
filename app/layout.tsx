import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import CookieConsent from "@/components/consent/CookieConsent";
import { SITE } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const defaultTitle = "Hotel Voucher, Air Ticket & Invoice Software for Travel Agents | TravelDoc Pro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: defaultTitle,
    template: "%s | TravelDoc Pro",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "travel document software",
    "travel agency software",
    "hotel voucher generator",
    "air ticket generator",
    "pickup voucher",
    "welcome placard maker",
    "travel GST invoice software",
    "proforma invoice for travel agents",
    "tour operator software India",
    "DMC software",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: SITE.name,
    title: defaultTitle,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className="min-h-screen bg-[var(--background)] antialiased">
        {children}
        <CookieConsent />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "8px",
              fontSize: "14px",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
