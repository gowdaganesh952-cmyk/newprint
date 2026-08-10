"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { useApi } from "@/app/lib/api";

// ============================================================
// TYPES
// ============================================================

interface ProductCategory {
  _id?: string;
  name: string;
  slug?: string;
}

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: ProductCategory | null;
  status: "active" | "inactive";
  featured: boolean;
  options?: {
    name: string;
    values: string[];
  }[];
  orderSelections?: {
    name: string;
    values: string[];
    required: boolean;
  }[];
}

interface ProductResponse {
  success: boolean;
  products: Product[];
  message?: string;
}

// ============================================================
// ICONS
// ============================================================

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PackageIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

// ============================================================
// CONSTANTS
// ============================================================

const FALLBACK_IMAGE = "/images/product-placeholder.jpg";

// ============================================================
// SKELETON
// ============================================================

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="aspect-square animate-pulse bg-[#E5E7EB]" />

      <div className="p-4 sm:p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mt-3 h-4 w-24 animate-pulse rounded bg-[#E5E7EB]" />
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================

function ProductCard({ product }: { product: Product }) {
  const image =
    product.images?.find(
      (item) => typeof item === "string" && item.trim().length > 0
    ) || FALLBACK_IMAGE;

  const productIdentifier = product.slug || product._id;

  return (
    <Link
      href={`/products/${encodeURIComponent(productIdentifier)}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#D7DCE2] hover:shadow-[0_12px_35px_rgba(10,27,46,0.08)]">
        {/* IMAGE */}
        <div className="relative aspect-square overflow-hidden bg-[#F3F4F1]">
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 639px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />

          {product.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-[#0A1B2E] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm">
              Featured
            </span>
          )}

          {product.status !== "active" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0A1B2E]/35">
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                Unavailable
              </span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#B9954F]">
            {product.category?.name || "Products"}
          </p>

          <h2 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-extrabold leading-5 text-[#0A1B2E] sm:text-base">
            {product.name}
          </h2>

          <div className="mt-3 flex items-center justify-between gap-2">
            {typeof product.price === "number" ? (
              <span className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
                Custom Pricing
              </span>
            )}

            <span className="text-[11px] font-bold text-[#64748B] transition-colors group-hover:text-[#B9954F]">
              View
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================================
// MAIN PRODUCTS PAGE
// ============================================================

export default function ProductsPage() {
  const { get } = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await get<ProductResponse>("/api/products");

        if (!mounted) return;

        if (response?.success && Array.isArray(response.products)) {
          setProducts(response.products);
        } else {
          setProducts([]);
          setError(true);
        }
      } catch (err) {
        if (!mounted) return;

        console.error("Failed to load products:", err);
        setError(true);
        setProducts([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [get]);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories = useMemo(() => {
    const categoryMap = new Map<string, ProductCategory>();

    products.forEach((product) => {
      if (product.category?._id || product.category?.name) {
        const key =
          product.category._id ||
          product.category.slug ||
          product.category.name;

        if (!categoryMap.has(key)) {
          categoryMap.set(key, product.category);
        }
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [products]);

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const searchTerm = search.trim().toLowerCase();

    if (searchTerm) {
      result = result.filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const description = product.description?.toLowerCase() || "";
        const category = product.category?.name?.toLowerCase() || "";

        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          category.includes(searchTerm)
        );
      });
    }

    if (selectedCategory !== "all") {
      result = result.filter((product) => {
        const categoryId = product.category?._id;
        const categorySlug = product.category?.slug;
        const categoryName = product.category?.name;

        return (
          categoryId === selectedCategory ||
          categorySlug === selectedCategory ||
          categoryName === selectedCategory
        );
      });
    }

    if (sortBy === "price-low") {
      result.sort(
        (a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER)
      );
    }

    if (sortBy === "price-high") {
      result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === "featured") {
      result.sort(
        (a, b) => Number(b.featured) - Number(a.featured)
      );
    }

    // Backend already returns newest first.
    // Keep that order for "newest".

    return result;
  }, [products, search, selectedCategory, sortBy]);

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#F7F7F5] px-4 pb-20 pt-[90px] sm:pt-[110px]">
          <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center">
            <div className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
                <PackageIcon />
              </div>

              <h1 className="mt-5 text-xl font-extrabold text-[#0A1B2E]">
                Unable to load products
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                We couldn't retrieve the products right now. Please refresh
                the page and try again.
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 h-11 rounded-xl bg-[#0A1B2E] px-6 text-sm font-bold text-white transition hover:bg-[#142C46]"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F7F5] pb-20 pt-[78px] sm:pt-[96px] lg:pt-[104px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* HEADER */}
          <section className="pb-7 pt-5 sm:pb-9 sm:pt-7 lg:pb-10">
            <div className="max-w-2xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F] sm:text-xs">
                Our Collection
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#0A1B2E] sm:text-4xl lg:text-5xl">
                Products
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base sm:leading-7">
                Explore our collection of products and choose the options
                that work best for your order.
              </p>
            </div>
          </section>

          {/* FILTER BAR */}
          <section className="mb-7 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-[0_2px_15px_rgba(10,27,46,0.03)] sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

              {/* SEARCH */}
              <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products..."
                  className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] pl-10 pr-4 text-sm font-medium text-[#0A1B2E] outline-none transition placeholder:text-[#94A3B8] focus:border-[#B9954F] focus:bg-white"
                />
              </div>

              {/* CATEGORY */}
              <div className="relative lg:w-[210px]">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] px-3 pr-9 text-sm font-semibold text-[#0A1B2E] outline-none transition focus:border-[#B9954F] focus:bg-white"
                >
                  <option value="all">All Categories</option>

                  {categories.map((category) => {
                    const value =
                      category._id ||
                      category.slug ||
                      category.name;

                    return (
                      <option key={value} value={value}>
                        {category.name}
                      </option>
                    );
                  })}
                </select>

                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              </div>

              {/* SORT */}
              <div className="relative lg:w-[180px]">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] px-3 pr-9 text-sm font-semibold text-[#0A1B2E] outline-none transition focus:border-[#B9954F] focus:bg-white"
                >
                  <option value="newest">Newest</option>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>

                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              </div>
            </div>

            {/* MOBILE CATEGORY SCROLLER */}
            {categories.length > 0 && (
              <div
                className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    selectedCategory === "all"
                      ? "bg-[#0A1B2E] text-white"
                      : "border border-[#E5E7EB] bg-white text-[#64748B]"
                  }`}
                >
                  All
                </button>

                {categories.map((category) => {
                  const value =
                    category._id ||
                    category.slug ||
                    category.name;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedCategory(value)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                        selectedCategory === value
                          ? "bg-[#0A1B2E] text-white"
                          : "border border-[#E5E7EB] bg-white text-[#64748B]"
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* RESULT COUNT */}
          {!loading && (
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[#64748B] sm:text-sm">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>

              {(search || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="text-xs font-bold text-[#0A1B2E] underline underline-offset-4 transition hover:text-[#B9954F]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* PRODUCTS */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                />
              ))}
            </div>
          )}

          {/* NO RESULTS */}
          {!loading && filteredProducts.length === 0 && (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
                  <SearchIcon />
                </div>

                <h2 className="mt-5 text-lg font-extrabold text-[#0A1B2E] sm:text-xl">
                  No products found
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  Try a different search term or select another category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="mt-6 rounded-xl bg-[#0A1B2E] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#142C46]"
                >
                  View All Products
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}