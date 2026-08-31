"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
CONSTANTS
============================================================ */

const WHATSAPP_NUMBER = "917406925565";

const WHATSAPP_MESSAGE =
"Hello New Print! I have a question about shipping, delivery or my order.";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

/* ============================================================
ICONS
============================================================ */

function PackageIcon({ size = 24 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <path d="m16.5 9.4-9-5.19" /> <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /> <path d="M3.27 6.96 12 12.01l8.73-5.05" /> <path d="M12 22.08V12" /> </svg>
);
}

function PrinterIcon({ size = 24 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <path d="M6 9V2h12v7" /> <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /> <path d="M6 14h12v8H6z" /> <path d="M18 13h.01" /> </svg>
);
}

function CheckIcon({ size = 20 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="2"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <path d="m5 12 4 4L19 6" /> </svg>
);
}

function TruckIcon({ size = 24 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <path d="M10 17h4V5H2v12h3" /> <path d="M14 8h4l4 4v5h-3" /> <circle cx="7.5" cy="17.5" r="2.5" /> <circle cx="16.5" cy="17.5" r="2.5" /> <path d="M14 12h8" /> </svg>
);
}

function MapPinIcon({ size = 24 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /> <circle cx="12" cy="10" r="2.5" /> </svg>
);
}

function SearchIcon({ size = 24 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <circle cx="11" cy="11" r="7" /> <path d="m20 20-4-4" /> </svg>
);
}

function ClockIcon({ size = 24 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <circle cx="12" cy="12" r="9" /> <path d="M12 7v5l3 2" /> </svg>
);
}

function ShieldIcon({ size = 24 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /> <path d="m9 12 2 2 4-4" /> </svg>
);
}

function WhatsAppIcon({ size = 22 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="currentColor"
   aria-hidden="true"
 > <path d="M20.52 3.48A11.84 11.84 0 0 0 12.05 0C5.52 0 .2 5.31.2 11.85c0 2.09.55 4.13 1.59 5.93L.1 24l6.37-1.67a11.83 11.83 0 0 0 5.58 1.42h.01c6.53 0 11.84-5.31 11.84-11.85 0-3.17-1.23-6.15-3.38-8.42ZM12.06 21.7h-.01a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.78.99 1.01-3.69-.23-.38a9.87 9.87 0 0 1-1.51-5.19c0-5.42 4.42-9.84 9.85-9.84 2.63 0 5.1 1.03 6.96 2.9a9.8 9.8 0 0 1 2.88 6.97c0 5.42-4.41 9.84-9.8 9.84Zm5.4-7.37c-.29-.15-1.72-.85-1.99-.95-.27-.1-.47-.15-.67.15-.2.3-.76.95-.94 1.15-.17.2-.35.22-.64.07-.29-.15-1.22-.45-2.33-1.44-.86-.76-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.35.43-.52.14-.17.19-.3.29-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.35Z" /> </svg>
);
}

function ArrowRightIcon({ size = 17 }: { size?: number }) {
return ( <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="2"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 > <path d="M5 12h14" /> <path d="m12 5 7 7-7 7" /> </svg>
);
}

/* ============================================================
SECTION LABEL
============================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
return ( <div className="flex items-center gap-2.5"> <span className="h-[2px] w-7 bg-[#B9954F]" /> <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#B9954F]">
{children} </span> </div>
);
}

/* ============================================================
DELIVERY STEPS
============================================================ */

const deliverySteps = [
{
number: "01",
title: "Order Confirmed",
text: "Once your order and payment are confirmed, we begin preparing it.",
},
{
number: "02",
title: "Printing & Preparation",
text: "Your selected product and personalised design are prepared for production.",
},
{
number: "03",
title: "Quality Check",
text: "We check the finished product before it is packed for delivery.",
},
{
number: "04",
title: "Securely Packed",
text: "Your order is carefully packed so it is ready for its journey.",
},
{
number: "05",
title: "Shipped with India Post",
text: "Your parcel is handed over to India Post for delivery.",
},
{
number: "06",
title: "Delivered",
text: "Your New Print order reaches the address provided at checkout.",
},
];

/* ============================================================
FAQ DATA
============================================================ */

const faqs = [
{
question: "Who delivers New Print orders?",
answer:
"New Print orders are shipped using India Post. Once your order is dispatched, tracking information can be used to follow the shipment.",
},
{
question: "When can I track my order?",
answer:
"Tracking becomes available after your order has been shipped. Your order tracking page will show the available shipment information.",
},
{
question: "How long will delivery take?",
answer:
"Delivery time can vary depending on the destination, postal network, holidays, weather and other circumstances. Customised products also require preparation and printing time before dispatch.",
},
{
question: "Can I change my delivery address?",
answer:
"If you need to change your address, contact New Print as soon as possible. Once an order has been shipped, changing the delivery address may not be possible.",
},
{
question: "What if my parcel is delayed?",
answer:
"Occasional delays can happen because of postal network conditions, weather, holidays or other circumstances outside New Print's control. If you need help, contact us on WhatsApp with your order details.",
},
{
question: "What if I receive a damaged parcel?",
answer:
"Please contact New Print as soon as possible and share your order number along with clear photos of the package and product so we can understand the issue and assist you.",
},
];

/* ============================================================
MAIN PAGE
============================================================ */

export default function ShippingPage() {
return (
<> <Navbar />

```
  <main className="overflow-hidden bg-[#F7F7F5] text-[#0A1B2E]">
    {/* ====================================================
        HERO
    ==================================================== */}
    <section className="relative flex min-h-[76svh] items-center justify-center overflow-hidden bg-[#0A1B2E] px-5 pb-16 pt-28 sm:min-h-[80svh] sm:px-8">
      {/* background rings */}
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
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#D4B979] sm:text-[10px]">
            New Print
          </span>

          <h1 className="mt-5 text-[43px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
            From our print floor
            <br />
            <span className="text-[#D4B979]">to your doorstep.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-6 text-white/60 sm:text-lg sm:leading-7">
            Your personalised order is carefully prepared, packed and
            shipped through India Post so your memories can make their way
            to you.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/dashboard"
              className="
                inline-flex
                min-h-12
                items-center
                justify-center
                gap-2
                rounded-[9px]
                bg-[#B9954F]
                px-7
                text-xs
                font-extrabold
                uppercase
                tracking-[0.1em]
                text-[#0A1B2E]
                transition-colors
                duration-150
                hover:bg-[#D4B979]
                active:scale-[0.98]
              "
            >
              Track My Order
              <ArrowRightIcon size={15} />
            </Link>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex
                min-h-12
                items-center
                justify-center
                gap-2.5
                rounded-[9px]
                border
                border-white/20
                bg-white/[0.04]
                px-7
                text-xs
                font-extrabold
                uppercase
                tracking-[0.1em]
                text-white
                transition-colors
                duration-150
                hover:bg-white/[0.08]
                active:scale-[0.98]
              "
            >
              <WhatsAppIcon size={18} />
              Ask on WhatsApp
            </a>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[9px] font-bold uppercase tracking-[0.13em] text-white/35 sm:text-[10px]">
            <span>India Post</span>
            <span className="h-1 w-1 rounded-full bg-[#B9954F]" />
            <span>Secure Packing</span>
            <span className="h-1 w-1 rounded-full bg-[#B9954F]" />
            <span>Order Tracking</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/30">
        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">
          Shipping
        </span>
        <span className="h-7 w-px bg-gradient-to-b from-white/45 to-transparent" />
      </div>
    </section>

    {/* ====================================================
        QUICK INFO
    ==================================================== */}
    <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
      <div className="text-center">
        <div className="flex justify-center">
          <SectionLabel>Delivery At A Glance</SectionLabel>
        </div>

        <h2 className="mt-5 text-[32px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
          Simple from start to finish.
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
          We keep the delivery process straightforward, with tracking
          available once your order has been shipped.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* India Post */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F5F2E8] text-[#B9954F]">
            <TruckIcon size={22} />
          </div>

          <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">
            Delivery Partner
          </p>

          <h3 className="mt-1 text-base font-extrabold">
            India Post
          </h3>

          <p className="mt-2 text-xs leading-5 text-[#64748B]">
            Your parcel is shipped through India Post after it has been
            prepared and packed.
          </p>
        </div>

        {/* Tracking */}
        <Link
          href="/dashboard"
          className="group rounded-[12px] border border-[#E5E7EB] bg-white p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-sm sm:p-6"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F5F2E8] text-[#B9954F]">
            <SearchIcon size={22} />
          </div>

          <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">
            Track
          </p>

          <h3 className="mt-1 flex items-center gap-2 text-base font-extrabold">
            Follow your order
            <ArrowRightIcon
              size={14}
            />
          </h3>

          <p className="mt-2 text-xs leading-5 text-[#64748B]">
            Once shipped, use your New Print tracking page to follow your
            order.
          </p>
        </Link>

        {/* Secure */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#F5F2E8] text-[#B9954F]">
            <ShieldIcon size={22} />
          </div>

          <p className="mt-5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">
            Before Shipping
          </p>

          <h3 className="mt-1 text-base font-extrabold">
            Quality checked
          </h3>

          <p className="mt-2 text-xs leading-5 text-[#64748B]">
            Your personalised product is checked and securely packed before
            it leaves us.
          </p>
        </div>
      </div>
    </section>

    {/* ====================================================
        HOW DELIVERY WORKS
    ==================================================== */}
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-4">
            <SectionLabel>Your Order's Journey</SectionLabel>

            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
              Made.
              <br />
              Packed.
              <br />
              Delivered.
            </h2>

            <p className="mt-5 text-sm leading-6 text-[#64748B] sm:text-base sm:leading-7">
              Your order goes through a few simple stages before reaching
              you.
            </p>

            <div className="mt-7 flex items-center gap-3 text-[#B9954F]">
              <PackageIcon size={24} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em]">
                Carefully handled
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-8">
            <div className="space-y-3">
              {deliverySteps.map((step, index) => (
                <div
                  key={step.number}
                  className="relative rounded-[11px] border border-[#E5E7EB] bg-[#F7F7F5] p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4C08D] bg-white text-[10px] font-extrabold text-[#0A1B2E]">
                      {step.number}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                        {step.title}
                      </h3>

                      <p className="mt-1.5 text-[11px] leading-5 text-[#64748B] sm:text-xs">
                        {step.text}
                      </p>
                    </div>
                  </div>

                  {index < deliverySteps.length - 1 && (
                    <div className="absolute bottom-[-13px] left-[21px] z-10 h-3 w-px bg-[#D9DDE2]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ====================================================
        DELIVERY TIME
    ==================================================== */}
    <section className="bg-[#F7F7F5] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="lg:col-span-5">
              <SectionLabel>Delivery Time</SectionLabel>

              <h2 className="mt-5 text-[30px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-4xl">
                Every order takes
                <br />
                its own journey.
              </h2>
            </div>

            <div className="lg:col-span-7">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] bg-[#F5F2E8] text-[#B9954F]">
                  <ClockIcon size={22} />
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                    Delivery times can vary
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-[#64748B] sm:text-sm sm:leading-7">
                    Your order first needs to be printed and prepared before
                    dispatch. After it is handed over to India Post, delivery
                    time depends on your destination and the postal network.
                  </p>
                </div>
              </div>

              <div className="mt-7 border-t border-[#E5E7EB] pt-6">
                <p className="text-[11px] leading-5 text-[#64748B]">
                  Weekends, public holidays, weather, postal conditions and
                  other unforeseen circumstances may affect delivery times.
                  We recommend using your tracking information once the order
                  has been shipped.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ====================================================
        SHIPPING INFORMATION
    ==================================================== */}
    <section className="bg-[#0A1B2E] px-5 py-16 text-white sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-20">
          <div className="lg:col-span-5">
            <SectionLabel>Shipping Information</SectionLabel>

            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-5xl">
              A little clarity
              <br />
              before delivery.
            </h2>

            <p className="mt-5 text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
              Here are the important things to know once your order is
              placed.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
            {[
              {
                icon: MapPinIcon,
                title: "Correct Address",
                text: "Please make sure your name, phone number, address, city, state and PIN code are correct.",
              },
              {
                icon: PrinterIcon,
                title: "Custom Printing",
                text: "Personalised products need preparation and printing time before they can be dispatched.",
              },
              {
                icon: PackageIcon,
                title: "Secure Packing",
                text: "Your finished product is packed before it is handed over for delivery.",
              },
              {
                icon: SearchIcon,
                title: "Shipment Tracking",
                text: "Tracking information becomes available after your order has been shipped.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[11px] border border-white/10 bg-white/[0.045] p-5 sm:p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/[0.06] text-[#D4B979]">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-5 text-sm font-extrabold text-white sm:text-base">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-white/50 sm:text-xs">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>

    {/* ====================================================
        IMPORTANT NOTES
    ==================================================== */}
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <SectionLabel>Good To Know</SectionLabel>

            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              A few things
              <br />
              worth knowing.
            </h2>
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-3">
              {[
                "Delivery dates are estimates and may vary depending on destination and postal conditions.",
                "Tracking information is available after the order has been dispatched.",
                "An incomplete or incorrect address can cause delivery delays or failed delivery attempts.",
                "Customised products require preparation and printing before dispatch.",
                "India Post delivery may be affected by weekends, holidays, weather or unforeseen events.",
                "If you have any concern about your order or delivery, contact New Print on WhatsApp.",
              ].map((text) => (
                <div
                  key={text}
                  className="flex gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5] p-4 sm:p-5"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F]">
                    <CheckIcon size={14} />
                  </div>

                  <p className="text-[11px] leading-5 text-[#64748B] sm:text-xs sm:leading-6">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ====================================================
        FAQ
    ==================================================== */}
    <section className="bg-[#F7F7F5] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center">
          <div className="flex justify-center">
            <SectionLabel>Shipping Questions</SectionLabel>
          </div>

          <h2 className="mt-5 text-[32px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
            Need a little clarity?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
            Here are some common questions about shipping and delivery.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[11px] border border-[#E5E7EB] bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-extrabold text-[#0A1B2E] [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>

                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F] transition-transform duration-200 group-open:rotate-45">
                  <span className="text-lg font-medium leading-none">
                    +
                  </span>
                </span>
              </summary>

              <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-4">
                <p className="text-[11px] leading-5 text-[#64748B] sm:text-xs sm:leading-6">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>

    {/* ====================================================
        TRACKING CTA
    ==================================================== */}
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F7F7F5] p-7 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] bg-white text-[#B9954F] shadow-sm">
            <SearchIcon size={23} />
          </div>

          <span className="mt-5 block text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#B9954F]">
            Already Ordered?
          </span>

          <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-4xl">
            See where your order is.
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#64748B]">
            Check your New Print order and see the latest available tracking
            information.
          </p>

          <Link
            href="/dashboard"
            className="
              mt-7
              inline-flex
              min-h-12
              items-center
              justify-center
              gap-2
              rounded-[9px]
              bg-[#0A1B2E]
              px-7
              text-xs
              font-extrabold
              uppercase
              tracking-[0.1em]
              text-white
              transition-colors
              duration-150
              hover:bg-[#142C46]
              active:scale-[0.98]
            "
          >
            Track My Order
            <ArrowRightIcon size={15} />
          </Link>
        </div>
      </div>
    </section>

    {/* ====================================================
        WHATSAPP HELP
    ==================================================== */}
    <section className="bg-[#0A1B2E] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#D4B979]">
          Need Help?
        </span>

        <h2 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
          Any doubts?
          <br />
          <span className="text-[#D4B979]">Just ask us.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
          If you need clarity about shipping, delivery, tracking, your
          address or your order, message us directly on WhatsApp.
        </p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-8
            inline-flex
            min-h-12
            items-center
            justify-center
            gap-3
            rounded-[9px]
            bg-[#B9954F]
            px-8
            text-xs
            font-extrabold
            uppercase
            tracking-[0.12em]
            text-[#0A1B2E]
            transition-colors
            duration-150
            hover:bg-[#D4B979]
            active:scale-[0.98]
          "
        >
          <WhatsAppIcon size={19} />
          Chat on WhatsApp
        </a>

        <p className="mt-3 text-[9px] font-semibold tracking-[0.08em] text-white/30">
          +91 74069 25565
        </p>
      </div>
    </section>

    {/* ====================================================
        FINAL NOTE
    ==================================================== */}
    <section className="bg-[#F7F7F5] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B9954F]">
          New Print
        </p>

        <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-[#64748B]">
          We prepare your personalised products with care and ship them
          through India Post to the delivery address provided with your
          order.
        </p>
      </div>
    </section>
  </main>

  <Footer />
</>

);
}
