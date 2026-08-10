import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { CartProvider } from "./components/cart/CartProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "New Print",
  description:
    "New Print - Custom jersey printing, apparel printing, and sports team printing.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <CartProvider>
            {children}
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}