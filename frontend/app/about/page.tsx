
import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About New Print | Custom Printing in Kundapura",
  description:
    "Learn about New Print and our custom jersey printing, sports apparel, and T-shirt printing services.",
  alternates: {
    canonical: "https://newprint.kundapura.in/about",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}