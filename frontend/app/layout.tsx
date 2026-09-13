
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { CartProvider } from "./components/cart/CartProvider";
import WhatsAppButton from "./components/WhatsAppButton";

import "./globals.css";

export const SITE_URL = "https://newprint.kundapura.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      "New Print | Custom Jersey Printing in Kundapura & Byndoor",
    template: "%s | New Print",
  },

  description:
    "New Print offers custom jersey printing, sports team jerseys, custom T-shirts, and apparel printing. Explore New Print online for customers in Kundapura, Byndoor, and nearby areas.",

  applicationName: "New Print",

  authors: [{ name: "New Print" }],
  creator: "New Print",
  publisher: "New Print",

  keywords: [
    "New Print",
    "New Print Kundapura",
    "New Print Byndoor",
    "New Print Kundapura Byndoor",
    "New Print jersey printing",
    "New Print custom jerseys",
    "custom jersey printing Kundapura",
    "custom jersey printing Byndoor",
    "jersey printing Kundapura",
    "jersey printing Byndoor",
    "sports jerseys Kundapura",
    "custom T-shirts Kundapura",
    "custom apparel printing",
  ],

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "New Print",
    title:
      "New Print | Custom Jersey Printing in Kundapura & Byndoor",
    description:
      "Custom jerseys, sports team printing, custom T-shirts, and apparel printing by New Print.",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "New Print - Custom Jersey Printing",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "New Print | Custom Jersey Printing in Kundapura & Byndoor",
    description:
      "Custom jerseys and apparel printing by New Print.",
    images: ["/opengraph-image.jpg"],
  },

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
  },

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    title: "New Print",
    statusBarStyle: "default",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A1B2E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" data-scroll-behavior="smooth">
        <body
          className="
            min-h-[100dvh]
            w-full
            overflow-x-hidden
            bg-white
            text-[#0A1B2E]
            antialiased
          "
        >
          <CartProvider>
            {children}
            <WhatsAppButton />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}