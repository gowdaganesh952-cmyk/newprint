
import Navbar from "./components/Navbar";
import HomePageReady from "./components/HomePageReady";
import FeaturedProducts from "./components/FeaturedProducts";
import Footer from "./components/Footer";

const siteUrl = "https://newprint.kundapura.in";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "New Print",
  url: siteUrl,
  logo: `${siteUrl}/icons/icon-512.png`,
  description:
    "Custom jersey printing, sports team jerseys, custom T-shirts, and apparel printing.",
  telephone: "+917406925565",
  areaServed: [
    {
      "@type": "City",
      name: "Kundapura",
      addressCountry: "IN",
    },
    {
      "@type": "Place",
      name: "Byndoor",
      addressCountry: "IN",
    },
  ],
};

export default function HomePage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <Navbar />

      <HomePageReady>
        <FeaturedProducts />

       <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
  {/* Soft background decoration */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#f4f4f2] blur-[2px]"
  />

  <div
    aria-hidden="true"
    className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-[#f8f5ee]"
  />

  <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-6">
    {/* Premium label */}
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b8954a]/25 bg-[#b8954a]/[0.07] px-4 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[#b8954a]" />

      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8954a] sm:text-xs">
        Custom Printing • Kundapura & Byndoor
      </span>
    </div>

    {/* Main heading */}
    <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-[1.15] tracking-[-0.035em] text-[#071b33] sm:text-4xl md:text-5xl lg:text-[52px]">
      Custom Jerseys & Premium
      <span className="block text-[#b8954a]">
        Apparel Printing
      </span>
    </h1>

    {/* Description */}
    <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
      Discover New Print — your destination for custom sports jerseys,
      personalized T-shirts, and premium apparel printing.
      From team uniforms to special occasions, bring your ideas to life
      with designs made just for you.
    </p>

    {/* Local SEO description */}
    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
      Looking for custom jersey printing or personalized T-shirts in
      Kundapura or Byndoor? New Print brings quality, creativity, and
      personalized printing together.
    </p>

    {/* Action buttons */}
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <a
        href="/products"
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#071b33] px-7 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#102c4b] hover:shadow-md sm:w-auto"
      >
        Explore Products
        <span aria-hidden="true">↗</span>
      </a>

      <a
        href="/contact"
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-[#071b33]/15 bg-white px-7 py-3.5 text-sm font-bold text-[#071b33] transition-all duration-200 hover:border-[#b8954a] hover:bg-[#faf9f6] sm:w-auto"
      >
        Get in Touch
        <span aria-hidden="true">↗</span>
      </a>
    </div>

    {/* Trust highlights */}
    <div className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-slate-100 pt-6 text-xs font-medium text-slate-500 sm:gap-x-8">
      <span className="flex items-center gap-2">
        <span className="text-[#b8954a]">✦</span>
        Custom Designs
      </span>

      <span className="flex items-center gap-2">
        <span className="text-[#b8954a]">✦</span>
        Sports Jerseys
      </span>

      <span className="flex items-center gap-2">
        <span className="text-[#b8954a]">✦</span>
        Personalized T-Shirts
      </span>
    </div>
  </div>
</section>
      </HomePageReady>

      <Footer />
    </main>
  );
}