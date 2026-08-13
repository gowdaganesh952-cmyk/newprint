"use client";

import Link from "next/link";
import { useMemo } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   CONSTANTS
============================================================ */

const WHATSAPP_NUMBER =
  "917406925565";

const WHATSAPP_MESSAGE =
  "Hello New Print! I would like to know more about your personalised printing products.";

const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

/* ============================================================
   ICONS
============================================================ */

function WhatsAppIcon({
  size = 22,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.84 11.84 0 0 0 12.05 0C5.52 0 .2 5.31.2 11.85c0 2.09.55 4.13 1.59 5.93L.1 24l6.37-1.67a11.83 11.83 0 0 0 5.58 1.42h.01c6.53 0 11.84-5.31 11.84-11.85 0-3.17-1.23-6.15-3.38-8.42ZM12.06 21.7h-.01a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.78.99 1.01-3.69-.23-.38a9.87 9.87 0 0 1-1.51-5.19c0-5.42 4.42-9.84 9.85-9.84 2.63 0 5.1 1.03 6.96 2.9a9.8 9.8 0 0 1 2.88 6.97c0 5.42-4.41 9.84-9.8 9.84Zm5.4-7.37c-.29-.15-1.72-.85-1.99-.95-.27-.1-.47-.15-.67.15-.2.3-.76.95-.94 1.15-.17.2-.35.22-.64.07-.29-.15-1.22-.45-2.33-1.44-.86-.76-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.35.43-.52.14-.17.19-.3.29-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.35Z" />
    </svg>
  );
}

function MailIcon({
  size = 21,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon({
  size = 21,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function ClockIcon({
  size = 21,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ArrowRightIcon({
  size = 17,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function MessageIcon({
  size = 22,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

/* ============================================================
   SECTION LABEL
============================================================ */

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-[2px] w-7 bg-[#B9954F]" />

      <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#B9954F]">
        {children}
      </span>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function ContactPage() {
  const whatsappHref =
    useMemo(
      () => WHATSAPP_URL,
      []
    );

  return (
    <>
      <Navbar />

      <main className="overflow-hidden bg-[#F7F7F5] text-[#0A1B2E]">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative flex min-h-[76svh] items-center justify-center overflow-hidden bg-[#0A1B2E] px-5 pb-16 pt-28 sm:min-h-[78svh] sm:px-8">

          {/* subtle classical background */}

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            aria-hidden="true"
          >
            <div className="absolute -left-32 top-10 h-80 w-80 rounded-full border border-[#B9954F] sm:h-[420px] sm:w-[420px]" />

            <div className="absolute -right-40 bottom-[-100px] h-[500px] w-[500px] rounded-full border border-[#B9954F]" />

            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B9954F]" />
          </div>

          <div className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full bg-[#B9954F] opacity-[0.055] blur-3xl" />

          <div className="relative z-10 mx-auto w-full max-w-4xl text-center">

            <div className="contact-fade-in flex flex-col items-center">

              <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#D4B979] sm:text-[10px]">
                New Print
              </span>

              <h1 className="mt-5 text-[43px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
                Let's create
                <br />

                <span className="text-[#D4B979]">
                  something personal.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-[14px] leading-6 text-white/60 sm:text-lg sm:leading-7">
                Have a question about a T-shirt,
                mug, rotating photo frame or
                keychain? We're happy to help.
              </p>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-13 w-full max-w-xs items-center justify-center gap-3 rounded-[9px] bg-[#B9954F] px-7 text-xs font-extrabold uppercase tracking-[0.1em] text-[#0A1B2E] transition-colors duration-150 hover:bg-[#D4B979] sm:w-auto"
              >
                <WhatsAppIcon size={20} />

                Chat on WhatsApp
              </a>

              <p className="mt-3 text-[9px] font-semibold tracking-[0.08em] text-white/35">
                +91 74069 25565
              </p>
            </div>
          </div>

          {/* scroll */}

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/30">
            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">
              Contact
            </span>

            <span className="h-7 w-px bg-gradient-to-b from-white/45 to-transparent" />
          </div>
        </section>

        {/* ====================================================
            CONTACT OPTIONS
        ==================================================== */}

        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">

          <div className="text-center">
            <div className="flex justify-center">
              <SectionLabel>
                Reach Us
              </SectionLabel>
            </div>

            <h2 className="mt-5 text-[32px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
              We're here to help.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
              For the fastest response, send us a
              message on WhatsApp.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* WhatsApp */}

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[12px] border border-[#E5E7EB] bg-white p-5 transition-transform duration-200 hover:-translate-y-1 sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F5F2E8] text-[#B9954F]">
                <WhatsAppIcon size={22} />
              </div>

              <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">
                Fastest
              </p>

              <h3 className="mt-1 text-base font-extrabold text-[#0A1B2E]">
                WhatsApp
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#64748B]">
                Chat with us about your order,
                product or custom printing needs.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-extrabold text-[#0A1B2E]">
                +91 74069 25565

                <ArrowRightIcon size={13} />
              </div>
            </a>

            {/* Phone */}

            <a
              href="tel:+917406925565"
              className="group rounded-[12px] border border-[#E5E7EB] bg-white p-5 transition-transform duration-200 hover:-translate-y-1 sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F5F2E8] text-[#B9954F]">
                <PhoneIcon size={21} />
              </div>

              <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">
                Call
              </p>

              <h3 className="mt-1 text-base font-extrabold text-[#0A1B2E]">
                Give us a call
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#64748B]">
                Prefer talking directly? You can
                reach us on the same number.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-extrabold text-[#0A1B2E]">
                Call New Print

                <ArrowRightIcon size={13} />
              </div>
            </a>

            {/* Message */}

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[12px] border border-[#E5E7EB] bg-white p-5 transition-transform duration-200 hover:-translate-y-1 sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F5F2E8] text-[#B9954F]">
                <MessageIcon size={21} />
              </div>

              <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">
                Questions
              </p>

              <h3 className="mt-1 text-base font-extrabold text-[#0A1B2E]">
                Need help?
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#64748B]">
                Ask us about customisation,
                products, orders or anything else.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-extrabold text-[#0A1B2E]">
                Start a conversation

                <ArrowRightIcon size={13} />
              </div>
            </a>
          </div>
        </section>

        {/* ====================================================
            PRODUCT QUESTIONS
        ==================================================== */}

        <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto w-full max-w-7xl">

            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-20">

              <div className="lg:col-span-5">
                <SectionLabel>
                  What Can We Help With?
                </SectionLabel>

                <h2 className="mt-5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
                  Tell us what
                  <br />
                  you're creating.
                </h2>

                <p className="mt-5 text-sm leading-6 text-[#64748B] sm:text-base sm:leading-7">
                  Whether you already know what you
                  want or need help deciding, send us
                  a message and we'll guide you.
                </p>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex min-h-11 items-center gap-2.5 rounded-[9px] bg-[#0A1B2E] px-6 text-xs font-extrabold text-white transition-colors duration-150 hover:bg-[#142C46]"
                >
                  <WhatsAppIcon size={17} />
                  Message New Print
                </a>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">

                {[
                  {
                    number: "01",
                    title: "T-Shirt Printing",
                    text: "Questions about photos, designs or personalised T-shirts.",
                  },
                  {
                    number: "02",
                    title: "Mug Printing",
                    text: "Want to create a mug with a favourite photo or message?",
                  },
                  {
                    number: "03",
                    title: "Rotating Photo Frame",
                    text: "Ask us about the 4 × 4 rotating photo frame.",
                  },
                  {
                    number: "04",
                    title: "Keychains",
                    text: "Need a small personalised gift or keepsake?",
                  },
                ].map(
                  (item) => (
                    <div
                      key={
                        item.number
                      }
                      className="rounded-[11px] border border-[#E5E7EB] bg-[#F7F7F5] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-[0.16em] text-[#B9954F]">
                          {item.number}
                        </span>

                        <span className="h-[2px] w-7 bg-[#D9DDE2]" />
                      </div>

                      <h3 className="mt-5 text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-[11px] leading-5 text-[#64748B]">
                        {item.text}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            AVAILABILITY / RESPONSE
        ==================================================== */}

        <section className="bg-[#F7F7F5] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto w-full max-w-5xl">

            <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-6 sm:p-8 lg:p-10">

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">

                <div className="flex gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F2E8] text-[#B9954F]">
                    <ClockIcon size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                      Response
                    </p>

                    <h3 className="mt-1 text-sm font-extrabold text-[#0A1B2E]">
                      WhatsApp is easiest
                    </h3>

                    <p className="mt-1 text-[10px] leading-5 text-[#64748B]">
                      Send us your question and
                      we'll get back to you.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F2E8] text-[#B9954F]">
                    <PhoneIcon size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                      Phone
                    </p>

                    <h3 className="mt-1 text-sm font-extrabold text-[#0A1B2E]">
                      +91 74069 25565
                    </h3>

                    <p className="mt-1 text-[10px] leading-5 text-[#64748B]">
                      Call us when you need direct
                      assistance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F2E8] text-[#B9954F]">
                    <MessageIcon size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                      Support
                    </p>

                    <h3 className="mt-1 text-sm font-extrabold text-[#0A1B2E]">
                      Product & Order Help
                    </h3>

                    <p className="mt-1 text-[10px] leading-5 text-[#64748B]">
                      We're here to help with your
                      New Print experience.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            FINAL CTA
        ==================================================== */}

        <section className="bg-[#0A1B2E] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">

            <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#D4B979]">
              New Print
            </span>

            <h2 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
              Have something
              <br />
              in mind?
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/55">
              Tell us what you want to print and
              let's turn your idea into something
              personal.
            </p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-[9px] bg-[#B9954F] px-8 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0A1B2E] transition-colors duration-150 hover:bg-[#D4B979]"
            >
              <WhatsAppIcon size={18} />
              Chat on WhatsApp
            </a>

            <p className="mt-3 text-[9px] font-semibold text-white/30">
              +91 74069 25565
            </p>
          </div>
        </section>
      </main>

      <Footer />

      {/* ======================================================
          LIGHTWEIGHT HERO ANIMATION
          CSS ONLY — NO FRAMER MOTION
      ====================================================== */}

      <style jsx global>{`
        @keyframes contactFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .contact-fade-in {
          animation: contactFadeIn 650ms
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-fade-in {
            animation: none;
          }

          html {
            scroll-behavior: auto !important;
          }
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          overflow-x: hidden;
        }

        @media (max-width: 640px) {
          html {
            scroll-behavior: smooth;
          }

          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </>
  );
}