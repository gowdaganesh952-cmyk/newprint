"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   PRODUCT ICONS
============================================================ */

function ShirtIcon() {
  return (
    <svg
      viewBox="0 0 180 180"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M61 37 28 53c-6 3-9 9-7 15l7 27c1 5 7 8 12 6l18-6v55c0 7 5 12 12 12h64c7 0 12-5 12-12V95l18 6c5 2 11-1 12-6l7-27c2-6-1-12-7-15l-33-16-15 16H76L61 37Z"
        fill="#0A1B2E"
      />

      <path
        d="M76 37c2 13 13 22 28 22s26-9 28-22"
        stroke="#B9954F"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <rect
        x="72"
        y="75"
        width="64"
        height="46"
        rx="5"
        fill="#F7F7F5"
      />

      <path
        d="M87 98h34"
        stroke="#B9954F"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M104 88v20"
        stroke="#B9954F"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MugIcon() {
  return (
    <svg
      viewBox="0 0 180 180"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M42 60h82v60c0 13-10 23-23 23H65c-13 0-23-10-23-23V60Z"
        fill="#FFFFFF"
        stroke="#0A1B2E"
        strokeWidth="5"
      />

      <path
        d="M124 72h15c14 0 23 10 23 23s-9 23-23 23h-15"
        stroke="#0A1B2E"
        strokeWidth="5"
      />

      <path
        d="M58 91h50"
        stroke="#B9954F"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M83 78v27"
        stroke="#B9954F"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M68 135h51"
        stroke="#0A1B2E"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg
      viewBox="0 0 180 180"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M48 35h84v84H48z"
        fill="#B9954F"
        opacity=".18"
      />

      <rect
        x="43"
        y="30"
        width="94"
        height="94"
        rx="3"
        fill="#0A1B2E"
      />

      <rect
        x="53"
        y="40"
        width="74"
        height="74"
        rx="2"
        fill="#F7F7F5"
      />

      <path
        d="m61 101 20-23 14 15 9-10 16 18"
        stroke="#B9954F"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="78"
        cy="61"
        r="7"
        fill="#B9954F"
      />

      <path
        d="M90 124v20"
        stroke="#0A1B2E"
        strokeWidth="5"
      />

      <path
        d="M69 144h42"
        stroke="#0A1B2E"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeychainIcon() {
  return (
    <svg
      viewBox="0 0 180 180"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="90"
        cy="45"
        r="23"
        stroke="#0A1B2E"
        strokeWidth="7"
      />

      <path
        d="M90 68v20"
        stroke="#B9954F"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <rect
        x="48"
        y="86"
        width="84"
        height="60"
        rx="9"
        fill="#0A1B2E"
      />

      <rect
        x="59"
        y="97"
        width="62"
        height="38"
        rx="4"
        fill="#F7F7F5"
      />

      <circle
        cx="82"
        cy="116"
        r="7"
        fill="#B9954F"
      />

      <path
        d="M94 119h17"
        stroke="#B9954F"
        strokeWidth="4"
        strokeLinecap="round"
      />
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
   PRODUCT DATA
============================================================ */

const products = [
  {
    number: "01",
    name: "Custom T-Shirts",
    short: "Wear your memories.",
    description:
      "Turn your favourite photos and ideas into personalised T-shirts made to feel uniquely yours.",
    icon: ShirtIcon,
  },
  {
    number: "02",
    name: "Photo Mugs",
    short: "Start every day with a memory.",
    description:
      "A favourite photo, a special message, or a moment worth keeping — printed on a mug made for everyday use.",
    icon: MugIcon,
  },
  {
    number: "03",
    name: "4 × 4 Rotating Photo Frame",
    short: "A memory that keeps moving.",
    description:
      "A compact rotating photo frame designed to bring your favourite moments into view from every side.",
    icon: FrameIcon,
  },
  {
    number: "04",
    name: "Personalised Keychains",
    short: "Carry a little memory.",
    description:
      "Small, personal and easy to carry — turn a photo or design into a keychain that stays close to you.",
    icon: KeychainIcon,
  },
];

/* ============================================================
   MAIN PAGE
============================================================ */

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="overflow-hidden bg-[#F7F7F5] text-[#0A1B2E]">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative flex min-h-[88svh] items-center justify-center overflow-hidden bg-[#0A1B2E] px-5 pb-16 pt-28 sm:min-h-[92svh] sm:px-8">

          {/* subtle background pattern */}

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.055]"
            aria-hidden="true"
          >
            <div className="absolute -left-20 top-20 h-72 w-72 rounded-full border border-[#B9954F] sm:h-96 sm:w-96" />

            <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full border border-[#B9954F]" />

            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B9954F]" />
          </div>

          {/* gold accent */}

          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#B9954F] opacity-[0.06] blur-3xl" />

          <div className="relative z-10 mx-auto w-full max-w-5xl text-center">

            <div className="about-fade-in flex flex-col items-center">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#D4B979] sm:text-[10px]">
                New Print
              </span>

              <h1 className="mt-5 max-w-4xl text-[42px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[82px]">
                Your moments.
                <br />

                <span className="text-[#D4B979]">
                  Made to stay.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-6 text-white/65 sm:text-lg sm:leading-7">
                We turn your favourite photographs,
                memories and ideas into personalised
                products you can wear, use, display
                and carry every day.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex min-h-12 items-center justify-center rounded-[9px] bg-[#B9954F] px-7 text-xs font-extrabold uppercase tracking-[0.1em] text-[#0A1B2E] transition-colors duration-150 hover:bg-[#D4B979]"
                >
                  Explore Products
                </Link>

                <a
                  href="#our-story"
                  className="inline-flex min-h-12 items-center justify-center rounded-[9px] border border-white/20 bg-white/[0.04] px-7 text-xs font-extrabold uppercase tracking-[0.1em] text-white transition-colors duration-150 hover:bg-white/[0.08]"
                >
                  Our Story
                </a>
              </div>
            </div>

            {/* hero product strip */}

            <div className="about-fade-up mt-14 grid grid-cols-2 gap-2.5 sm:mt-16 sm:grid-cols-4 sm:gap-3">
              {products.map(
                (product) => {
                  const Icon =
                    product.icon;

                  return (
                    <div
                      key={
                        product.number
                      }
                      className="rounded-[10px] border border-white/10 bg-white/[0.045] px-3 py-4 backdrop-blur-sm"
                    >
                      <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14">
                        <Icon />
                      </div>

                      <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/75 sm:text-[10px]">
                        {product.name}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* scroll indicator */}

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/35">
            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">
              Scroll
            </span>

            <span className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
          </div>
        </section>

        {/* ====================================================
            INTRO / OUR STORY
        ==================================================== */}

        <section
          id="our-story"
          className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
        >
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">

            <div className="lg:col-span-5">
              <SectionLabel>
                Our Story
              </SectionLabel>

              <h2 className="mt-5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
                Some memories
                <br />
                deserve more
                <br />
                than a screen.
              </h2>
            </div>

            <div className="lg:col-span-7">
              <div className="space-y-5 text-[14px] leading-7 text-[#64748B] sm:text-lg sm:leading-8">
                <p>
                  Today, so many of our favourite
                  moments live inside our phones.
                  We scroll through them, smile,
                  and move on.
                </p>

                <p>
                  <span className="font-bold text-[#0A1B2E]">
                    New Print
                  </span>{" "}
                  is about bringing those moments
                  back into the real world.
                </p>

                <p>
                  We create personalised products
                  from the memories that matter to
                  you — from T-shirts and mugs to
                  rotating photo frames and
                  keychains.
                </p>
              </div>

              <div className="mt-7 h-px w-full bg-[#E5E7EB]" />

              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#B9954F]">
                Print something personal. Keep it close.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            PRODUCT WORLD
        ==================================================== */}

        <section className="bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto w-full max-w-7xl">

            <div className="max-w-2xl">
              <SectionLabel>
                What We Create
              </SectionLabel>

              <h2 className="mt-5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
                Made for the moments
                you don't want to forget.
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#64748B] sm:text-base">
                Choose a product, add your favourite
                memories, and create something that
                feels like yours.
              </p>
            </div>

            {/* desktop / tablet */}

            <div className="mt-12 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
              {products.map(
                (product) => {
                  const Icon =
                    product.icon;

                  return (
                    <div
                      key={
                        product.number
                      }
                      className="group rounded-[12px] border border-[#E5E7EB] bg-[#F7F7F5] p-5 transition-transform duration-200 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-[0.16em] text-[#B9954F]">
                          {product.number}
                        </span>

                        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                          New Print
                        </span>
                      </div>

                      <div className="mx-auto mt-5 h-36 w-36">
                        <Icon />
                      </div>

                      <h3 className="mt-5 text-lg font-extrabold text-[#0A1B2E]">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-[#B9954F]">
                        {product.short}
                      </p>

                      <p className="mt-3 text-xs leading-5 text-[#64748B]">
                        {product.description}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            {/* mobile horizontal slider */}

            <div className="mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-5 md:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {products.map(
                (product) => {
                  const Icon =
                    product.icon;

                  return (
                    <div
                      key={
                        product.number
                      }
                      className="w-[82vw] max-w-[330px] shrink-0 snap-center rounded-[12px] border border-[#E5E7EB] bg-[#F7F7F5] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-[0.16em] text-[#B9954F]">
                          {product.number}
                        </span>

                        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Product
                        </span>
                      </div>

                      <div className="mx-auto mt-5 h-40 w-40">
                        <Icon />
                      </div>

                      <h3 className="mt-5 text-xl font-extrabold text-[#0A1B2E]">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-[#B9954F]">
                        {product.short}
                      </p>

                      <p className="mt-3 text-xs leading-5 text-[#64748B]">
                        {product.description}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-5 text-center md:hidden">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
                Swipe to explore
              </span>
            </div>
          </div>
        </section>

        {/* ====================================================
            HOW IT WORKS
        ==================================================== */}

        <section className="bg-[#F7F7F5] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto w-full max-w-7xl">

            <div className="text-center">
              <div className="flex justify-center">
                <SectionLabel>
                  How It Works
                </SectionLabel>
              </div>

              <h2 className="mt-5 text-[32px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
                From your gallery
                <br className="sm:hidden" /> to
                something real.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
                Creating something personal should
                be simple. That's why we keep the
                process straightforward.
              </p>
            </div>

            <div className="relative mt-12 grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-3">

              {/* connector */}

              <div className="absolute left-[calc(12.5%-1px)] right-[calc(12.5%-1px)] top-9 hidden h-px bg-[#DDE2E7] md:block" />

              {[
                {
                  number: "01",
                  title: "Choose",
                  text: "Pick the product you want to personalise.",
                },
                {
                  number: "02",
                  title: "Upload",
                  text: "Add the photos or design you want printed.",
                },
                {
                  number: "03",
                  title: "We Print",
                  text: "Your chosen memory becomes your personalised product.",
                },
                {
                  number: "04",
                  title: "Enjoy",
                  text: "Receive something made especially for you.",
                },
              ].map(
                (step) => (
                  <div
                    key={
                      step.number
                    }
                    className="relative rounded-[11px] border border-[#E5E7EB] bg-white p-5 md:border-0 md:bg-transparent md:p-3 md:text-center"
                  >
                    <div className="flex items-center gap-4 md:flex-col">
                      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D4C08D] bg-[#F7F7F5] text-xs font-extrabold text-[#0A1B2E]">
                        {step.number}
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                          {step.title}
                        </h3>

                        <p className="mt-1 text-[11px] leading-5 text-[#64748B] md:mt-3 md:text-xs">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            WHY NEW PRINT
        ==================================================== */}

        <section className="bg-[#0A1B2E] px-5 py-20 text-white sm:px-8 sm:py-28">
          <div className="mx-auto w-full max-w-7xl">

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-20">

              <div className="lg:col-span-5">
                <SectionLabel>
                  Why New Print
                </SectionLabel>

                <h2 className="mt-5 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                  Simple products.
                  <br />
                  Personal meaning.
                </h2>

                <p className="mt-5 text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
                  We believe personalised products
                  are more than things. They are small
                  reminders of people, places and
                  moments that matter.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
                {[
                  {
                    title: "Made Personal",
                    text: "Your photos and ideas make every order your own.",
                  },
                  {
                    title: "Everyday Memories",
                    text: "Wear them, use them, display them or carry them.",
                  },
                  {
                    title: "Simple Experience",
                    text: "Choose your product and upload your memories without unnecessary steps.",
                  },
                  {
                    title: "Made to Gift",
                    text: "Create something personal for yourself or someone important.",
                  },
                ].map(
                  (item) => (
                    <div
                      key={
                        item.title
                      }
                      className="rounded-[11px] border border-white/10 bg-white/[0.045] p-5 sm:p-6"
                    >
                      <div className="mb-5 h-[2px] w-7 bg-[#B9954F]" />

                      <h3 className="text-sm font-extrabold text-white sm:text-base">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-[11px] leading-5 text-white/50 sm:text-xs">
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
            MEMORY STATEMENT
        ==================================================== */}

        <section className="relative overflow-hidden bg-white px-5 py-24 sm:px-8 sm:py-36">

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B9954F]/10"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B9954F]/[0.06]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl text-center">

            <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#B9954F]">
              Keep the moment
            </span>

            <h2 className="mt-5 text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#0A1B2E] sm:text-6xl">
              Photos are memories.
              <br />

              <span className="text-[#B9954F]">
                Prints make them real.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base sm:leading-7">
              Whether it is a gift, a celebration,
              a friendship, a family moment, or
              simply a photo you love — give it a
              place outside your phone.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[9px] bg-[#0A1B2E] px-7 text-xs font-extrabold uppercase tracking-[0.1em] text-white transition-colors duration-150 hover:bg-[#142C46]"
            >
              Start Creating
            </Link>
          </div>
        </section>

        {/* ====================================================
            PRODUCT MINI BANNER
        ==================================================== */}

        <section className="border-t border-[#E5E7EB] bg-[#F7F7F5] px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto w-full max-w-7xl">

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {products.map(
                (product) => {
                  const Icon =
                    product.icon;

                  return (
                    <Link
                      href="/products"
                      key={
                        product.number
                      }
                      className="group rounded-[10px] border border-[#E5E7EB] bg-white p-3 transition-colors duration-150 hover:border-[#D4C08D] sm:p-4"
                    >
                      <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24">
                        <Icon />
                      </div>

                      <p className="mt-2 text-center text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#0A1B2E] sm:text-[10px]">
                        {product.name}
                      </p>
                    </Link>
                  );
                }
              )}
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
              What will you
              <br />
              print today?
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/55">
              Turn a favourite photograph into
              something you can keep, use, gift
              and enjoy every day.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[9px] bg-[#B9954F] px-8 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0A1B2E] transition-colors duration-150 hover:bg-[#D4B979]"
            >
              Explore New Print
            </Link>
          </div>
        </section>

      </main>

      <Footer />

      {/* ======================================================
          LIGHTWEIGHT ANIMATIONS
          CSS ONLY — NO FRAMER MOTION
      ====================================================== */}

      <style jsx global>{`
        @keyframes aboutFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes aboutFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .about-fade-in {
          animation: aboutFadeIn 650ms cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .about-fade-up {
          animation: aboutFadeUp 750ms 120ms
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        @media (prefers-reduced-motion: reduce) {
          .about-fade-in,
          .about-fade-up {
            animation: none;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </>
  );
}