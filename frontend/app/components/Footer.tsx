"use client";

import Link from "next/link";

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" />
      <path d="M8.5 9.2c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.3l.6 1.3c.1.2.1.4-.1.6l-.4.5c.5 1 1.3 1.7 2.3 2.2l.5-.5c.2-.2.4-.2.6-.1l1.3.6c.2.1.3.2.3.4v.4c0 .3-.1.5-.4.7-.3.2-.8.3-1.2.2-2.9-.6-5.2-2.9-5.8-5.8-.1-.4 0-.9.2-1.2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[#E5E7EB] bg-[#0A1B2E] text-white">
      {/* Very subtle background detail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#B9954F]/[0.035] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            BRAND / CTA
        ====================================================== */}

        <div className="border-b border-white/[0.08] py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

            <div className="max-w-xl">
              <Link
                href="/"
                className="inline-block text-[26px] font-extrabold tracking-[-0.04em] text-white"
              >
                New<span className="text-[#B9954F]">Print</span>
              </Link>

              <p className="mt-3 max-w-md text-sm leading-6 text-[#AAB6C4] sm:text-[15px] sm:leading-7">
                Quality printing and personalised products, made with care
                for every order.
              </p>
            </div>

            <Link
              href="/products"
              className="group inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white transition-colors duration-200 hover:border-[#B9954F]/40 hover:bg-[#B9954F]/10"
            >
              Explore Products
              <ArrowIcon className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* =====================================================
            LINKS
        ====================================================== */}

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 sm:grid-cols-4 sm:gap-8 sm:py-12 lg:py-14">

          {/* SHOP */}
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
              Shop
            </h2>

            <ul className="mt-5 space-y-3.5">
              <li>
                <Link
                  href="/products"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  All Products
                </Link>
              </li>

              <li>
                <Link
                  href="/products"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Featured
                </Link>
              </li>

              <li>
                <Link
                  href="/cart"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
              Company
            </h2>

            <ul className="mt-5 space-y-3.5">
              <li>
                <Link
                  href="/"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/about"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* CUSTOMER */}
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
              Customer
            </h2>

            <ul className="mt-5 space-y-3.5">
              <li>
                <Link
                  href="/account"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  My Account
                </Link>
              </li>

              <li>
                <Link
                  href="/orders"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  My Orders
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
              Information
            </h2>

            <ul className="mt-5 space-y-3.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Terms & Conditions
                </Link>
              </li>

              <li>
                <Link
                  href="/shipping"
                  className="text-[13px] text-[#AAB6C4] transition-colors hover:text-white"
                >
                  Shipping Information
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* =====================================================
            CONTACT STRIP
        ====================================================== */}

        <div className="border-t border-white/[0.08] py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">

              <div className="flex items-center gap-2.5 text-xs text-[#9BA8B6]">
                <LocationIcon />
                <span>India</span>
              </div>

              <div className="hidden h-3.5 w-px bg-white/10 sm:block" />

              <Link
                href="/contact"
                className="flex items-center gap-2.5 text-xs text-[#9BA8B6] transition-colors hover:text-white"
              >
                <MailIcon />
                <span>Contact NewPrint</span>
              </Link>
            </div>

            {/* SOCIAL */}
            <div className="flex items-center gap-2.5">
              <a
                href="#"
                aria-label="NewPrint on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#AAB6C4] transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                <InstagramIcon />
              </a>

              <a
                href="#"
                aria-label="NewPrint on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#AAB6C4] transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>
        </div>

        {/* =====================================================
            COPYRIGHT
        ====================================================== */}

        <div className="border-t border-white/[0.08] py-6">
          <div className="flex flex-col gap-2.5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

            <p className="text-[11px] leading-5 text-[#718093]">
              © {year} NewPrint. All rights reserved.
            </p>

            <p className="text-[11px] leading-5 text-[#718093]">
              Designed & developed by{" "}
              <span className="font-semibold text-[#AAB6C4]">
                NewPrint&apos;s in-house tech team
              </span>
              .
            </p>

          </div>
        </div>

      </div>
    </footer>
  );
}