"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import Navbar from "@/app/components/Navbar";
import {
  useCart,
  type PrintUnit,
} from "@/app/components/cart/CartProvider";

/* ============================================================
    CONFIG
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

const MAX_PRINT_IMAGES = 6;

/* ============================================================
    TYPES
============================================================ */

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

/* ============================================================
    HELPERS
============================================================ */

function formatPrice(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/* ============================================================
    RAZORPAY SCRIPT LOADER
============================================================ */

let razorpayPromise: Promise<boolean> | null = null;

function loadRazorpay(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve(Boolean(window.Razorpay));
        return;
      }

      existing.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;

    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(Boolean(window.Razorpay));
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  }).finally(() => {
    razorpayPromise = null;
  });

  return razorpayPromise;
}

/* ============================================================
    ICONS
============================================================ */

function ArrowLeftIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MapPinIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.8 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3l-7.8-13.2a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

/* ============================================================
    SPINNER
============================================================ */

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

/* ============================================================
    SKELETON
============================================================ */

function CheckoutSkeleton() {
  return (
    <div className="min-h-[100svh] bg-[#F7F7F5]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-[92px] sm:px-6 sm:pt-[106px] lg:px-8">
        <div className="animate-pulse">
          <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
          <div className="mt-4 h-9 w-48 rounded bg-[#E5E7EB]" />
          <div className="mt-3 h-3 w-72 max-w-full rounded bg-[#E5E7EB]" />

          <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <div className="h-60 rounded-[12px] bg-white" />
              <div className="h-80 rounded-[12px] bg-white" />
              <div className="h-40 rounded-[12px] bg-white" />
            </div>
            <div className="hidden h-[500px] rounded-[12px] bg-white lg:col-span-4 lg:block" />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
    ADDRESS CARD
============================================================ */

function AddressCard({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`
        w-full
        rounded-[10px]
        border
        p-3.5
        text-left
        outline-none
        transform-gpu
        transition-[border-color,background-color,box-shadow]
        duration-150
        active:scale-[0.99]
        focus-visible:ring-2
        focus-visible:ring-[#B9954F]
        sm:p-4
        ${
          selected
            ? "border-[#0A1B2E] bg-[#F8FAFC] shadow-[0_0_0_1px_#0A1B2E]"
            : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1]"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <span
          className={`
            mt-0.5
            flex
            h-5
            w-5
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            ${
              selected
                ? "border-[#0A1B2E] bg-[#0A1B2E] text-white"
                : "border-[#CBD5E1]"
            }
          `}
        >
          {selected && <CheckIcon size={12} />}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#0A1B2E]">
              {address.fullName}
            </p>
            {address.isDefault && (
              <span className="rounded-full bg-[#F5F2E8] px-2 py-0.5 text-[9px] font-extrabold text-[#8B6E32]">
                DEFAULT
              </span>
            )}
          </div>

          <p className="mt-1 text-[10px] font-semibold text-[#64748B]">
            {address.phone}
          </p>

          <p className="mt-2 text-[11px] leading-5 text-[#475569] sm:text-xs">
            {address.addressLine1}
            {address.addressLine2 && (
              <>
                <br />
                {address.addressLine2}
              </>
            )}
            <br />
            {address.city}, {address.state} - {address.pincode}
            {address.landmark && (
              <>
                <br />
                Landmark: {address.landmark}
              </>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ============================================================
    PRINT IMAGE STRIP
============================================================ */

function PrintImages({ units }: { units: PrintUnit[] }) {
  const images = units.flatMap((unit, unitIndex) =>
    unit.images.slice(0, MAX_PRINT_IMAGES).map((image, imageIndex) => ({
      ...image,
      key: `${unit.unitId}-${imageIndex}`,
      unitIndex,
    }))
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
          Print images
        </p>
        <p className="text-[9px] font-bold text-green-700">
          {images.length} uploaded
        </p>
      </div>

      <div
        className="
          flex
          gap-2
          overflow-x-auto
          overscroll-x-contain
          pb-1
          will-change-scroll
          [-webkit-overflow-scrolling:touch]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {images.map((image) => (
          <div
            key={image.key}
            className="
              relative
              h-16
              w-16
              shrink-0
              overflow-hidden
              rounded-[7px]
              border
              border-[#DDE2E7]
              bg-white
              sm:h-20
              sm:w-20
            "
          >
            <img
              src={image.url}
              alt={`Print ${image.unitIndex + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <span className="absolute bottom-1 left-1 rounded-[4px] bg-[#0A1B2E]/85 px-1.5 py-0.5 text-[8px] font-extrabold text-white">
              P{image.unitIndex + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
    CHECKOUT PAGE
============================================================ */

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { items, subtotal, shippingCharge, total, itemCount, loading, updating } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable checkout session ID for idempotency matching backend controller[cite: 1]
  const [checkoutSessionId] = useState(() => {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  });

  const selectedAddress = useMemo(
    () => addresses.find((address) => address._id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const isPrintReady = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (item.printUnits.length !== quantity) return false;
      return item.printUnits.every(
        (unit) => unit.images.length >= 1 && unit.images.length <= MAX_PRINT_IMAGES
      );
    });
  }, [items]);

  const busy = paymentLoading || verifying || updating;

  // Auth Redirect Guard
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in?redirect_url=/checkout");
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch Saved Addresses
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    const loadAddresses = async () => {
      setAddressLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token unavailable.");

        const response = await fetch(`${API_URL}/api/addresses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Unable to load addresses.");
        }

        const loaded = Array.isArray(data.addresses) ? data.addresses : [];
        if (cancelled) return;

        setAddresses(loaded);
        setSelectedAddressId((current) => {
          if (current && loaded.some((addr: Address) => addr._id === current)) {
            return current;
          }
          return loaded.find((addr: Address) => addr.isDefault)?._id || loaded[0]?._id || null;
        });
      } catch (reqErr) {
        if (!cancelled) {
          setError(reqErr instanceof Error ? reqErr.message : "Unable to load addresses.");
        }
      } finally {
        if (!cancelled) setAddressLoading(false);
      }
    };

    loadAddresses();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const verifyPayment = useCallback(
    async (response: RazorpayResponse) => {
      try {
        setVerifying(true);
        setError(null);

        const token = await getToken();
        if (!token) throw new Error("Authentication token unavailable.");

        const result = await fetch(`${API_URL}/api/orders/verify-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const data = await result.json().catch(() => null);

        if (!result.ok || !data?.success) {
          if (data?.paymentReceived) {
            throw new Error(
              `${data.message || "Payment was received, but the order needs support review."} Order: ${data.order?.orderNumber || ""}`
            );
          }
          throw new Error(data?.message || "Payment verification failed.");
        }

        const orderId = data.order?.id;
        const orderNumber = data.order?.orderNumber;

        if (orderId) {
          router.replace(
            `/checkout/success?orderId=${encodeURIComponent(orderId)}&orderNumber=${encodeURIComponent(orderNumber || "")}`
          );
        } else {
          router.replace("/checkout/success");
        }
      } catch (verr) {
        console.error("Payment verification error:", verr);
        setError(verr instanceof Error ? verr.message : "Payment verification failed.");
        setVerifying(false);
        setPaymentLoading(false);
      }
    },
    [getToken, router]
  );

  const handlePayment = useCallback(async () => {
    if (busy) return;
    setError(null);

    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/checkout");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!isPrintReady) {
      setError("Complete the print images before payment.");
      return;
    }
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }

    setPaymentLoading(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        throw new Error("Unable to load the payment gateway.");
      }

      const token = await getToken();
      if (!token) throw new Error("Authentication token unavailable.");

      const result = await fetch(`${API_URL}/api/orders/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: selectedAddressId,
          checkoutSessionId, // Sending session ID for backend idempotency[cite: 1]
        }),
      });

      const data = await result.json().catch(() => null);

      if (!result.ok || !data?.success) {
        throw new Error(data?.message || "Unable to start payment.");
      }

      const payment = data.razorpay;
      if (!payment?.keyId || !payment?.orderId || !payment?.amount) {
        throw new Error("Invalid payment information received from server.");
      }

      const options: RazorpayOptions = {
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency || "INR",
        name: "New Print",
        description: `Order ${data.order?.orderNumber || ""}`,
        order_id: payment.orderId,
        prefill: {
          name: selectedAddress?.fullName || "",
          contact: selectedAddress?.phone || "",
        },
        notes: {
          orderNumber: data.order?.orderNumber || "",
        },
        theme: {
          color: "#0A1B2E",
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setError("Payment window was closed. Your order is still pending payment.");
          },
        },
        handler: async (razorpayResponse) => {
          await verifyPayment(razorpayResponse);
        },
      };

      const instance = new window.Razorpay(options);
      instance.open();
    } catch (payErr) {
      console.error("Create payment error:", payErr);
      setError(payErr instanceof Error ? payErr.message : "Unable to start payment.");
      setPaymentLoading(false);
    }
  }, [
    busy,
    isSignedIn,
    router,
    items.length,
    isPrintReady,
    selectedAddressId,
    checkoutSessionId,
    getToken,
    selectedAddress,
    verifyPayment,
  ]);

  if (!isLoaded || loading || addressLoading) {
    return <CheckoutSkeleton />;
  }

  if (!isSignedIn) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[100svh] bg-[#F7F7F5]">
        <Navbar />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F]">
            <span className="text-2xl">🛒</span>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-[#0A1B2E]">Your cart is empty</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
            Add products to your cart before continuing to checkout.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex min-h-12 transform-gpu items-center rounded-[9px] bg-[#0A1B2E] px-7 text-sm font-extrabold text-white transition-colors duration-150 hover:bg-[#142C46] active:scale-[0.98]"
          >
            Browse Products
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-36 pt-[88px] sm:px-6 sm:pb-28 sm:pt-[104px] lg:px-8 lg:pb-24">
        {/* HEADER */}
        <header className="mb-6 sm:mb-8">
          <Link
            href="/cart"
            className="mb-4 inline-flex min-h-9 items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0A1B2E]"
          >
            <ArrowLeftIcon size={16} />
            Back to cart
          </Link>

          <div className="mb-3 flex items-center gap-2">
            <span className="h-[2px] w-7 bg-[#B9954F]" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F]">
              Final Step
            </span>
          </div>

          <h1 className="text-[30px] font-extrabold leading-none tracking-[-0.04em] text-[#0A1B2E] sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-2 text-[12px] leading-5 text-[#64748B] sm:text-sm">
            Confirm your address and securely complete your order.
          </p>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3.5">
            <div className="mt-0.5 text-red-600"><AlertIcon /></div>
            <div>
              <p className="text-xs font-extrabold text-red-700">Unable to continue</p>
              <p className="mt-1 text-[11px] leading-5 text-red-600">{error}</p>
            </div>
          </div>
        )}

        {!isPrintReady && (
          <div className="mb-5 rounded-[10px] border border-[#E6D6A9] bg-[#FBF7E9] px-4 py-3.5">
            <p className="text-xs font-extrabold text-[#8B6E32]">Print images are incomplete</p>
            <p className="mt-1 text-[11px] leading-5 text-[#8B6E32]">
              Every physical product needs 1–6 print images before payment.
            </p>
            <Link href="/cart" className="mt-2 inline-block text-[11px] font-extrabold text-[#8B6E32] underline underline-offset-2">
              Edit print images
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-5 lg:col-span-8">
            
            {/* STEP 1: ADDRESS */}
            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
              <div className="border-b border-[#EEF0F2] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#F5F2E8] text-[#B9954F]">
                        <MapPinIcon />
                      </span>
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">Step 1</p>
                        <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">Delivery Address</h2>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-[#64748B]">
                      Select where you want your order delivered.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/addresses?return=/checkout"
                    className="inline-flex min-h-10 shrink-0 transform-gpu items-center gap-1.5 rounded-[7px] border border-[#DDE2E7] bg-white px-3 text-[10px] font-extrabold text-[#0A1B2E] transition-colors hover:border-[#B9954F] active:scale-95 sm:text-xs"
                  >
                    <PlusIcon size={14} />
                    <span className="hidden sm:inline">Add Address</span>
                    <span className="sm:hidden">Add</span>
                  </Link>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {addresses.length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-[#CBD5E1] bg-[#FAFAF8] px-4 py-8 text-center">
                    <p className="text-sm font-extrabold text-[#0A1B2E]">No delivery address</p>
                    <p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-[#64748B]">
                      Add an address to continue.
                    </p>
                    <Link
                      href="/dashboard/addresses?return=/checkout"
                      className="mt-5 inline-flex min-h-11 transform-gpu items-center gap-2 rounded-[8px] bg-[#0A1B2E] px-5 text-xs font-extrabold text-white transition-colors hover:bg-[#142C46] active:scale-[0.98]"
                    >
                      <PlusIcon size={15} />
                      Add Address
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {addresses.map((address) => (
                      <AddressCard
                        key={address._id}
                        address={address}
                        selected={selectedAddressId === address._id}
                        onSelect={() => setSelectedAddressId(address._id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* STEP 2: REVIEW PRODUCTS */}
            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
              <div className="border-b border-[#EEF0F2] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#F5F2E8] text-[11px] font-extrabold text-[#B9954F]">
                        2
                      </span>
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">Review</p>
                        <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">Your Products</h2>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-[#64748B]">
                      {itemCount} {itemCount === 1 ? "physical product" : "physical products"}
                    </p>
                  </div>

                  <Link
                    href="/cart"
                    className="text-[10px] font-extrabold text-[#64748B] underline underline-offset-2 hover:text-[#0A1B2E] sm:text-xs"
                  >
                    Edit cart
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-[#EEF0F2]">
                {items.map((item) => {
                  const readyUnits = item.printUnits.filter((unit) => unit.images.length >= 1).length;
                  const ready =
                    item.printUnits.length === item.quantity &&
                    item.printUnits.every(
                      (unit) => unit.images.length >= 1 && unit.images.length <= MAX_PRINT_IMAGES
                    );

                  return (
                    <div key={item._id || item.itemKey} className="px-4 py-4 sm:px-5 sm:py-5">
                      <div className="flex items-start gap-3.5">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#FAFAF8] sm:h-20 sm:w-20">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-[#94A3B8]">
                              Product
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-[13px] font-extrabold leading-5 text-[#0A1B2E] sm:text-sm">
                                {item.name}
                              </h3>
                              {Object.entries(item.selections || {}).length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  {Object.entries(item.selections || {}).map(([key, value]) => (
                                    <span key={`${key}-${value}`} className="text-[10px] text-[#64748B]">
                                      <b className="text-[#94A3B8]">{key}:</b> {value}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="mt-1.5 text-[10px] font-semibold text-[#64748B]">
                                Qty {item.quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                              {formatPrice(Number(item.price) * Number(item.quantity))}
                            </p>
                          </div>

                          <div
                            className={`
                              mt-3
                              rounded-[9px]
                              border
                              p-3
                              ${
                                ready
                                  ? "border-green-200 bg-green-50"
                                  : "border-[#E6D6A9] bg-[#FBF7E9]"
                              }
                            `}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className={`
                                    flex
                                    h-6
                                    w-6
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    ${
                                      ready
                                        ? "bg-green-100 text-green-700"
                                        : "bg-[#F1E8CD] text-[#8B6E32]"
                                    }
                                  `}
                                >
                                  {ready ? <CheckIcon size={13} /> : "!"}
                                </span>
                                <div className="min-w-0">
                                  <p className={`text-[10px] font-extrabold ${ready ? "text-green-700" : "text-[#8B6E32]"}`}>
                                    Print Images
                                  </p>
                                  <p className={`mt-0.5 text-[9px] ${ready ? "text-green-600" : "text-[#8B6E32]"}`}>
                                    {readyUnits}/{item.quantity} physical product{readyUnits === 1 ? "" : "s"} ready
                                  </p>
                                </div>
                              </div>

                              <Link href="/cart" className="shrink-0 text-[9px] font-extrabold underline underline-offset-2 sm:text-[10px]">
                                Edit
                              </Link>
                            </div>

                            <PrintImages units={item.printUnits} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* STEP 3: PAYMENT GATEWAY INFO */}
            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
              <div className="border-b border-[#EEF0F2] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#F5F2E8] text-[11px] font-extrabold text-[#B9954F]">
                    3
                  </span>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">Secure</p>
                    <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">Payment</h2>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 rounded-[9px] border border-[#E5E7EB] bg-[#FAFAF8] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#0A1B2E] text-white">
                    <CardIcon />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#0A1B2E] sm:text-sm">Secure online payment</p>
                    <p className="mt-1 text-[10px] leading-5 text-[#64748B] sm:text-xs">
                      Your final amount is calculated by the server using the latest cart, product weight and stock.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#64748B]">
                  <ShieldIcon />
                  <span>Secure Razorpay checkout</span>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================
              DESKTOP SUMMARY SIDEBAR
          ================================================== */}
          <aside className="hidden lg:sticky lg:top-[104px] lg:col-span-4 lg:block">
            <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
              <div className="border-b border-[#EEF0F2] px-5 py-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">Order</p>
                <h2 className="mt-1 text-lg font-extrabold text-[#0A1B2E]">Summary</h2>
              </div>

              <div className="p-5">
                <div
                  className={`
                    rounded-[9px]
                    border
                    p-3
                    ${
                      isPrintReady
                        ? "border-green-200 bg-green-50"
                        : "border-[#E6D6A9] bg-[#FBF7E9]"
                    }
                  `}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`
                        mt-0.5
                        flex
                        h-6
                        w-6
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        ${
                          isPrintReady
                            ? "bg-green-100 text-green-700"
                            : "bg-[#F1E8CD] text-[#8B6E32]"
                        }
                      `}
                    >
                      {isPrintReady ? <CheckIcon size={13} /> : "!"}
                    </span>
                    <div>
                      <p className={`text-xs font-extrabold ${isPrintReady ? "text-green-700" : "text-[#8B6E32]"}`}>
                        {isPrintReady ? "Order ready" : "Print images required"}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-4 text-[#64748B]">
                        {isPrintReady
                          ? "All physical products have their required print images."
                          : "Complete the print images before payment."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-[#64748B]">Products</span>
                    <span className="font-bold text-[#0A1B2E]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-[#64748B]">Delivery</span>
                    <span className="font-bold text-[#0A1B2E]">
                      {shippingCharge > 0 ? formatPrice(shippingCharge) : "FREE"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#E5E7EB] pt-5">
                  <span className="text-sm font-extrabold text-[#0A1B2E]">Total</span>
                  <span className="text-[27px] font-extrabold tracking-[-0.035em] text-[#0A1B2E]">
                    {formatPrice(total)}
                  </span>
                </div>

                {selectedAddress && (
                  <div className="mt-5 rounded-[9px] border border-[#E5E7EB] bg-[#FAFAF8] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">Delivering to</p>
                    <p className="mt-1 text-xs font-extrabold text-[#0A1B2E]">{selectedAddress.fullName}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#64748B]">
                      {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={busy || !selectedAddressId || !isPrintReady || addresses.length === 0}
                  className="
                    mt-5
                    flex
                    h-13
                    w-full
                    transform-gpu
                    items-center
                    justify-center
                    gap-2
                    rounded-[9px]
                    bg-[#0A1B2E]
                    px-5
                    text-sm
                    font-extrabold
                    text-white
                    outline-none
                    transition-colors
                    duration-150
                    hover:bg-[#142C46]
                    active:scale-[0.98]
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    shadow-sm
                  "
                >
                  {paymentLoading ? (
                    <>
                      <Spinner />
                      Starting payment...
                    </>
                  ) : verifying ? (
                    <>
                      <Spinner />
                      Verifying payment...
                    </>
                  ) : (
                    <>
                      Pay {formatPrice(total)}
                      <ArrowRightIcon />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-[#94A3B8]">
                  <ShieldIcon />
                  <span>Secure payment checkout</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ========================================================
          MOBILE PAYMENT BAR (Glassmorphism)
      ======================================================== */}
      <div
        className="
          fixed
          inset-x-0
          bottom-0
          z-40
          border-t
          border-[#E5E7EB]/80
          bg-white/85
          px-4
          pt-3
          shadow-[0_-8px_28px_rgba(10,27,46,0.08)]
          backdrop-blur-xl
          supports-[backdrop-filter]:bg-white/60
          lg:hidden
        "
        style={{
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#94A3B8]">
              Delivery
            </span>
            <span className="text-[11px] font-bold text-[#64748B]">
              {shippingCharge > 0 ? formatPrice(shippingCharge) : "FREE"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#94A3B8]">
                Total
              </p>
              <p className="mt-0.5 text-lg font-extrabold tracking-[-0.025em] text-[#0A1B2E]">
                {formatPrice(total)}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={busy || !selectedAddressId || !isPrintReady || addresses.length === 0}
              className="
                flex
                h-12
                min-w-[150px]
                shrink-0
                transform-gpu
                items-center
                justify-center
                gap-2
                rounded-[9px]
                bg-[#0A1B2E]
                px-4
                text-xs
                font-extrabold
                text-white
                outline-none
                transition-colors
                duration-150
                hover:bg-[#142C46]
                active:scale-[0.97]
                focus-visible:ring-2
                focus-visible:ring-[#B9954F]
                disabled:cursor-not-allowed
                disabled:opacity-40
                shadow-sm
              "
            >
              {paymentLoading ? (
                <>
                  <Spinner />
                  Processing
                </>
              ) : verifying ? (
                <>
                  <Spinner />
                  Verifying
                </>
              ) : (
                <>
                  Pay Now
                  <ArrowRightIcon size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}