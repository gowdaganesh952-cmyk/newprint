"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApi } from "../lib/api";

// ============================================================
// TYPES
// ============================================================

interface ProductCategory {
  _id?: string;
  name: string;
  slug?: string;
  status?: string;
}

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: ProductCategory | null;
  featured?: boolean;
  status?: "active" | "inactive" | string;
  options?: {
    name: string;
    values: string[];
  }[];
}

interface ProductsResponse {
  success?: boolean;
  products?: Product[];
  data?: Product[];
}

// ============================================================
// ARROW ICON
// ============================================================

const ArrowUpRightIcon = memo(
  ({ className = "" }: { className?: string }) => (
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
      <path d="M7 17L17 7" />
      <path d="M7 7H17V17" />
    </svg>
  )
);

ArrowUpRightIcon.displayName = "ArrowUpRightIcon";

// ============================================================
// SKELETON CARD
// ============================================================

const ProductSkeleton = memo(() => {
  return (
    <div
      className="
        overflow-hidden
        rounded-[12px]
        border
        border-[#E5E7EB]
        bg-white
      "
      aria-hidden="true"
    >
      {/* Image skeleton */}
      <div
        className="
          aspect-square
          w-full
          animate-pulse
          bg-[#E5E7EB]
        "
      />

      {/* Content skeleton */}
      <div className="p-4 sm:p-5">
        <div
          className="
            h-2.5
            w-20
            animate-pulse
            rounded
            bg-[#E5E7EB]
          "
        />

        <div
          className="
            mt-3
            h-4
            w-3/4
            animate-pulse
            rounded
            bg-[#E5E7EB]
          "
        />

        <div
          className="
            mt-2
            h-3
            w-1/2
            animate-pulse
            rounded
            bg-[#E5E7EB]
          "
        />

        <div
          className="
            mt-5
            flex
            items-center
            justify-between
            border-t
            border-[#E5E7EB]
            pt-3
          "
        >
          <div
            className="
              h-4
              w-14
              animate-pulse
              rounded
              bg-[#E5E7EB]
            "
          />

          <div
            className="
              h-8
              w-8
              animate-pulse
              rounded-full
              bg-[#E5E7EB]
            "
          />
        </div>
      </div>
    </div>
  );
});

ProductSkeleton.displayName = "ProductSkeleton";

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = memo(() => {
  return (
    <div
      className="
        mx-auto
        max-w-xl
        rounded-[12px]
        border
        border-[#E5E7EB]
        bg-white
        px-6
        py-12
        text-center
        sm:px-10
        sm:py-14
      "
    >
      <div
        className="
          mx-auto
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[#F7F7F5]
          text-[#B9954F]
        "
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 7h18" />
          <path d="M5 7l1 13h12l1-13" />
          <path d="M9 7V5a3 3 0 016 0v2" />
        </svg>
      </div>

      <h3
        className="
          mt-5
          text-lg
          font-extrabold
          tracking-[-0.02em]
          text-[#0A1B2E]
          sm:text-xl
        "
      >
        Featured Products Coming Soon
      </h3>

      <p
        className="
          mx-auto
          mt-2
          max-w-md
          text-sm
          leading-6
          text-[#64748B]
        "
      >
        We are preparing our featured collection. Check back soon to explore our custom printing products.
      </p>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

// ============================================================
// ERROR STATE
// ============================================================

const ErrorState = memo(() => {
  return (
    <div
      className="
        mx-auto
        max-w-xl
        rounded-[12px]
        border
        border-[#E5E7EB]
        bg-white
        px-6
        py-10
        text-center
        sm:px-10
      "
    >
      <div
        className="
          mx-auto
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          bg-[#F7F7F5]
          text-[#0A1B2E]
        "
      >
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      <h3
        className="
          mt-4
          text-base
          font-bold
          text-[#0A1B2E]
          sm:text-lg
        "
      >
        Products are temporarily unavailable
      </h3>

      <p
        className="
          mx-auto
          mt-2
          max-w-md
          text-sm
          leading-6
          text-[#64748B]
        "
      >
        Please try again later.
      </p>
    </div>
  );
});

ErrorState.displayName = "ErrorState";

// ============================================================
// PRODUCT CARD
// ============================================================

const ProductCard = memo(
  ({ product, index }: { product: Product; index: number }) => {
    const image =
      product.images?.[0] ||
      "/images/product-placeholder.jpg";

    const productHref = `/products/${
      product.slug || product._id
    }`;

    // Calculate priority: Ensure the first 2 images on mobile render immediately for LCP
    const isPriority = index < 2;

    return (
      <article
        className="
          group
          relative
          min-w-0
          overflow-hidden
          rounded-[12px]
          border
          border-[#E5E7EB]
          bg-white
          transition-[transform,border-color,box-shadow]
          duration-300
          ease-out
          md:hover:-translate-y-1
          md:hover:border-[#B9954F]/60
          md:hover:shadow-[0_14px_32px_-16px_rgba(10,27,46,0.25)]
        "
      >
        {/* Whole card clickable */}
        <Link
          href={productHref}
          className="
            absolute
            inset-0
            z-20
            rounded-[12px]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#B9954F]
            focus-visible:ring-inset
          "
          aria-label={`View ${product.name}`}
        />

        {/* ==================================================
            PRODUCT IMAGE
        ================================================== */}
        <div
          className="
            relative
            aspect-square
            w-full
            overflow-hidden
            bg-[#F5F4F0]
          "
        >
          <Image
            src={image}
            alt={product.name}
            fill
            priority={isPriority}
            loading={isPriority ? undefined : "lazy"}
            sizes="
              (max-width: 639px) 50vw,
              (max-width: 1023px) 33vw,
              25vw
            "
            className="
              object-cover
              transition-transform
              duration-500
              ease-out
              will-change-transform
              md:group-hover:scale-[1.045]
            "
          />

          {/* Very subtle image overlay */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-black/15
              via-transparent
              to-transparent
            "
          />

          {/* ==================================================
              CATEGORY
          ================================================== */}
          {product.category?.name && (
            <div
              className="
                absolute
                left-2.5
                top-2.5
                z-10
                max-w-[55%]
                sm:left-3
                sm:top-3
              "
            >
              <span
                className="
                  block
                  truncate
                  rounded-[5px]
                  bg-[#0A1B2E]/90
                  px-2
                  py-1
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-white
                  sm:px-2.5
                  sm:text-[9px]
                "
              >
                {product.category.name}
              </span>
            </div>
          )}

          {/* ==================================================
              FEATURED BADGE
          ================================================== */}
          {product.featured && (
            <div
              className="
                absolute
                right-2.5
                top-2.5
                z-10
                sm:right-3
                sm:top-3
              "
            >
              <span
                className="
                  rounded-[5px]
                  bg-[#B9954F]
                  px-2
                  py-1
                  text-[8px]
                  font-extrabold
                  uppercase
                  tracking-[0.1em]
                  text-white
                  sm:px-2.5
                  sm:text-[9px]
                "
              >
                Featured
              </span>
            </div>
          )}
        </div>

        {/* ==================================================
            PRODUCT INFORMATION
        ================================================== */}
        <div className="p-3.5 sm:p-5">
          {/* Small brand label */}
          <p
            className="
              text-[8px]
              font-extrabold
              uppercase
              tracking-[0.16em]
              text-[#B9954F]
              sm:text-[9px]
            "
          >
            New Print
          </p>

          {/* Product name */}
          <h3
            className="
              mt-1.5
              truncate
              text-[13px]
              font-bold
              tracking-[-0.01em]
              text-[#0A1B2E]
              transition-colors
              duration-200
              group-hover:text-[#B9954F]
              sm:text-base
            "
          >
            {product.name}
          </h3>

          {/* Description */}
          {product.description ? (
            <p
              className="
                mt-1.5
                line-clamp-1
                text-[10px]
                leading-4
                text-[#64748B]
                sm:text-xs
                sm:leading-5
              "
            >
              {product.description}
            </p>
          ) : (
            <p
              className="
                mt-1.5
                text-[10px]
                leading-4
                text-[#94A3B8]
                sm:text-xs
              "
            >
              Custom printing available
            </p>
          )}

          {/* ==================================================
              PRICE + ARROW
          ================================================== */}
          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              gap-2
              border-t
              border-[#E5E7EB]
              pt-3
              sm:mt-4
              sm:pt-3.5
            "
          >
            {typeof product.price === "number" ? (
              <span
                className="
                  text-sm
                  font-extrabold
                  tracking-[-0.01em]
                  text-[#0A1B2E]
                  sm:text-base
                "
              >
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            ) : (
              <span
                className="
                  text-[10px]
                  font-semibold
                  text-[#64748B]
                  sm:text-xs
                "
              >
                Custom pricing
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
                duration-300
                md:group-hover:bg-[#0A1B2E]
                md:group-hover:text-white
                sm:h-8
                sm:w-8
              "
            >
              <ArrowUpRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
        </div>
      </article>
    );
  }
);

ProductCard.displayName = "ProductCard";

// ============================================================
// MAIN FEATURED PRODUCTS COMPONENT
// ============================================================

export default function FeaturedProducts() {
  const { get } = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================
  useEffect(() => {
    let mounted = true;

    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await get<ProductsResponse>(
          "/api/products?status=active&featured=true&limit=6"
        );

        if (!mounted) return;

        const rawProducts =
          response?.products || response?.data || [];

        if (!Array.isArray(rawProducts)) {
          setProducts([]);
          return;
        }

        const featuredProducts = rawProducts
          .filter(
            (product) =>
              product.status === "active" && product.featured === true
          )
          .slice(0, 6);

        setProducts(featuredProducts);
      } catch (err) {
        console.error("Failed to fetch featured products:", err);
        if (mounted) {
          setError(true);
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedProducts();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#F7F7F5]
        py-14
        sm:py-18
        lg:py-22
      "
      aria-labelledby="featured-products-heading"
    >
      {/* ======================================================
          DECORATIVE ELEMENTS
          Lightweight CSS only.
      ====================================================== */}
      <div
        className="
          pointer-events-none
          absolute
          -right-28
          top-10
          h-64
          w-64
          rounded-full
          bg-[#B9954F]/[0.045]
          sm:-right-20
          sm:h-80
          sm:w-80
        "
        aria-hidden="true"
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          bottom-0
          h-64
          w-64
          rounded-full
          bg-[#0A1B2E]/[0.025]
          sm:h-80
          sm:w-80
        "
        aria-hidden="true"
      />

      {/* ======================================================
          CONTAINER
      ====================================================== */}
      <div
        className="
          relative
          mx-auto
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* ====================================================
            HEADER
        ==================================================== */}
        <div
          className="
            mb-8
            flex
            flex-col
            gap-5
            sm:mb-10
            lg:mb-12
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          {/* Heading */}
          <div className="max-w-2xl">
            {/* Label */}
            <div
              className="
                mb-3
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  h-[2px]
                  w-7
                  shrink-0
                  bg-[#B9954F]
                "
              />

              <span
                className="
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-[0.2em]
                  text-[#B9954F]
                  sm:text-[10px]
                  lg:text-xs
                "
              >
                Featured Collection
              </span>
            </div>

            {/* Heading */}
            <h2
              id="featured-products-heading"
              className="
                max-w-2xl
                text-[30px]
                font-extrabold
                leading-[1.08]
                tracking-[-0.035em]
                text-[#0A1B2E]
                sm:text-4xl
                lg:text-5xl
              "
            >
              Our most popular
              <br />
              <span className="text-[#B9954F]">
                printing products.
              </span>
            </h2>

            {/* Description */}
            <p
              className="
                mt-4
                max-w-xl
                text-[13px]
                leading-6
                text-[#64748B]
                sm:text-sm
                sm:leading-7
                lg:text-base
              "
            >
              Discover custom products made for teams, businesses, events, and everyday moments.
            </p>
          </div>

          {/* ==================================================
              VIEW ALL BUTTON
          ================================================== */}
          <Link
            href="/products"
            className="
              inline-flex
              min-h-[44px]
              w-fit
              items-center
              justify-center
              gap-2
              rounded-[8px]
              border
              border-[#D8DDE3]
              bg-white
              px-4
              text-xs
              font-semibold
              text-[#0A1B2E]
              transition-colors
              duration-200
              hover:border-[#B9954F]
              hover:bg-[#FBFBF9]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#B9954F]
              focus-visible:ring-offset-2
              sm:px-5
              sm:text-sm
            "
          >
            View All Products
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}
        {loading && (
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:gap-5
              lg:grid-cols-4
              lg:gap-6
            "
            aria-label="Loading products"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}
        {!loading && error && <ErrorState />}

        {/* ====================================================
            EMPTY
        ==================================================== */}
        {!loading && !error && products.length === 0 && <EmptyState />}

        {/* ====================================================
            PRODUCTS
        ==================================================== */}
        {!loading && !error && products.length > 0 && (
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:gap-5
              lg:grid-cols-4
              lg:gap-6
            "
          >
            {products.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}