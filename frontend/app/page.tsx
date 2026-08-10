//path : frontend/app/page.tsx
import Navbar from "./components/Navbar";
import FeaturedProducts from "./components/FeaturedProducts";
import Footer from "./components/Footer";
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <FeaturedProducts />
      <Footer />

    
    
    </div>
  );
}