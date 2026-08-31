"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
WHATSAPP
============================================================ */

const WHATSAPP_NUMBER = "917406925565";

const WHATSAPP_MESSAGE =
"Hello New Print! I would like to discuss a return or refund for my order.";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

/* ============================================================
ICONS
============================================================ */

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

function RefreshIcon({ size = 25 }: { size?: number }) {
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
 > <path d="M20 11a8.1 8.1 0 0 0-14.9-4L3 9" /> <path d="M3 4v5h5" /> <path d="M4 13a8.1 8.1 0 0 0 14.9 4L21 15" /> <path d="M21 20v-5h-5" /> </svg>
);
}

function MessageIcon({ size = 25 }: { size?: number }) {
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
 > <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.55 9.55 0 0 1-4.1-.9L3 21l1.5-4.1A8.1 8.1 0 0 1 3 11.5 8.38 8.38 0 0 1 12 3a8.38 8.38 0 0 1 9 8.5Z" /> <path d="M8 11h.01" /> <path d="M12 11h.01" /> <path d="M16 11h.01" /> </svg>
);
}

function CheckIcon({ size = 19 }: { size?: number }) {
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

function AlertIcon({ size = 24 }: { size?: number }) {
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
 > <path d="M10.3 3.6 2.4 17.3A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.7L13.7 3.6a2 2 0 0 0-3.4 0Z" /> <path d="M12 9v4" /> <path d="M12 17h.01" /> </svg>
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

function ShieldIcon({ size = 25 }: { size?: number }) {
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

/* ============================================================
SECTION LABEL
============================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
return ( <div className="flex items-center gap-2.5"> <span className="h-[2px] w-7 bg-[#B9954F]" /> <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#B9954F]">
{children} </span> </div>
);
}

/* ============================================================
MAIN PAGE
============================================================ */

export default function ReturnsRefundsPage() {
return (
<> <Navbar />

```
  <main className="overflow-hidden bg-[#F7F7F5] text-[#0A1B2E]">
    {/* ====================================================
        HERO
    ==================================================== */}
    <section className="relative flex min-h-[76svh] items-center justify-center overflow-hidden bg-[#0A1B2E] px-5 pb-16 pt-28 sm:min-h-[80svh] sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
      >
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full border border-[#B9954F] sm:h-[420px] sm:w-[420px]" />
        <div className="absolute -right-40 bottom-[-100px] h-[500px] w-[500px] rounded-full border border-[#B9954F]" />
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B9954F]" />
      </div>

      <div className="absolute right-[-100px] top-[-80px] h-72 w-72 rounded-full bg-[#B9954F] opacity-[0.05] blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#D4B979] sm:text-[10px]">
          New Print
        </span>

        <h1 className="mt-5 text-[43px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
          Returns &{" "}
          <span className="text-[#D4B979]">Refunds.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-6 text-white/60 sm:text-lg sm:leading-7">
          Have an issue with your order? Don't worry. Contact us first,
          explain what happened, and we'll discuss the best way forward with
          you.
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
            tracking-[0.1em]
            text-[#0A1B2E]
            transition-colors
            duration-150
            hover:bg-[#D4B979]
            active:scale-[0.98]
          "
        >
          <WhatsAppIcon size={19} />
          Discuss on WhatsApp
        </a>

        <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30">
          Every request is reviewed individually
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/30">
        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">
          Returns
        </span>
        <span className="h-7 w-px bg-gradient-to-b from-white/45 to-transparent" />
      </div>
    </section>

    {/* ====================================================
        MAIN MESSAGE
    ==================================================== */}
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F7F7F5] p-7 text-center sm:p-10 lg:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#B9954F] shadow-sm">
            <MessageIcon size={27} />
          </div>

          <SectionLabel>
            <span>Before Anything Else</span>
          </SectionLabel>

          <h2 className="mt-5 text-[30px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-4xl">
            Let's talk about it first.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base sm:leading-7">
            Because New Print creates personalised products, we prefer to
            understand the situation before deciding whether a return,
            replacement, refund or another solution is appropriate.
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-[#64748B]">
            Contact us with your order details and explain the issue. We'll
            discuss it with you and decide the best possible resolution.
          </p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              mt-7
              inline-flex
              min-h-12
              items-center
              justify-center
              gap-2.5
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
            <WhatsAppIcon size={18} />
            Contact Us
          </a>
        </div>
      </div>
    </section>

    {/* ====================================================
        HOW IT WORKS
    ==================================================== */}
    <section className="bg-[#F7F7F5] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-4">
            <SectionLabel>How It Works</SectionLabel>

            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
              Simple.
              <br />
              Personal.
              <br />
              Fair.
            </h2>

            <p className="mt-5 text-sm leading-6 text-[#64748B] sm:text-base sm:leading-7">
              We don't want you to struggle with a complicated return
              process. Tell us what happened and we'll take it from there.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Contact Us",
                  text: "Message us on WhatsApp and share your order number and the issue.",
                },
                {
                  number: "02",
                  title: "We Discuss",
                  text: "We'll understand what happened and may ask for photos or other details.",
                },
                {
                  number: "03",
                  title: "We Decide Together",
                  text: "After reviewing the situation, we'll discuss the most appropriate solution.",
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F2E8] text-[10px] font-extrabold text-[#B9954F]">
                    {step.number}
                  </div>

                  <h3 className="mt-5 text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-[#64748B] sm:text-xs sm:leading-6">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ====================================================
        WHAT TO CONTACT US ABOUT
    ==================================================== */}
    <section className="bg-[#0A1B2E] px-5 py-16 text-white sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-20">
          <div className="lg:col-span-5">
            <SectionLabel>We're Here To Listen</SectionLabel>

            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-5xl">
              Not sure what
              <br />
              to do?
            </h2>

            <p className="mt-5 text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
              If something isn't right with your New Print order, contact
              us before taking any action.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  icon: AlertIcon,
                  title: "Product Issue",
                  text: "Something is wrong with the product or printing.",
                },
                {
                  icon: RefreshIcon,
                  title: "Return Request",
                  text: "You believe your order needs to be returned.",
                },
                {
                  icon: MessageIcon,
                  title: "Refund Question",
                  text: "You want to discuss whether a refund may be appropriate.",
                },
                {
                  icon: ShieldIcon,
                  title: "Order Problem",
                  text: "Your order arrived differently from what you expected.",
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
      </div>
    </section>

    {/* ====================================================
        CUSTOM PRODUCTS
    ==================================================== */}
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-[13px] border border-[#E5E7EB] bg-[#F7F7F5] p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-white text-[#B9954F] shadow-sm">
              <RefreshIcon size={22} />
            </div>

            <h3 className="mt-6 text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
              Personalised products
            </h3>

            <p className="mt-3 text-xs leading-6 text-[#64748B] sm:text-sm">
              Many New Print products are prepared according to the
              selections and customisation submitted with your order.
              Because of this, return and refund requests need to be
              discussed with us individually.
            </p>
          </div>

          <div className="rounded-[13px] border border-[#E5E7EB] bg-[#F7F7F5] p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-white text-[#B9954F] shadow-sm">
              <ShieldIcon size={22} />
            </div>

            <h3 className="mt-6 text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
              We review the situation
            </h3>

            <p className="mt-3 text-xs leading-6 text-[#64748B] sm:text-sm">
              We may ask for your order number, photos, videos or other
              information that helps us understand the problem before
              deciding the appropriate resolution.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* ====================================================
        WHAT TO SEND
    ==================================================== */}
    <section className="bg-[#F7F7F5] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="text-center">
          <div className="flex justify-center">
            <SectionLabel>Before You Contact Us</SectionLabel>
          </div>

          <h2 className="mt-5 text-[32px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
            Keep these details ready.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#64748B]">
            This helps us understand your request faster.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            "Your New Print order number",
            "Name used when placing the order",
            "A clear description of the issue",
            "Clear photos or videos, if relevant",
            "Photos of the packaging, if the parcel was damaged",
            "Any other information that may help us understand the problem",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-white p-4 sm:p-5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F]">
                <CheckIcon size={14} />
              </div>

              <span className="text-[11px] font-semibold leading-5 text-[#64748B] sm:text-xs">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ====================================================
        IMPORTANT NOTICE
    ==================================================== */}
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[13px] border border-[#E7D9B7] bg-[#FBF8EF] p-6 sm:p-8">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] bg-white text-[#B9954F] shadow-sm">
              <AlertIcon size={22} />
            </div>

            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F]">
                Important
              </p>

              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
                Please contact us before sending anything back.
              </h2>

              <p className="mt-3 text-xs leading-6 text-[#64748B] sm:text-sm">
                Do not send a product back to New Print without first
                contacting us and receiving instructions. We need to review
                your situation and discuss the next step with you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ====================================================
        FAQ
    ==================================================== */}
    <section className="bg-[#F7F7F5] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <div className="flex justify-center">
            <SectionLabel>Common Questions</SectionLabel>
          </div>

          <h2 className="mt-5 text-[32px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-5xl">
            Return & refund clarity.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            {
              question: "Can I return my order?",
              answer:
                "Please contact us first. Because many New Print products are personalised, we'll discuss your specific situation before deciding whether a return is appropriate.",
            },
            {
              question: "Can I get a refund?",
              answer:
                "If you believe you should receive a refund, contact us with your order details and explain the issue. We'll review the situation and discuss the appropriate resolution.",
            },
            {
              question: "What if my printed product has a problem?",
              answer:
                "Contact us as soon as possible and share clear photos or videos of the issue along with your order number. We'll review it with you.",
            },
            {
              question: "What if I simply changed my mind?",
              answer:
                "Please contact us and discuss your situation before taking any action. Since customised products may be prepared specifically for your order, the available options can depend on the circumstances.",
            },
            {
              question: "Should I send the product back immediately?",
              answer:
                "No. Please contact New Print first. We will discuss the issue and provide instructions if a return is appropriate.",
            },
            {
              question: "How do I contact New Print?",
              answer:
                "The easiest way is to message us directly on WhatsApp. Include your order number and a short explanation of the issue.",
            },
          ].map((faq) => (
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
        WHATSAPP CTA
    ==================================================== */}
    <section className="bg-[#0A1B2E] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#D4B979]">
          Let's Sort It Out
        </span>

        <h2 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
          Have a return or
          <br />
          refund question?
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
          Don't worry about figuring it out yourself. Message us, tell us
          what happened, and we'll discuss it with you.
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
          <ArrowRightIcon size={15} />
        </a>

        <p className="mt-4 text-[9px] font-semibold tracking-[0.08em] text-white/30">
          +91 74069 25565
        </p>
      </div>
    </section>

    {/* ====================================================
        FOOTNOTE
    ==================================================== */}
    <section className="bg-[#F7F7F5] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B9954F]">
          New Print
        </p>

        <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-[#64748B]">
          If something isn't right with your order, please reach out to us.
          We'll listen, understand the situation and discuss the best way
          forward.
        </p>
      </div>
    </section>
  </main>

  <Footer />
</>
);
}
