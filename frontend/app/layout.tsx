import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { CartProvider } from "./components/cart/CartProvider";
import WhatsAppButton from "./components/WhatsAppButton";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "New Print",
    template: "%s | New Print",
  },

  description:
    "New Print - Custom jersey printing, apparel printing, and sports team printing.",

  applicationName: "New Print",

  keywords: [
    "New Print",
    "custom jerseys",
    "jersey printing",
    "sports team printing",
    "custom apparel",
    "custom t-shirts",
    "apparel printing",
  ],

  robots: {
    index: true,
    follow: true,
  },

  manifest: "/manifest.webmanifest",

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
        type: "image/png",
      },
    ],
  },

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
  maximumScale: 1,
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