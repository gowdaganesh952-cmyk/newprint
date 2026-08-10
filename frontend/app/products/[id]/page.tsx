"use client";

import { useEffect, useMemo, useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/app/lib/api";
import Navbar from "@/app/components/Navbar";
import { useCart } from "@/app/components/cart/CartProvider"; // <-- Added

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
  slug?: string;
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
// ICONS (Same as existing)
// ============================================================
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ArrowLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  );
}
function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ============================================================
// SKELETON
// ============================================================
const ProductDetailSkeleton = memo(() => {
  return (
    <main className="min-h-screen bg-[#F7F7F5] pb-20 pt-[82px] sm:pt-[96px]">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 h-4 w-52 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-10 lg:gap-14">
          <div>
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#E5E7EB]" />
            <div className="mt-3 flex gap-2.5 overflow-hidden">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-[68px] w-[68px] shrink-0 animate-pulse rounded-xl bg-[#E5E7EB] sm:h-[78px] sm:w-[78px]" />
              ))}
            </div>
          </div>
          <div className="pt-1 md:pt-3">
            <div className="h-3 w-24 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="mt-4 h-9 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="mt-4 h-7 w-28 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="mt-7 space-y-3">
              <div className="h-3 w-full animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
            </div>
            <div className="mt-8 h-24 animate-pulse rounded-xl bg-[#E5E7EB]" />
            <div className="mt-6 h-14 animate-pulse rounded-xl bg-[#E5E7EB]" />
          </div>
        </div>
      </div>
    </main>
  );
});
ProductDetailSkeleton.displayName = "ProductDetailSkeleton";

const FALLBACK_IMAGE = "/images/product-placeholder.jpg";

export default function ProductDetailPage() {
  const params = useParams();
  const identifier = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const { get } = useApi();
  const { addToCart } = useCart(); // <-- Connected to CartContext

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      if (!identifier) return;
      try {
        setLoading(true); setError(false); setNotFound(false);
        const response = await get<ProductResponse>(`/api/products/${encodeURIComponent(identifier)}`);
        if (!mounted) return;
        if (response?.success && response.product) {
          setProduct(response.product);
          setActiveImageIndex(0);
          setSelections({});
          setValidationErrors({});
        } else {
          setNotFound(true);
        }
      } catch (err: any) {
        if (!mounted) return;
        const message = err?.message?.toLowerCase?.() || "";
        if (err?.response?.status === 404 || message.includes("404") || message.includes("not found")) {
          setNotFound(true);
        } else {
          setError(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => { mounted = false; };
  }, [identifier, get]);

  const productImages = useMemo(() => {
    if (!product?.images?.length) return [FALLBACK_IMAGE];
    const validImages = product.images.filter(image => typeof image === "string" && image.trim().length > 0);
    return validImages.length ? validImages : [FALLBACK_IMAGE];
  }, [product]);

  const activeImage = productImages[Math.min(activeImageIndex, productImages.length - 1)] || FALLBACK_IMAGE;
  const hasMultipleImages = productImages.length > 1;

  const categoryName = product?.category?.name || "Products";
  const isAvailable = product?.status === "active";
  const orderSelections = product?.orderSelections || [];
  const productOptions = product?.options || [];

  const handleSelection = (selectionName: string, value: string) => {
    setSelections(previous => ({ ...previous, [selectionName]: value }));
    if (validationErrors[selectionName]) {
      setValidationErrors(previous => {
        const updated = { ...previous };
        delete updated[selectionName];
        return updated;
      });
    }
  };

  const showPreviousImage = () => setActiveImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1);
  const showNextImage = () => setActiveImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1);

  const validateSelections = () => {
    if (!product) return false;
    const errors: Record<string, string> = {};
    let firstMissingSelection: string | null = null;
    
    orderSelections.forEach((selection) => {
      const selectedValue = selections[selection.name];
      if (selection.required && !selectedValue) {
        errors[selection.name] = `Please select ${selection.name}.`;
        if (!firstMissingSelection) firstMissingSelection = selection.name;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      if (firstMissingSelection) {
        requestAnimationFrame(() => {
          const element = document.getElementById(`selection-${firstMissingSelection}`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
      return false;
    }
    return true;
  };

  // ==========================================================
  // UPDATED ADD TO CART HANDLER
  // ==========================================================
  const handleAddToCart = async () => {
    if (!product || !isAvailable) return;
    if (!validateSelections()) return;

    try {
      setIsAddingToCart(true);
      await addToCart(product, selections, 1);
      
      setAddedSuccess(true);
      window.setTimeout(() => {
        setAddedSuccess(false);
      }, 2500);
    } catch (err) {
      console.error("Failed to add product to cart:", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    if (!hasMultipleImages) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") showPreviousImage();
      if (event.key === "ArrowRight") showNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages, productImages.length]);

  if (loading) return <><Navbar /><ProductDetailSkeleton /></>;
  
  if (notFound) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#F7F7F5] px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-2xl">?</div>
            <h1 className="mt-5 text-xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-2xl">Product Not Found</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748B]">The product you are looking for does not exist or may have been removed.</p>
            <Link href="/products" className="mx-auto mt-7 flex h-12 w-full max-w-[230px] items-center justify-center gap-2 rounded-xl bg-[#0A1B2E] px-5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#142C46] active:scale-[0.98]">
              <ArrowLeftIcon /> Back to Products
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
        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#F7F7F5] px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-xl">!</div>
            <h1 className="mt-5 text-xl font-extrabold text-[#0A1B2E] sm:text-2xl">Unable to Load Product</h1>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">Something went wrong while loading this product. Please try again.</p>
            <Link href="/products" className="mx-auto mt-7 flex h-12 w-full max-w-[230px] items-center justify-center rounded-xl border border-[#D9DDE3] bg-white px-5 text-sm font-bold text-[#0A1B2E] transition-all duration-200 hover:border-[#0A1B2E] active:scale-[0.98]">
              Back to Products
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-[#F7F7F5] pb-28 pt-[76px] sm:pb-24 sm:pt-[92px] lg:pt-[104px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <nav aria-label="Breadcrumb" className="mb-5 overflow-hidden sm:mb-7 lg:mb-9">
            <ol className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-[#64748B] sm:text-xs">
              <li className="shrink-0"><Link href="/" className="transition-colors hover:text-[#0A1B2E]">Home</Link></li>
              <li aria-hidden="true" className="shrink-0 text-[#CBD5E1]">/</li>
              <li className="shrink-0"><Link href="/products" className="transition-colors hover:text-[#0A1B2E]">Products</Link></li>
              <li aria-hidden="true" className="shrink-0 text-[#CBD5E1]">/</li>
              <li aria-current="page" className="min-w-0 truncate font-semibold text-[#0A1B2E]">{product.name}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-10 lg:gap-14 xl:gap-16">
            <section className="min-w-0">
              <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_4px_20px_rgba(10,27,46,0.04)]">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                  onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
                />
                {product.featured && (
                  <div className="absolute left-3 top-3 rounded-full bg-[#0A1B2E] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm sm:left-4 sm:top-4">
                    Featured
                  </div>
                )}
                {hasMultipleImages && (
                  <>
                    <button type="button" onClick={showPreviousImage} aria-label="Previous image" className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#0A1B2E] opacity-100 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white active:scale-95 sm:left-4 sm:h-10 sm:w-10">
                      <ChevronLeftIcon />
                    </button>
                    <button type="button" onClick={showNextImage} aria-label="Next image" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#0A1B2E] opacity-100 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white active:scale-95 sm:right-4 sm:h-10 sm:w-10">
                      <ChevronRightIcon />
                    </button>
                  </>
                )}
                {hasMultipleImages && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-[#0A1B2E]/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur sm:hidden">
                    {activeImageIndex + 1} / {productImages.length}
                  </div>
                )}
              </div>

              {hasMultipleImages && (
                <div className="relative mt-3">
                  <div className="flex gap-2.5 overflow-x-auto pb-1 pr-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    {productImages.map((image, index) => {
                      const selected = activeImageIndex === index;
                      return (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          aria-label={`View product image ${index + 1}`}
                          aria-current={selected ? "true" : undefined}
                          className={`relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all duration-200 sm:h-[78px] sm:w-[78px] ${selected ? "border-[#B9954F] shadow-[0_2px_10px_rgba(185,149,79,0.18)]" : "border-transparent hover:border-[#D8DCE2]"}`}
                        >
                          <Image src={image} alt={`${product.name} image ${index + 1}`} fill sizes="78px" className="object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {hasMultipleImages && (
                <p className="mt-2 hidden text-[10px] font-medium text-[#94A3B8] sm:block">Select an image to view it</p>
              )}
            </section>

            <section className="min-w-0 md:pt-1 lg:pt-2">
              <Link href="/products" className="inline-flex items-center rounded-full bg-[#EEEBDD] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8B6E32] transition-colors hover:bg-[#E8E2CF]">
                {categoryName}
              </Link>
              <h1 className="mt-4 break-words text-[28px] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#0A1B2E] sm:text-3xl lg:text-[40px] lg:leading-[1.05]">
                {product.name}
              </h1>
              <div className="mt-4 flex items-end gap-2">
                {typeof product.price === "number" ? (
                  <>
                    <span className="text-[26px] font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-3xl">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <span className="pb-1 text-xs font-medium text-[#94A3B8]">onwards</span>
                  </>
                ) : (
                  <span className="text-base font-bold uppercase tracking-wide text-[#64748B]">Custom Pricing</span>
                )}
              </div>

              {product.description && (
                <div className="mt-5 border-b border-[#E5E7EB] pb-6 sm:mt-6 sm:pb-7">
                  <p className="text-[13px] leading-6 text-[#64748B] sm:text-sm sm:leading-7">{product.description}</p>
                </div>
              )}

              {isAvailable && orderSelections.length > 0 && (
                <div className="mt-6 space-y-6 sm:mt-7">
                  {orderSelections.map((selection, selectionIndex) => {
                    const selectedValue = selections[selection.name];
                    const hasError = !!validationErrors[selection.name];
                    return (
                      <div key={`${selection.name}-${selectionIndex}`} id={`selection-${selection.name}`} className={`scroll-mt-28 rounded-xl transition-colors duration-200 ${hasError ? "rounded-xl bg-red-50/50 p-3 -mx-3" : ""}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-sm font-extrabold text-[#0A1B2E] sm:text-[15px]">{selection.name}</h2>
                              {selection.required ? (
                                <span className="rounded-full bg-[#EEEBDD] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8B6E32]">Required</span>
                              ) : (
                                <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Optional</span>
                              )}
                            </div>
                          </div>
                          {selectedValue && <span className="shrink-0 text-xs font-semibold text-[#64748B]">{selectedValue}</span>}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selection.values.map((value) => {
                            const isSelected = selectedValue === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleSelection(selection.name, value)}
                                className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 active:scale-[0.97] ${isSelected ? "border-[#0A1B2E] bg-[#0A1B2E] text-white shadow-[0_3px_10px_rgba(10,27,46,0.15)]" : "border-[#DDE2E7] bg-white text-[#0A1B2E] hover:border-[#B9954F] hover:bg-[#FBFAF6]"}`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected && <CheckIcon className="h-4 w-4" />}
                                  {value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {hasError && <p className="mt-2 text-xs font-semibold text-red-600">{validationErrors[selection.name]}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {!isAvailable && (
                <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-5 sm:mt-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">!</div>
                    <div>
                      <p className="text-sm font-bold text-[#0A1B2E]">Currently unavailable</p>
                      <p className="mt-0.5 text-xs text-[#64748B]">This product is currently not available for ordering.</p>
                    </div>
                  </div>
                </div>
              )}

              {isAvailable && (
                <div className="mt-7 hidden sm:block">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${addedSuccess ? "bg-[#16A34A] text-white" : "bg-[#0A1B2E] text-white hover:bg-[#142C46]"}`}
                  >
                    {isAddingToCart ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Adding...</>
                    ) : addedSuccess ? (
                      <><CheckIcon /> Added to Cart</>
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                  
                  {/* Subtle View Cart suggestion if successfully added */}
                  {addedSuccess && (
                     <div className="mt-3 text-center animate-in fade-in">
                        <Link href="/cart" className="text-sm font-semibold text-[#0A1B2E] hover:text-[#B9954F] underline underline-offset-4">
                           View Cart
                        </Link>
                     </div>
                  )}
                </div>
              )}

              {productOptions.length > 0 && (
                <div className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_15px_rgba(10,27,46,0.03)] sm:mt-10 sm:p-6">
                  <div className="mb-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">Product Details</p>
                    <h2 className="mt-1 text-base font-extrabold text-[#0A1B2E]">Product Information</h2>
                  </div>
                  <dl className="divide-y divide-[#EEF0F2]">
                    {productOptions.map((option, index) => (
                      <div key={`${option.name}-${index}`} className="grid grid-cols-[minmax(90px,0.7fr)_minmax(0,1.3fr)] gap-4 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr]">
                        <dt className="text-xs font-bold text-[#94A3B8] sm:text-sm">{option.name}</dt>
                        <dd className="text-right text-xs font-semibold leading-5 text-[#0A1B2E] sm:text-left sm:text-sm">{option.values.join(", ")}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7">
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3.5">
                  <p className="text-xs font-bold text-[#0A1B2E]">Quality</p>
                  <p className="mt-1 text-[10px] leading-4 text-[#94A3B8]">Carefully selected products</p>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3.5">
                  <p className="text-xs font-bold text-[#0A1B2E]">Custom</p>
                  <p className="mt-1 text-[10px] leading-4 text-[#94A3B8]">Options available per product</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {isAvailable && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(10,27,46,0.08)] backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#0A1B2E]">{product.name}</p>
              {typeof product.price === "number" && (
                <p className="mt-0.5 text-sm font-extrabold text-[#B9954F]">₹{product.price.toLocaleString("en-IN")}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`flex h-12 min-w-[150px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${addedSuccess ? "bg-[#16A34A]" : "bg-[#0A1B2E]"}`}
            >
              {isAddingToCart ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Adding</>
              ) : addedSuccess ? (
                <><CheckIcon /> Added</>
              ) : (
                "Add to Cart"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}