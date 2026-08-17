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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-[100dvh] overflow-x-hidden bg-white text-black antialiased">
          <CartProvider>
            {children}
            <WhatsAppButton />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}