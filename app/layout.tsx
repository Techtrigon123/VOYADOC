import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { FlamePointer } from "@/components/ui/flame-pointer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Travel Document Software for Travel Agents | TravelDoc Pro",
    template: "%s | TravelDoc Pro",
  },
  description:
    "Create professional hotel vouchers, invoices, receipts, quotations and other travel documents from one centralized workspace.",
  keywords: [
    "travel document software",
    "travel agency software",
    "travel agent document generator",
    "hotel voucher generator",
    "travel invoice generator",
    "travel quotation software",
    "travel document management",
    "travel agency invoice software",
    "travel voucher generator",
    "tour operator software",
  ],
  authors: [{ name: "TravelDoc Pro" }],
  creator: "TravelDoc Pro",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://traveldocpro.com",
    siteName: "TravelDoc Pro",
    title: "Travel Document Software for Travel Agents | TravelDoc Pro",
    description:
      "Create professional hotel vouchers, invoices, receipts, quotations and other travel documents from one centralized workspace.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TravelDoc Pro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TravelDoc Pro — Travel Document Software for Travel Agents",
    description:
      "Create professional hotel vouchers, invoices, receipts, quotations and other travel documents from one centralized workspace.",
    images: ["/og-image.png"],
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[var(--background)] antialiased">
        {children}
        <FlamePointer />
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