"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useCart } from "@/app/components/cart/CartProvider";
import Navbar from "@/app/components/Navbar";

// Icons
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  
  const { 
    items, 
    subtotal, 
    itemCount,
    isInitializing,
    isUpdating, 
    serverMessages,
    updateQuantity, 
    removeFromCart, 
    clearServerMessages 
  } = useCart();

  const handleCheckoutClick = () => {
    if (isSignedIn) {
      router.push("/checkout");
    } else {
      router.push("/sign-in?redirect_url=/checkout");
    }
  };

  // Loading Skeleton
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-[104px] sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded bg-[#E5E7EB] mb-8" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8 space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 animate-pulse">
                  <div className="h-24 w-24 rounded-xl bg-[#E5E7EB]" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 bg-[#E5E7EB] rounded" />
                    <div className="h-4 w-1/4 bg-[#E5E7EB] rounded" />
                    <div className="h-8 w-24 bg-[#E5E7EB] rounded-lg mt-4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="h-64 rounded-2xl border border-[#E5E7EB] bg-white p-6 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-[92px] sm:px-6 lg:px-8 lg:pb-24 lg:pt-[104px]">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-extrabold text-[#0A1B2E] sm:text-3xl">YOUR CART</h1>
          <p className="mt-1 text-sm font-medium text-[#64748B]">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {/* Server Validation Messages (Price changes, unavailable items, etc) */}
        {serverMessages.length > 0 && (
          <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm relative">
            <button 
              onClick={clearServerMessages}
              className="absolute top-4 right-4 text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-yellow-800 mb-2">Cart Updates</h3>
            <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
              {serverMessages.map((msg, idx) => <li key={idx}>{msg}</li>)}
            </ul>
          </div>
        )}

        {items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white py-20 px-4 text-center shadow-[0_2px_15px_rgba(10,27,46,0.03)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F7F7F5] text-[#0A1B2E]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-bold text-[#0A1B2E]">Your cart is empty.</h2>
            <p className="mt-2 text-sm text-[#64748B] max-w-sm">Looks like you haven't added anything yet.</p>
            <Link 
              href="/products"
              className="mt-8 flex h-12 items-center justify-center rounded-xl bg-[#0A1B2E] px-8 text-sm font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98]"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Cart Content Layout */
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
            
            {/* Left: Cart Items */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {items.map((item) => {
                const key = isSignedIn ? item._id! : item.itemKey;
                const options = Object.entries(item.selections || {});

                return (
                  <div 
                    key={key} 
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-[0_2px_15px_rgba(10,27,46,0.03)] relative"
                  >
                    {/* Image */}
                    <Link href={`/products/${item.productId}`} className="shrink-0 group">
                      <div className="relative h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F7F7F5]">
                        <Image 
                          src={item.image || "/images/product-placeholder.jpg"} 
                          alt={item.name} 
                          fill 
                          sizes="(max-width: 768px) 96px, 128px"
                          className="object-cover transition-transform group-hover:scale-105" 
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0 pt-1 sm:pt-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <Link href={`/products/${item.productId}`} className="truncate text-base sm:text-lg font-bold text-[#0A1B2E] hover:text-[#B9954F] transition-colors">
                            {item.name}
                          </Link>
                          
                          {/* Options */}
                          {options.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {options.map(([optName, optValue]) => (
                                <p key={optName} className="text-xs sm:text-sm text-[#64748B]">
                                  <span className="font-semibold">{optName}:</span> {optValue}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Desktop Price (Top Right) */}
                        <div className="hidden sm:block text-right">
                          <p className="text-lg font-extrabold text-[#0A1B2E]">₹{item.price.toLocaleString("en-IN")}</p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="mt-4 sm:mt-0 flex items-center justify-between border-t border-[#E5E7EB] sm:border-none pt-4 sm:pt-0">
                        {/* Mobile Price */}
                        <p className="sm:hidden text-base font-extrabold text-[#0A1B2E]">₹{item.price.toLocaleString("en-IN")}</p>
                        
                        <div className="flex items-center gap-4 ml-auto sm:ml-0">
                          {/* Quantity Toggle */}
                          <div className="flex items-center rounded-lg border border-[#E5E7EB] bg-white">
                            <button
                              type="button"
                              disabled={item.quantity <= 1 || isUpdating}
                              onClick={() => updateQuantity(key, item.quantity - 1)}
                              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-[#0A1B2E] transition-colors hover:bg-[#F7F7F5] disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-sm font-bold text-[#0A1B2E]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateQuantity(key, item.quantity + 1)}
                              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-[#0A1B2E] transition-colors hover:bg-[#F7F7F5] disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => removeFromCart(key)}
                            className="flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-lg px-2 sm:px-3 text-xs sm:text-sm font-semibold text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <TrashIcon />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-[104px]">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_2px_15px_rgba(10,27,46,0.03)]">
                <h2 className="text-lg font-bold text-[#0A1B2E]">ORDER SUMMARY</h2>
                
                <div className="mt-6 space-y-4 text-sm text-[#64748B]">
                  <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p className="font-semibold text-[#0A1B2E]">₹{subtotal.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Delivery</p>
                    <p className="font-semibold text-[#0A1B2E]">Calculated at checkout</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#E5E7EB] pt-6 flex justify-between items-center">
                  <p className="text-base font-bold text-[#0A1B2E]">Total</p>
                  <p className="text-2xl font-extrabold text-[#0A1B2E]">₹{subtotal.toLocaleString("en-IN")}</p>
                </div>

                {/* Desktop Checkout Button */}
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleCheckoutClick}
                  className="mt-8 hidden lg:flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0A1B2E] text-base font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] disabled:opacity-70"
                >
                  Proceed to Checkout <ArrowRightIcon />
                </button>
                
                <p className="mt-4 hidden lg:block text-center text-xs text-[#94A3B8]">
                  Taxes and shipping calculated at checkout.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Mobile Sticky Checkout Bar */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(10,27,46,0.08)] backdrop-blur-md pb-[env(safe-area-inset-bottom,16px)]">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#64748B]">Total ({itemCount})</p>
              <p className="text-lg font-extrabold text-[#0A1B2E]">₹{subtotal.toLocaleString("en-IN")}</p>
            </div>
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleCheckoutClick}
              className="flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-[#0A1B2E] px-6 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-70"
            >
              Checkout <ArrowRightIcon />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}