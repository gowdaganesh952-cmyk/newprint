"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/app/lib/api";
import Navbar from "@/app/components/Navbar";

// ============================================================
// TYPES
// ============================================================

interface ProductCategory {
  _id?: string;
  name: string;
  slug?: string;
}

interface ProductOption {
  name: string;
  values: string[];
}

interface ProductOrderSelection {
  name: string;
  values: string[];
  required: boolean;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: ProductCategory | null;
  status: "active" | "inactive";
  featured: boolean;
  options?: ProductOption[];
  orderSelections?: ProductOrderSelection[];
}

interface ProductResponse {
  success: boolean;
  product: Product;
  message?: string;
}

// ============================================================
// ICONS
// ============================================================

const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ============================================================
// LOADING SKELETON
// ============================================================

const ProductDetailSkeleton = memo(() => (
  <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-6 h-4 w-48 animate-pulse rounded bg-[#E5E7EB]" />
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
      <div className="flex flex-col gap-4">
        <div className="aspect-square w-full animate-pulse rounded-[12px] bg-[#E5E7EB]" />
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square w-20 shrink-0 animate-pulse rounded-[8px] bg-[#E5E7EB]" />
          ))}
        </div>
      </div>
      <div className="flex flex-col pt-2">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mb-6 h-8 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mb-8 h-6 w-32 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mb-10 space-y-3">
          <div className="h-3 w-full animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-[#E5E7EB]" />
        </div>
        <div className="h-14 w-full animate-pulse rounded-[10px] bg-[#E5E7EB]" />
      </div>
    </div>
  </div>
));
ProductDetailSkeleton.displayName = "ProductDetailSkeleton";

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function ProductDetailPage() {
  const params = useParams();
  const identifier = params.id as string;
  const { get } = useApi();

  // STATE
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // IMAGE STATE
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // SELECTION STATE (CUSTOMER CHOICES)
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // CART STATE
  const [addedSuccess, setAddedSuccess] = useState(false);

  // ==========================================================
  // FETCH PRODUCT (FIXED)
  // ==========================================================
  useEffect(() => {
    // 1. Setup AbortController for clean cancellations
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(false);
        setNotFound(false);

        // 2. Pass the signal to our updated 'get' function
        const res = await get<ProductResponse>(`/api/products/${identifier}`, { signal });

        if (res && res.success && res.product) {
          setProduct(res.product);
        } else {
          setNotFound(true);
        }
      } catch (err: any) {
        // 3. Ignore aborted requests (caused by rapid navigation)
        if (err.name === "AbortError") {
          return;
        }

        // Standardize 404 vs 500
        if (err.response?.status === 404 || err.status === 404 || err.message?.includes("404")) {
          setNotFound(true);
        } else {
          console.error("Failed to load product:", err);
          setError(true);
        }
      } finally {
        // 4. Only remove loading state if we haven't aborted
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (identifier) fetchProduct();

    // 5. Cleanup function cancels inflight request if identifier changes or component unmounts
    return () => {
      controller.abort();
    };
  }, [identifier, get]); // 'get' is now 100% stable thanks to useMemo in api.ts

  // ==========================================================
  // HANDLERS
  // ==========================================================
  const handleSelection = (selectionName: string, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [selectionName]: value
    }));
    
    if (validationErrors[selectionName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[selectionName];
        return newErrors;
      });
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const newErrors: Record<string, string> = {};
    let firstErrorElementId = "";

    product.orderSelections?.forEach((selection) => {
      if (selection.required && !selections[selection.name]) {
        newErrors[selection.name] = `Please select ${selection.name}`;
        if (!firstErrorElementId) firstErrorElementId = `selection-${selection.name}`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      
      if (firstErrorElementId) {
        document.getElementById(firstErrorElementId)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
      return;
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      image: product.images?.[0] || "/images/product-placeholder.jpg",
      price: product.price,
      selections: selections 
    };

    console.log("Item securely prepared for cart:", cartItem);

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2500);
  };

  // ==========================================================
  // RENDER HELPERS
  // ==========================================================
  const mainImage = product?.images?.[activeImageIndex] || "/images/product-placeholder.jpg";
  const hasImages = product?.images && product.images.length > 0;
  const isAvailable = product?.status === "active";
  const categoryName = product?.category?.name || "Uncategorized";

  // ==========================================================
  // CONDITIONAL RENDERS (404, Error, Loading)
  // ==========================================================
  if (loading) return <><Navbar /><div className="min-h-screen bg-[#F7F7F5] pt-[90px]"><ProductDetailSkeleton /></div></>;

  if (notFound) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-4 pt-[90px]">
          <div className="w-full max-w-md rounded-[12px] border border-[#E5E7EB] bg-white px-8 py-12 text-center shadow-sm">
            <h1 className="text-xl font-extrabold text-[#0A1B2E] sm:text-2xl">Product Not Found</h1>
            <p className="mt-2 text-sm text-[#64748B]">The product you are looking for does not exist or has been removed.</p>
            <Link href="/products" className="mx-auto mt-6 flex h-11 w-full max-w-[200px] items-center justify-center rounded-[10px] bg-[#0A1B2E] text-sm font-semibold text-white transition hover:bg-[#0A1B2E]/90">
              Back to Products
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-4 pt-[90px]">
          <div className="w-full max-w-md rounded-[12px] border border-[#E5E7EB] bg-white px-8 py-12 text-center shadow-sm">
            <h1 className="text-xl font-extrabold text-[#0A1B2E] sm:text-2xl">Unable to load product</h1>
            <p className="mt-2 text-sm text-[#64748B]">We encountered an error retrieving this product. Please try again.</p>
            <Link href="/products" className="mx-auto mt-6 flex h-11 w-full max-w-[200px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-sm font-semibold text-[#0A1B2E] transition hover:border-[#0A1B2E]">
              Back to Products
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ==========================================================
  // MAIN PRODUCT RENDER
  // ==========================================================
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F7F5] pb-24 pt-[90px] sm:pt-[110px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <nav aria-label="Breadcrumb" className="mb-6 lg:mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-wide sm:text-xs">
              <li>
                <Link href="/" className="text-[#64748B] transition-colors hover:text-[#0A1B2E]">Home</Link>
              </li>
              <li className="text-[#94A3B8]" aria-hidden="true">/</li>
              <li>
                <Link href="/products" className="text-[#64748B] transition-colors hover:text-[#0A1B2E]">Products</Link>
              </li>
              <li className="text-[#94A3B8]" aria-hidden="true">/</li>
              <li className="truncate text-[#0A1B2E]" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-14">
            
            <div className="flex flex-col gap-4 lg:gap-5">
              <div className="relative aspect-square w-full overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 767px) 100vw, 50vw"
                  className="object-cover transition-opacity duration-300"
                />
              </div>

              {hasImages && product.images && product.images.length > 1 && (
                <div className="flex w-full gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-[8px] border-2 transition-colors sm:w-[84px] ${
                        activeImageIndex === idx ? "border-[#B9954F]" : "border-transparent bg-white hover:border-[#E5E7EB]"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        sizes="84px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              
              <div className="mb-8 border-b border-[#E5E7EB] pb-8">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F] sm:text-xs">
                  {categoryName}
                </p>
                <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-[#0A1B2E] sm:text-3xl lg:text-4xl">
                  {product.name}
                </h1>
                
                <div className="mt-4 flex items-center">
                  {typeof product.price === "number" ? (
                    <span className="text-2xl font-extrabold tracking-[-0.01em] text-[#0A1B2E] sm:text-3xl">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold uppercase tracking-wider text-[#64748B]">
                      Custom Pricing
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="mt-6 text-[13px] leading-relaxed text-[#64748B] sm:text-sm sm:leading-7 lg:text-base">
                    {product.description}
                  </p>
                )}
              </div>

              {isAvailable ? (
                <div className="mb-8 flex flex-col gap-6">
                  {product.orderSelections?.map((selection) => (
                    <div 
                      key={selection.name} 
                      id={`selection-${selection.name}`} 
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#0A1B2E]">
                          {selection.name}
                        </span>
                        {selection.required ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B9954F]">Required</span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Optional</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                        {selection.values.map((val) => {
                          const isSelected = selections[selection.name] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleSelection(selection.name, val)}
                              className={`rounded-[8px] border px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 ${
                                isSelected
                                  ? "border-[#0A1B2E] bg-[#0A1B2E] text-white"
                                  : "border-[#E5E7EB] bg-white text-[#0A1B2E] hover:border-[#B9954F] hover:bg-[#FBFBF9]"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                      
                      {validationErrors[selection.name] && (
                        <p className="text-xs font-semibold text-red-500">
                          {validationErrors[selection.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-8 rounded-[12px] border border-[#E5E7EB] bg-white p-5 text-center">
                  <p className="text-sm font-bold text-[#64748B]">This product is currently unavailable.</p>
                </div>
              )}

              {isAvailable && (
                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex h-14 w-full items-center justify-center gap-2 rounded-[10px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 sm:text-lg ${
                      addedSuccess
                        ? "border-[#22C55E] bg-[#22C55E] text-white"
                        : "bg-[#0A1B2E] text-white hover:bg-[#0A1B2E]/90 active:scale-[0.99]"
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <CheckIcon className="h-5 w-5" />
                        Added to Cart
                      </>
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                </div>
              )}

              {product.options && product.options.length > 0 && (
                <div className="mt-12 rounded-[12px] border border-[#E5E7EB] bg-white p-6 sm:p-8">
                  <h3 className="mb-5 text-sm font-extrabold uppercase tracking-widest text-[#0A1B2E]">
                    Product Information
                  </h3>
                  <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5">
                    {product.options.map((opt) => (
                      <div key={opt.name} className="flex flex-col gap-1">
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          {opt.name}
                        </dt>
                        <dd className="text-sm font-medium text-[#0A1B2E]">
                          {opt.values.join(", ")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </>
  );
}