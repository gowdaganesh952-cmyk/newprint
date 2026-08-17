import Navbar from "./components/Navbar";
import HomePageReady from "./components/HomePageReady";
import FeaturedProducts from "./components/FeaturedProducts";
import Footer from "./components/Footer";


export default function HomePage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-black">
      <Navbar />

      <HomePageReady>
        <FeaturedProducts />
      </HomePageReady>

      <Footer />
    </main>
  );
}