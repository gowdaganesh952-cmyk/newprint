
import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Custom Jerseys & Apparel | New Print",
  description:
    "Explore New Print custom jerseys, sports team jerseys, custom T-shirts, and apparel printing products.",
  alternates: {
    canonical: "https://newprint.kundapura.in/products",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}