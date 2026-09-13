
import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact New Print | Custom Printing in Kundapura",
  description:
    "Contact New Print for custom jersey printing, sports team apparel, T-shirts, and printing enquiries in Kundapura and Byndoor.",
  alternates: {
    canonical: "https://newprint.kundapura.in/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}