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
// CONSTANTS
// ============================================================

const FALLBACK_IMAGE = "/images/product-placeholder.jpg";

// ============================================================
// ICONS
// ============================================================

function SearchIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="19"
      height="19"
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

function ChevronDownIcon({
  className = "",
}: {
  className?: string;
}) {
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

function PackageIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="23"
      height="23"
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

function ArrowUpRightIcon() {
  return (
    <svg
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
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

// ============================================================
// SKELETON
// ============================================================

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
      <div className="aspect-square w-full animate-pulse bg-[#E7E7E3]" />

      <div className="p-3.5 sm:p-5">
        <div className="h-2.5 w-20 animate-pulse rounded bg-[#E5E7EB]" />

        <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />

        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />

        <div className="mt-4 flex justify-between border-t border-[#E5E7EB] pt-3">
          <div className="h-4 w-14 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-7 w-7 animate-pulse rounded-full bg-[#E5E7EB]" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================

function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const image =
    product.images?.find(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0
    ) || FALLBACK_IMAGE;

  const identifier =
    product.slug || product._id;

  /*
    First two cards are prioritized because two cards are
    visible immediately on most mobile screens.
  */
  const priority = index < 2;

  return (
    <Link
      href={`/products/${encodeURIComponent(identifier)}`}
      className="
        group
        block
        min-w-0
        rounded-[12px]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#B9954F]
        focus-visible:ring-offset-2
      "
      aria-label={`View ${product.name}`}
    >
      <article
        className="
          overflow-hidden
          rounded-[12px]
          border
          border-[#E5E7EB]
          bg-white
          transition-[transform,border-color,box-shadow]
          duration-200
          ease-out
          md:hover:-translate-y-1
          md:hover:border-[#B9954F]/50
          md:hover:shadow-[0_14px_32px_-18px_rgba(10,27,46,0.28)]
        "
      >
        {/* ==================================================
            IMAGE
        ================================================== */}

        <div className="relative aspect-square w-full overflow-hidden bg-[#F5F4F0]">
          <Image
            src={image}
            alt={product.name}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className="
              object-cover
              transition-transform
              duration-300
              ease-out
              md:group-hover:scale-[1.035]
            "
          />

          {/* Image overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.10] via-transparent to-transparent" />

          {/* Featured */}
          {product.featured && (
            <span className="absolute left-2.5 top-2.5 rounded-[5px] bg-[#B9954F] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em] text-white sm:left-3 sm:top-3 sm:px-2.5 sm:text-[9px]">
              Featured
            </span>
          )}

          {/* Inactive */}
          {product.status !== "active" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0A1B2E]/30">
              <span className="rounded-[6px] bg-white px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#64748B] shadow-sm">
                Unavailable
              </span>
            </div>
          )}
        </div>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="p-3.5 sm:p-5">
          <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F] sm:text-[9px]">
            {product.category?.name || "Products"}
          </p>

          <h2 className="mt-1.5 line-clamp-2 min-h-[36px] text-[13px] font-extrabold leading-5 tracking-[-0.01em] text-[#0A1B2E] sm:min-h-[40px] sm:text-base">
            {product.name}
          </h2>

          {product.description ? (
            <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-[#64748B] sm:text-xs">
              {product.description}
            </p>
          ) : (
            <p className="mt-1 text-[10px] leading-4 text-[#94A3B8] sm:text-xs">
              Custom printing available
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E5E7EB] pt-3 sm:mt-4 sm:pt-3.5">
            {typeof product.price === "number" ? (
              <span className="text-sm font-extrabold tracking-[-0.01em] text-[#0A1B2E] sm:text-base">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#64748B] sm:text-xs">
                Custom Pricing
              </span>
            )}

            <span
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#F7F7F5]
                text-[#0A1B2E]
                transition-colors
                duration-150
                md:group-hover:bg-[#0A1B2E]
                md:group-hover:text-white
                sm:h-8
                sm:w-8
              "
            >
              <ArrowUpRightIcon />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================================
// PRODUCTS PAGE
// ============================================================

export default function ProductsPage() {
  const { get } = useApi();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("newest");

  // ==========================================================
  // FETCH
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        const response =
          await get<ProductResponse>(
            "/api/products"
          );

        if (!mounted) return;

        if (
          response?.success &&
          Array.isArray(response.products)
        ) {
          setProducts(response.products);
        } else {
          setProducts([]);
          setError(true);
        }
      } catch (err) {
        if (!mounted) return;

        console.error(
          "Failed to load products:",
          err
        );

        setProducts([]);
        setError(true);
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
    const categoryMap =
      new Map<string, ProductCategory>();

    for (const product of products) {
      const category =
        product.category;

      if (
        !category?.name &&
        !category?._id
      ) {
        continue;
      }

      const key =
        category._id ||
        category.slug ||
        category.name;

      if (!categoryMap.has(key)) {
        categoryMap.set(
          key,
          category
        );
      }
    }

    return Array.from(
      categoryMap.values()
    ).sort((a, b) =>
      a.name.localeCompare(
        b.name
      )
    );
  }, [products]);

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filteredProducts =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      let result =
        products.filter(
          (product) => {
            if (searchTerm) {
              const name =
                product.name?.toLowerCase() ||
                "";

              const description =
                product.description?.toLowerCase() ||
                "";

              const category =
                product.category?.name?.toLowerCase() ||
                "";

              const matchesSearch =
                name.includes(
                  searchTerm
                ) ||
                description.includes(
                  searchTerm
                ) ||
                category.includes(
                  searchTerm
                );

              if (!matchesSearch) {
                return false;
              }
            }

            if (
              selectedCategory !==
              "all"
            ) {
              const categoryId =
                product.category?._id;

              const categorySlug =
                product.category?.slug;

              const categoryName =
                product.category?.name;

              if (
                categoryId !==
                  selectedCategory &&
                categorySlug !==
                  selectedCategory &&
                categoryName !==
                  selectedCategory
              ) {
                return false;
              }
            }

            return true;
          }
        );

      if (sortBy === "price-low") {
        result.sort(
          (a, b) =>
            (a.price ??
              Number.MAX_SAFE_INTEGER) -
            (b.price ??
              Number.MAX_SAFE_INTEGER)
        );
      } else if (
        sortBy === "price-high"
      ) {
        result.sort(
          (a, b) =>
            (b.price ?? 0) -
            (a.price ?? 0)
        );
      } else if (
        sortBy === "name"
      ) {
        result.sort((a, b) =>
          a.name.localeCompare(
            b.name
          )
        );
      } else if (
        sortBy === "featured"
      ) {
        result.sort(
          (a, b) =>
            Number(b.featured) -
            Number(a.featured)
        );
      }

      return result;
    }, [
      products,
      search,
      selectedCategory,
      sortBy,
    ]);

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
  };

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-[100svh] bg-[#F7F7F5] px-4 pb-20 pt-[86px] sm:px-6 sm:pt-[105px]">
          <div className="mx-auto flex min-h-[70svh] w-full max-w-md items-center justify-center">
            <div className="w-full rounded-[12px] border border-[#E5E7EB] bg-white p-7 text-center shadow-[0_8px_30px_-20px_rgba(10,27,46,0.25)] sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
                <PackageIcon />
              </div>

              <h1 className="mt-5 text-xl font-extrabold text-[#0A1B2E] sm:text-2xl">
                Unable to load products
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                We couldn't retrieve the
                products right now. Please
                try again.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[9px] bg-[#0A1B2E] px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#142C46] active:bg-[#081827]"
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

      <main className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5] pb-20 pt-[76px] sm:pt-[92px] lg:pt-[100px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ==================================================
              HEADER
          ================================================== */}

          <section className="pb-6 pt-5 sm:pb-9 sm:pt-7 lg:pb-10">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-[2px] w-7 bg-[#B9954F]" />

                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F] sm:text-[10px]">
                  Our Collection
                </span>
              </div>

              <h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0A1B2E] sm:text-4xl lg:text-5xl">
                Products
              </h1>

              <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#64748B] sm:text-sm sm:leading-7 lg:text-base">
                Explore our collection of
                custom printing products for
                teams, businesses, events, and
                everyday moments.
              </p>
            </div>
          </section>

          {/* ==================================================
              FILTER BAR
          ================================================== */}

          <section className="mb-6 rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_4px_18px_-15px_rgba(10,27,46,0.25)] sm:mb-7 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

              {/* SEARCH */}

              <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />

                <input
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="
                    h-11
                    w-full
                    rounded-[9px]
                    border
                    border-[#E5E7EB]
                    bg-[#FAFAF8]
                    pl-10
                    pr-4
                    text-sm
                    font-medium
                    text-[#0A1B2E]
                    outline-none
                    transition-colors
                    duration-150
                    placeholder:text-[#94A3B8]
                    focus:border-[#B9954F]
                    focus:bg-white
                  "
                />
              </div>

              {/* CATEGORY */}

              <div className="relative lg:w-[210px]">
                <select
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(
                      event.target.value
                    )
                  }
                  className="
                    h-11
                    w-full
                    appearance-none
                    rounded-[9px]
                    border
                    border-[#E5E7EB]
                    bg-[#FAFAF8]
                    px-3
                    pr-9
                    text-sm
                    font-semibold
                    text-[#0A1B2E]
                    outline-none
                    transition-colors
                    duration-150
                    focus:border-[#B9954F]
                    focus:bg-white
                  "
                  aria-label="Filter by category"
                >
                  <option value="all">
                    All Categories
                  </option>

                  {categories.map(
                    (category) => {
                      const value =
                        category._id ||
                        category.slug ||
                        category.name;

                      return (
                        <option
                          key={value}
                          value={value}
                        >
                          {category.name}
                        </option>
                      );
                    }
                  )}
                </select>

                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              </div>

              {/* SORT */}

              <div className="relative lg:w-[180px]">
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value
                    )
                  }
                  className="
                    h-11
                    w-full
                    appearance-none
                    rounded-[9px]
                    border
                    border-[#E5E7EB]
                    bg-[#FAFAF8]
                    px-3
                    pr-9
                    text-sm
                    font-semibold
                    text-[#0A1B2E]
                    outline-none
                    transition-colors
                    duration-150
                    focus:border-[#B9954F]
                    focus:bg-white
                  "
                  aria-label="Sort products"
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="featured">
                    Featured
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>

                  <option value="name">
                    Name: A-Z
                  </option>
                </select>

                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              </div>
            </div>

            {/* ==================================================
                MOBILE CATEGORY CHIPS
            ================================================== */}

            {categories.length > 0 && (
              <div
                className="
                  mt-3
                  flex
                  gap-2
                  overflow-x-auto
                  pb-1
                  lg:hidden
                "
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategory("all")
                  }
                  className={`
                    min-h-9
                    shrink-0
                    rounded-full
                    px-4
                    text-xs
                    font-bold
                    transition-colors
                    duration-150
                    ${
                      selectedCategory === "all"
                        ? "bg-[#0A1B2E] text-white"
                        : "border border-[#E5E7EB] bg-white text-[#64748B]"
                    }
                  `}
                >
                  All
                </button>

                {categories.map(
                  (category) => {
                    const value =
                      category._id ||
                      category.slug ||
                      category.name;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            value
                          )
                        }
                        className={`
                          min-h-9
                          shrink-0
                          rounded-full
                          px-4
                          text-xs
                          font-bold
                          transition-colors
                          duration-150
                          ${
                            selectedCategory ===
                            value
                              ? "bg-[#0A1B2E] text-white"
                              : "border border-[#E5E7EB] bg-white text-[#64748B]"
                          }
                        `}
                      >
                        {category.name}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* ==================================================
              RESULTS
          ================================================== */}

          {!loading && (
            <div className="mb-5 flex min-h-6 items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[#64748B] sm:text-sm">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "product"
                  : "products"}
              </p>

              {(search ||
                selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 text-xs font-bold text-[#0A1B2E] underline decoration-[#B9954F] underline-offset-4 transition-colors duration-150 hover:text-[#B9954F]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading && (
            <div
              className="
                grid
                grid-cols-2
                gap-3
                sm:gap-5
                md:grid-cols-3
                lg:grid-cols-4
                lg:gap-6
              "
              aria-label="Loading products"
            >
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <ProductCardSkeleton
                  key={index}
                />
              ))}
            </div>
          )}

          {/* ==================================================
              PRODUCTS
          ================================================== */}

          {!loading &&
            filteredProducts.length > 0 && (
              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  sm:gap-5
                  md:grid-cols-3
                  lg:grid-cols-4
                  lg:gap-6
                "
              >
                {filteredProducts.map(
                  (product, index) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={index}
                    />
                  )
                )}
              </div>
            )}

          {/* ==================================================
              NO RESULTS
          ================================================== */}

          {!loading &&
            filteredProducts.length === 0 && (
              <div className="flex min-h-[42vh] items-center justify-center">
                <div className="w-full max-w-md rounded-[12px] border border-[#E5E7EB] bg-white p-7 text-center shadow-[0_8px_30px_-22px_rgba(10,27,46,0.3)] sm:p-10">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
                    <SearchIcon />
                  </div>

                  <h2 className="mt-5 text-lg font-extrabold text-[#0A1B2E] sm:text-xl">
                    No products found
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    Try another search term
                    or choose a different
                    category.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="
                      mt-6
                      min-h-11
                      rounded-[9px]
                      bg-[#0A1B2E]
                      px-6
                      text-sm
                      font-bold
                      text-white
                      transition-colors
                      duration-150
                      hover:bg-[#142C46]
                      active:bg-[#081827]
                    "
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