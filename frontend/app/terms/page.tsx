import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const WHATSAPP_NUMBER = "917406925565";

const WHATSAPP_MESSAGE =
"Hello New Print, I have a question about the Terms & Conditions.";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

const sections = [
{
number: "01",
title: "Using New Print",
content: (
<> <p>
New Print provides products, printing and customisation services
through its website. By using our website, you agree to use the
website lawfully and responsibly. </p> <p>
You must not use the website in a way that could damage, disrupt or
interfere with our website, services or other users. </p>
</>
),
},
{
number: "02",
title: "Your Account",
content: (
<> <p>
Some features of New Print may require you to create or use an
account. You are responsible for providing accurate information. </p> <p>
Please keep your account information and login credentials secure and
do not knowingly allow unauthorised access to your account. </p>
</>
),
},
{
number: "03",
title: "Orders",
content: (
<> <p>
When placing an order, you are responsible for checking the product,
size, colour, quantity, customisation, text, images and other
selections before completing your purchase. </p> <p>
Once an order has entered production or customisation, changes or
cancellation may not always be possible. </p>
</>
),
},
{
number: "04",
title: "Customised Products",
content: (
<> <p>
New Print may offer personalised and customised products. These
products can be prepared according to the information and
customisation provided by you. </p> <p>
You are responsible for checking names, numbers, sizes, artwork,
images, colours and other information before placing your order. </p> <p>
Due to the nature of printing and manufacturing, minor variations in
colour, positioning or appearance may sometimes occur. </p>
</>
),
},
{
number: "05",
title: "Images, Designs & Uploaded Content",
content: (
<> <p>
If you upload an image, logo, artwork, text or other content, you
confirm that you have the necessary rights or permission to use that
content. </p> <p>
You must not upload content that infringes another person's
intellectual property, privacy or other legal rights. </p> <p>
New Print may refuse to process content that appears to be unlawful,
harmful, abusive or otherwise inappropriate. </p>
</>
),
},
{
number: "06",
title: "Prices & Payment",
content: (
<> <p>
The applicable product price, delivery charge and total payable
amount will be displayed during the ordering process. </p> <p>
Payments are processed through the payment methods made available by
New Print at checkout. </p> <p>
We may review or cancel an order where there is a genuine technical,
payment, pricing or other issue. </p>
</>
),
},
{
number: "07",
title: "Shipping & Delivery",
content: (
<> <p>
New Print ships orders using its available shipping arrangements,
including India Post where applicable. </p> <p>
Delivery time can vary depending on production time, destination,
shipping conditions and circumstances outside our reasonable control. </p> <p>
Customers are responsible for providing a complete and accurate
delivery address and contact number. </p>
</>
),
},
{
number: "08",
title: "Returns & Refunds",
content: (
<> <p>
Return and refund requests are reviewed based on the circumstances of
the individual order. </p> <p>
If you have an issue with your order, please contact New Print before
sending the product back. </p> <p>
We will discuss the issue with you, review the situation and decide
the appropriate resolution. </p> <p>
For personalised or customised products, the available resolution
may depend on the nature of the issue and the circumstances of the
order. </p>
</>
),
},
{
number: "09",
title: "Order Cancellation",
content: (
<> <p>
If you need to cancel an order, contact us as soon as possible. </p> <p>
Cancellation may not be possible after production, printing,
customisation or fulfilment has started. </p> <p>
Any cancellation request will be considered according to the status
and circumstances of the order. </p>
</>
),
},
{
number: "10",
title: "Delivery Information",
content: (
<> <p>
Please make sure that your name, phone number, address, city, state
and PIN code are correct before completing your order. </p> <p>
If an order cannot be delivered because incorrect or incomplete
information was provided, additional arrangements may be required. </p>
</>
),
},
{
number: "11",
title: "Website Content",
content: (
<> <p>
Product information, photographs, descriptions, prices, graphics,
logos and other website content are provided for the operation of New
Print. </p> <p>
We make reasonable efforts to keep information accurate, but product
availability, specifications and other information may change from
time to time. </p>
</>
),
},
{
number: "12",
title: "Intellectual Property",
content: (
<> <p>
New Print's website, branding, logos, original graphics, text,
designs and other original materials may be protected by applicable
intellectual property laws. </p> <p>
You may not copy, reproduce, modify, distribute or commercially use
New Print's protected materials without appropriate permission. </p>
</>
),
},
{
number: "13",
title: "Third-Party Services",
content: (
<> <p>
New Print may use third-party services for payment processing,
authentication, hosting, shipping, communication and other website
functions. </p> <p>
The availability of these services may depend on the relevant
third-party provider. </p>
</>
),
},
{
number: "14",
title: "Website Availability",
content: (
<> <p>
We aim to keep the New Print website available and working properly.
However, temporary interruptions may occur because of maintenance,
technical problems, internet issues or third-party services. </p>
</>
),
},
{
number: "15",
title: "Changes to These Terms",
content: (
<> <p>
New Print may update these Terms & Conditions when necessary to
reflect changes to our services, website or business practices. </p> <p>
The updated version will be made available on this page. </p>
</>
),
},
{
number: "16",
title: "Contact Us",
content: (
<> <p>
If you have any questions about these Terms & Conditions, your order
or any New Print service, please contact us. </p>

    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0A1B2E] px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#142C46]"
    >
      WhatsApp New Print
    </a>
  </>
),

},
];

const faqs = [
{
question: "What happens after I place an order?",
answer:
"Your order is processed using the information and customisation submitted during checkout. If production or customisation has started, changes or cancellation may not always be possible.",
},
{
question: "Can I change my order after placing it?",
answer:
"Contact us as soon as possible. We will check the current status of your order and let you know whether a change is possible.",
},
{
question: "What if there is a problem with my order?",
answer:
"Please contact us and explain the issue. We will discuss the situation with you and decide the appropriate next step.",
},
{
question: "How are returns and refunds handled?",
answer:
"Return and refund requests are considered individually. Please contact us before sending anything back so we can discuss the issue first.",
},
{
question: "Who is responsible for uploaded designs?",
answer:
"The customer is responsible for ensuring that uploaded images, artwork, logos and other content can legally be used for the order.",
},
{
question: "How can I contact New Print?",
answer:
"You can contact us directly through WhatsApp using the contact buttons on this page.",
},
];

export default function TermsAndConditionsPage() {
return ( <main className="min-h-screen bg-[#F7F7F5] text-[#0A1B2E]">
    <Navbar/>
{/* HERO */} <section className="relative overflow-hidden bg-[#0A1B2E] px-5 pb-20 pt-28 text-white sm:px-8 sm:pb-28 sm:pt-36"> <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full border border-[#B9954F]/10" /> <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full border border-[#B9954F]/10" />

    <div className="relative mx-auto max-w-4xl text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4B979]">
        New Print
      </p>

      <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl md:text-7xl">
        Terms &{" "}
        <span className="text-[#D4B979]">Conditions</span>
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
        Please read these terms carefully before using New Print or placing
        an order with us.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href="#terms"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#B9954F] px-7 text-xs font-extrabold uppercase tracking-wider text-[#0A1B2E] transition hover:bg-[#D4B979]"
        >
          Read Terms
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-7 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-white/5"
        >
          WhatsApp Us
        </a>
      </div>
    </div>
  </section>

  {/* INTRO */}
  <section className="bg-white px-5 py-14 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F7F5] p-6 sm:p-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F]">
          Before You Order
        </p>

        <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          We keep things simple and clear.
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#64748B]">
          New Print offers products that may be personalised or printed
          according to your selections. Please review your order carefully
          before placing it. If you have any doubt, contact us and we will
          be happy to discuss it with you.
        </p>
      </div>
    </div>
  </section>

  {/* TERMS */}
  <section id="terms" className="scroll-mt-10 px-5 py-16 sm:px-8 sm:py-24">
    <div className="mx-auto max-w-6xl">
      <div className="mb-12 max-w-2xl">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#B9954F]">
          Our Terms
        </p>

        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          How New Print works.
        </h2>

        <p className="mt-4 text-sm leading-7 text-[#64748B]">
          These terms explain the basic responsibilities of New Print and
          our customers when using our website and services.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {sections.map((section) => (
          <article
            key={section.number}
            className="border-b border-[#E5E7EB] p-6 last:border-b-0 sm:p-9"
          >
            <div className="flex gap-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F2E8] text-[10px] font-black text-[#B9954F]">
                {section.number}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black tracking-[-0.02em] sm:text-xl">
                  {section.title}
                </h3>

                <div className="mt-3 space-y-3 text-sm leading-7 text-[#64748B]">
                  {section.content}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>

  {/* CUSTOMER CHECKLIST */}
  <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#B9954F]">
          Before Checkout
        </p>

        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          Please check your order.
        </h2>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {[
          "Product and quantity",
          "Size and colour",
          "Names and numbers",
          "Uploaded images or artwork",
          "Contact number",
          "Complete delivery address",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F7F7F5] p-4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A1B2E] text-xs font-bold text-[#D4B979]">
              ✓
            </span>

            <span className="text-sm font-semibold text-[#475569]">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* FAQ */}
  <section className="bg-[#F7F7F5] px-5 py-16 sm:px-8 sm:py-24">
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#B9954F]">
          Questions
        </p>

        <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          Terms, made easier.
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-xl border border-[#E5E7EB] bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 text-sm font-bold sm:p-6 sm:text-base">
              <span>{faq.question}</span>

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F2E8] text-lg font-normal text-[#B9954F] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <p className="text-sm leading-7 text-[#64748B]">
                {faq.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  </section>

  {/* CONTACT CTA */}
  <section className="bg-[#0A1B2E] px-5 py-20 text-center text-white sm:px-8 sm:py-28">
    <div className="mx-auto max-w-3xl">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4B979]">
        Need Clarity?
      </p>

      <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
        Have a question?
      </h2>

      <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
        If anything about your order or these Terms & Conditions is
        unclear, contact us before proceeding.
      </p>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#B9954F] px-8 text-xs font-extrabold uppercase tracking-wider text-[#0A1B2E] transition hover:bg-[#D4B979]"
      >
        Contact New Print on WhatsApp
      </a>

      <p className="mt-4 text-xs text-white/30">
        +91 74069 25565
      </p>
    </div>
  </section>

  {/* SIMPLE FOOTER LINK AREA
      Remove this section if your global Footer already exists.
  */}
  <footer className="border-t border-[#E5E7EB] bg-white px-5 py-8 sm:px-8">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
      <p className="text-xs text-[#94A3B8]">
        © {new Date().getFullYear()} New Print. All rights reserved.
      </p>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-[#64748B]">
        <Link
          href="/"
          className="transition hover:text-[#B9954F]"
        >
          Home
        </Link>

        <Link
          href="/returns-refunds"
          className="transition hover:text-[#B9954F]"
        >
          Returns & Refunds
        </Link>

        <Link
          href="/shipping"
          className="transition hover:text-[#B9954F]"
        >
          Shipping
        </Link>

        <Link
          href="/terms-and-conditions"
          className="text-[#B9954F]"
        >
          Terms & Conditions
        </Link>
      </div>
    </div>
  </footer>
</main>
);
}
