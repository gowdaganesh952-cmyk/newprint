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

import { useCart } from "@/app/components/cart/CartProvider";
import Navbar from "@/app/components/Navbar";

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

  handler: (
    response: RazorpayResponse
  ) => void;
}

interface RazorpayInstance {
  open: () => void;
}

/* ============================================================
   GLOBAL
============================================================ */

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

/* ============================================================
   CONFIG
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

/* ============================================================
   ICONS
============================================================ */

function ArrowLeftIcon({
  size = 18,
}: {
  size?: number;
}) {
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

function ArrowRightIcon({
  size = 18,
}: {
  size?: number;
}) {
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

function CheckIcon({
  size = 16,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function PlusIcon({
  size = 17,
}: {
  size?: number;
}) {
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

function MapPinIcon() {
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
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
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
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </svg>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatPrice(
  value: number
): string {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

/* ============================================================
   RAZORPAY SCRIPT
============================================================ */

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(
    (resolve) => {
      if (
        typeof window !==
          "undefined" &&
        window.Razorpay
      ) {
        resolve(true);
        return;
      }

      const existing =
        document.querySelector(
          `script[src="${RAZORPAY_SCRIPT}"]`
        );

      if (existing) {
        if (
          (
            existing as HTMLScriptElement
          ).dataset.loaded ===
          "true"
        ) {
          resolve(
            Boolean(
              window.Razorpay
            )
          );

          return;
        }

        const handleLoad =
          () => {
            (
              existing as HTMLScriptElement
            ).dataset.loaded =
              "true";

            resolve(
              Boolean(
                window.Razorpay
              )
            );
          };

        const handleError =
          () =>
            resolve(false);

        existing.addEventListener(
          "load",
          handleLoad,
          {
            once: true,
          }
        );

        existing.addEventListener(
          "error",
          handleError,
          {
            once: true,
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        RAZORPAY_SCRIPT;

      script.async = true;

      script.onload = () => {
        script.dataset.loaded =
          "true";

        resolve(
          Boolean(
            window.Razorpay
          )
        );
      };

      script.onerror = () =>
        resolve(false);

      document.body.appendChild(
        script
      );
    }
  );
}

/* ============================================================
   LOADING SKELETON
============================================================ */

function CheckoutSkeleton() {
  return (
    <div className="min-h-[100svh] bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-[92px] sm:px-6 sm:pt-[106px] lg:px-8">
        <div className="animate-pulse">
          <div className="h-4 w-28 rounded bg-[#E5E7EB]" />

          <div className="mt-4 h-8 w-48 rounded bg-[#E5E7EB]" />

          <div className="mt-2 h-4 w-72 max-w-full rounded bg-[#E5E7EB]" />

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
            <div className="space-y-5 lg:col-span-8">
              <div className="h-64 rounded-[12px] bg-white" />

              <div className="h-72 rounded-[12px] bg-white" />

              <div className="h-40 rounded-[12px] bg-white" />
            </div>

            <div className="h-80 rounded-[12px] bg-white lg:col-span-4" />
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
      className={`
        w-full
        rounded-[10px]
        border
        p-3.5
        text-left
        transition-colors
        duration-150
        sm:p-4
        ${
          selected
            ? "border-[#0A1B2E] bg-[#F8FAFC] ring-1 ring-[#0A1B2E]"
            : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#FCFCFB]"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
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
                : "border-[#CBD5E1] bg-white"
            }
          `}
        >
          {selected && (
            <CheckIcon size={12} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#0A1B2E]">
              {address.fullName}
            </p>

            {address.isDefault && (
              <span className="rounded-full bg-[#F5F2E8] px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-[#8B6E32]">
                DEFAULT
              </span>
            )}
          </div>

          <p className="mt-1 text-[11px] font-semibold text-[#64748B]">
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

            {address.city},{" "}
            {address.state} -{" "}
            {address.pincode}

            {address.landmark && (
              <>
                <br />
                Landmark:{" "}
                {address.landmark}
              </>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function CheckoutPage() {
  const router =
    useRouter();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const {
    items,
    subtotal,
    itemCount,
    isInitializing,
    isCartPrintReady,
  } = useCart();

  /* ==========================================================
     ADDRESS STATE
  ========================================================== */

  const [
    addresses,
    setAddresses,
  ] = useState<Address[]>([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<
    string | null
  >(null);

  const [
    isLoadingAddresses,
    setIsLoadingAddresses,
  ] = useState(true);

  /* ==========================================================
     PAYMENT STATE
  ========================================================== */

  const [
    isCreatingPayment,
    setIsCreatingPayment,
  ] = useState(false);

  const [
    isVerifyingPayment,
    setIsVerifyingPayment,
  ] = useState(false);

  /* ==========================================================
     ERROR STATE
  ========================================================== */

  const [
    pageError,
    setPageError,
  ] = useState<
    string | null
  >(null);

  const [
    paymentError,
    setPaymentError,
  ] = useState<
    string | null
  >(null);

  /* ==========================================================
     DELIVERY
  ========================================================== */

  const deliveryFee = 0;

  const totalAmount =
    useMemo(
      () =>
        Number(subtotal || 0) +
        Number(deliveryFee),
      [
        subtotal,
        deliveryFee,
      ]
    );

  /* ==========================================================
     SELECTED ADDRESS
  ========================================================== */

  const selectedAddress =
    useMemo(
      () =>
        addresses.find(
          (address) =>
            address._id ===
            selectedAddressId
        ) || null,
      [
        addresses,
        selectedAddressId,
      ]
    );

  /* ==========================================================
     AUTH REDIRECT
  ========================================================== */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace(
        "/sign-in?redirect_url=/checkout"
      );
    }
  }, [
    isLoaded,
    isSignedIn,
    router,
  ]);

  /* ==========================================================
     LOAD ADDRESSES
  ========================================================== */

  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn
    ) {
      return;
    }

    let cancelled = false;

    const fetchAddresses =
      async () => {
        setIsLoadingAddresses(
          true
        );

        setPageError(
          null
        );

        try {
          const token =
            await getToken();

          if (!token) {
            throw new Error(
              "Authentication token unavailable."
            );
          }

          const response =
            await fetch(
              `${API_URL}/api/addresses`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },

                cache: "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "Failed to load addresses."
            );
          }

          const loadedAddresses =
            Array.isArray(
              data.addresses
            )
              ? data.addresses
              : [];

          if (
            cancelled
          ) {
            return;
          }

          setAddresses(
            loadedAddresses
          );

          const defaultAddress =
            loadedAddresses.find(
              (
                address: Address
              ) =>
                address.isDefault
            );

          setSelectedAddressId(
            (current) => {
              if (
                current &&
                loadedAddresses.some(
                  (
                    address: Address
                  ) =>
                    address._id ===
                    current
                )
              ) {
                return current;
              }

              return (
                defaultAddress?._id ||
                loadedAddresses[0]?._id ||
                null
              );
            }
          );
        } catch (
          error
        ) {
          console.error(
            "Load addresses error:",
            error
          );

          if (
            !cancelled
          ) {
            setPageError(
              error instanceof
                Error
                ? error.message
                : "Failed to load addresses."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setIsLoadingAddresses(
              false
            );
          }
        }
      };

    fetchAddresses();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    getToken,
  ]);

  /* ==========================================================
     VERIFY PAYMENT
  ========================================================== */

  const verifyRazorpayPayment =
    useCallback(
      async (
        razorpayResponse: RazorpayResponse
      ) => {
        try {
          setIsCreatingPayment(
            false
          );

          setIsVerifyingPayment(
            true
          );

          setPaymentError(
            null
          );

          const token =
            await getToken();

          if (!token) {
            throw new Error(
              "Authentication token unavailable."
            );
          }

          const response =
            await fetch(
              `${API_URL}/api/orders/verify-payment`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                body:
                  JSON.stringify({
                    razorpay_payment_id:
                      razorpayResponse.razorpay_payment_id,

                    razorpay_order_id:
                      razorpayResponse.razorpay_order_id,

                    razorpay_signature:
                      razorpayResponse.razorpay_signature,
                  }),
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "Payment verification failed."
            );
          }

          const orderId =
            data.order?.id;

          const orderNumber =
            data.order
              ?.orderNumber;

          if (orderId) {
            router.replace(
              `/checkout/success?orderId=${encodeURIComponent(
                orderId
              )}&orderNumber=${encodeURIComponent(
                orderNumber || ""
              )}`
            );
          } else {
            router.replace(
              "/checkout/success"
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Payment verification error:",
            error
          );

          setPaymentError(
            error instanceof
              Error
              ? error.message
              : "Payment verification failed. Please contact support before trying again."
          );

          setIsVerifyingPayment(
            false
          );
        }
      },
      [
        getToken,
        router,
      ]
    );

  /* ==========================================================
     PAYMENT
  ========================================================== */

  const handlePayment =
    useCallback(
      async () => {
        setPageError(
          null
        );

        setPaymentError(
          null
        );

        if (
          isCreatingPayment ||
          isVerifyingPayment
        ) {
          return;
        }

        if (!isSignedIn) {
          router.push(
            "/sign-in?redirect_url=/checkout"
          );

          return;
        }

        if (
          items.length ===
          0
        ) {
          setPageError(
            "Your cart is empty."
          );

          return;
        }

        if (
          !isCartPrintReady
        ) {
          setPageError(
            "Please add at least 1 print image for every physical product before payment."
          );

          return;
        }

        if (
          !selectedAddressId
        ) {
          setPageError(
            "Please select a delivery address."
          );

          return;
        }

        setIsCreatingPayment(
          true
        );

        try {
          const razorpayLoaded =
            await loadRazorpayScript();

          if (
            !razorpayLoaded ||
            !window.Razorpay
          ) {
            throw new Error(
              "Unable to load payment checkout. Please check your internet connection and try again."
            );
          }

          const token =
            await getToken();

          if (!token) {
            throw new Error(
              "Authentication token unavailable."
            );
          }

          const response =
            await fetch(
              `${API_URL}/api/orders/create-payment`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                body:
                  JSON.stringify({
                    addressId:
                      selectedAddressId,
                  }),
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "Unable to start payment."
            );
          }

          const razorpayData =
            data.razorpay;

          if (
            !razorpayData?.keyId ||
            !razorpayData?.orderId ||
            !razorpayData?.amount
          ) {
            throw new Error(
              "Invalid payment information received from server."
            );
          }

          const options:
            RazorpayOptions = {
            key:
              razorpayData.keyId,

            amount:
              razorpayData.amount,

            currency:
              razorpayData.currency ||
              "INR",

            name:
              "New Print",

            description:
              `Order ${
                data.order
                  ?.orderNumber ||
                ""
              }`,

            order_id:
              razorpayData.orderId,

            prefill: {
              name:
                selectedAddress
                  ?.fullName ||
                "",

              contact:
                selectedAddress
                  ?.phone ||
                "",
            },

            notes: {
              orderNumber:
                data.order
                  ?.orderNumber ||
                "",
            },

            theme: {
              color:
                "#0A1B2E",
            },

            modal: {
              ondismiss:
                () => {
                  setIsCreatingPayment(
                    false
                  );

                  setPaymentError(
                    "Payment window was closed. Your order is still pending payment."
                  );
                },
            },

            handler:
              async (
                response
              ) => {
                await verifyRazorpayPayment(
                  response
                );
              },
          };

          const razorpay =
            new window.Razorpay(
              options
            );

          razorpay.open();
        } catch (
          error
        ) {
          console.error(
            "Create payment error:",
            error
          );

          setPaymentError(
            error instanceof
              Error
              ? error.message
              : "Unable to start payment."
          );

          setIsCreatingPayment(
            false
          );
        }
      },
      [
        isCreatingPayment,
        isVerifyingPayment,
        isSignedIn,
        items.length,
        isCartPrintReady,
        selectedAddressId,
        getToken,
        selectedAddress,
        verifyRazorpayPayment,
        router,
      ]
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    !isLoaded ||
    isInitializing ||
    isLoadingAddresses
  ) {
    return (
      <CheckoutSkeleton />
    );
  }

  /* ==========================================================
     AUTH WAIT
  ========================================================== */

  if (!isSignedIn) {
    return null;
  }

  /* ==========================================================
     EMPTY CART
  ========================================================== */

  if (
    items.length ===
    0
  ) {
    return (
      <div className="min-h-[100svh] bg-[#F7F7F5]">
        <Navbar />

        <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-5 pt-[96px] text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F]">
            <span className="text-2xl">
              🛒
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-[#0A1B2E]">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Add products to your cart
            before continuing to checkout.
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-[9px] bg-[#0A1B2E] px-7 text-sm font-extrabold text-white transition-colors duration-150 hover:bg-[#142C46]"
          >
            Browse Products
          </Link>
        </main>
      </div>
    );
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-32 pt-[88px] sm:px-6 sm:pb-24 sm:pt-[104px] lg:px-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="mb-6 sm:mb-8">
          <Link
            href="/cart"
            className="mb-4 inline-flex min-h-9 items-center gap-2 text-xs font-bold text-[#64748B] transition-colors duration-150 hover:text-[#0A1B2E]"
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

          <h1 className="text-[29px] font-extrabold leading-none tracking-[-0.035em] text-[#0A1B2E] sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#64748B] sm:text-sm">
            Confirm your delivery address
            and securely complete your order.
          </p>
        </header>

        {/* ====================================================
            GLOBAL ERROR
        ==================================================== */}

        {(pageError ||
          paymentError) && (
          <div className="mb-5 flex items-start gap-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-extrabold text-red-600">
              !
            </div>

            <div className="min-w-0">
              <p className="text-xs font-extrabold text-red-700">
                Unable to continue
              </p>

              <p className="mt-0.5 text-[11px] leading-5 text-red-600">
                {pageError ||
                  paymentError}
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            PRINT WARNING
        ==================================================== */}

        {!isCartPrintReady && (
          <div className="mb-5 rounded-[10px] border border-[#E6D6A9] bg-[#FBF7E9] px-4 py-3.5">
            <p className="text-xs font-extrabold text-[#8B6E32]">
              Print images are incomplete
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[#8B6E32]">
              Every physical product needs
              at least one print image before
              you can continue.
            </p>

            <Link
              href="/cart"
              className="mt-2 inline-block text-[11px] font-extrabold text-[#8B6E32] underline underline-offset-2"
            >
              Go back to cart
            </Link>
          </div>
        )}

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-8">

          {/* ==================================================
              LEFT COLUMN
          ================================================== */}

          <div className="min-w-0 space-y-5 lg:col-span-8">

            {/* =================================================
                DELIVERY ADDRESS
            ================================================= */}

            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

              <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F2] px-4 py-4 sm:px-5 sm:py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#F5F2E8] text-[#B9954F]">
                      <MapPinIcon />
                    </span>

                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                        Step 1
                      </p>

                      <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                        Delivery Address
                      </h2>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-[#64748B] sm:text-xs">
                    Select where you want your
                    order delivered.
                  </p>
                </div>

                <Link
                  href="/dashboard/addresses?return=/checkout"
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-[7px] border border-[#DDE2E7] bg-white px-3 text-[10px] font-extrabold text-[#0A1B2E] transition-colors duration-150 hover:border-[#B9954F] hover:bg-[#FBFAF6] sm:text-xs"
                >
                  <PlusIcon size={14} />
                  <span className="hidden sm:inline">
                    Add Address
                  </span>
                  <span className="sm:hidden">
                    Add
                  </span>
                </Link>
              </div>

              <div className="p-4 sm:p-5">
                {addresses.length ===
                0 ? (
                  <div className="rounded-[10px] border border-dashed border-[#CBD5E1] bg-[#FAFAF8] px-4 py-8 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F]">
                      <MapPinIcon />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-[#0A1B2E]">
                      No delivery address
                    </h3>

                    <p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-[#64748B]">
                      Add an address to continue
                      with your order.
                    </p>

                    <Link
                      href="/dashboard/addresses?return=/checkout"
                      className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#0A1B2E] px-5 text-xs font-extrabold text-white transition-colors duration-150 hover:bg-[#142C46]"
                    >
                      <PlusIcon size={15} />
                      Add Delivery Address
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {addresses.map(
                        (
                          address
                        ) => (
                          <AddressCard
                            key={
                              address._id
                            }
                            address={
                              address
                            }
                            selected={
                              selectedAddressId ===
                              address._id
                            }
                            onSelect={() =>
                              setSelectedAddressId(
                                address._id
                              )
                            }
                          />
                        )
                      )}
                    </div>

                    <Link
                      href="/dashboard/addresses?return=/checkout"
                      className="mt-4 inline-block text-[11px] font-bold text-[#64748B] underline underline-offset-2 transition-colors duration-150 hover:text-[#0A1B2E]"
                    >
                      Manage all addresses
                    </Link>
                  </>
                )}
              </div>
            </section>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

              <div className="flex items-center justify-between border-b border-[#EEF0F2] px-4 py-4 sm:px-5 sm:py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#F5F2E8] text-[11px] font-extrabold text-[#B9954F]">
                      2
                    </span>

                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                        Review
                      </p>

                      <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                        Your Products
                      </h2>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-[#64748B] sm:text-xs">
                    {itemCount}{" "}
                    {itemCount === 1
                      ? "physical product"
                      : "physical products"}
                  </p>
                </div>

                <Link
                  href="/cart"
                  className="text-[10px] font-extrabold text-[#64748B] underline underline-offset-2 transition-colors duration-150 hover:text-[#0A1B2E] sm:text-xs"
                >
                  Edit cart
                </Link>
              </div>

              <div className="divide-y divide-[#EEF0F2] px-4 sm:px-5">
                {items.map(
                  (item) => {
                    const readyUnits =
                      item.printUnits.filter(
                        (
                          unit
                        ) =>
                          unit.images
                            .length >=
                          1
                      ).length;

                    const isReady =
                      item.printUnits.length ===
                        item.quantity &&
                      item.printUnits.every(
                        (
                          unit
                        ) =>
                          unit.images
                            .length >=
                          1
                      );

                    return (
                      <div
                        key={
                          item._id ||
                          item.itemKey
                        }
                        className="py-4 sm:py-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-[13px] font-extrabold leading-5 text-[#0A1B2E] sm:text-sm">
                              {item.name}
                            </h3>

                            {Object.entries(
                              item.selections ||
                                {}
                            ).length >
                              0 && (
                              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                                {Object.entries(
                                  item.selections ||
                                    {}
                                ).map(
                                  ([
                                    key,
                                    value,
                                  ]) => (
                                    <p
                                      key={
                                        key
                                      }
                                      className="text-[10px] text-[#64748B]"
                                    >
                                      <span className="font-bold text-[#94A3B8]">
                                        {
                                          key
                                        }
                                        :
                                      </span>{" "}
                                      {
                                        value
                                      }
                                    </p>
                                  )
                                )}
                              </div>
                            )}

                            <p className="mt-1.5 text-[10px] font-semibold text-[#64748B] sm:text-xs">
                              Qty{" "}
                              {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                            {formatPrice(
                              Number(
                                item.price
                              ) *
                                Number(
                                  item.quantity
                                )
                            )}
                          </p>
                        </div>

                        {/* PRINT STATUS */}

                        <div
                          className={`
                            mt-3
                            rounded-[8px]
                            border
                            px-3
                            py-2.5
                            ${
                              isReady
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
                                    isReady
                                      ? "bg-green-100 text-green-700"
                                      : "bg-[#F1E8CD] text-[#8B6E32]"
                                  }
                                `}
                              >
                                {isReady ? (
                                  <CheckIcon size={13} />
                                ) : (
                                  <span className="text-[10px] font-extrabold">
                                    !
                                  </span>
                                )}
                              </span>

                              <div className="min-w-0">
                                <p
                                  className={`
                                    text-[10px]
                                    font-extrabold
                                    ${
                                      isReady
                                        ? "text-green-700"
                                        : "text-[#8B6E32]"
                                    }
                                  `}
                                >
                                  Print Images
                                </p>

                                <p
                                  className={`
                                    mt-0.5
                                    text-[9px]
                                    ${
                                      isReady
                                        ? "text-green-600"
                                        : "text-[#8B6E32]"
                                    }
                                  `}
                                >
                                  {readyUnits}/
                                  {
                                    item.quantity
                                  }{" "}
                                  ready
                                </p>
                              </div>
                            </div>

                            <Link
                              href="/cart"
                              className="shrink-0 text-[9px] font-extrabold underline underline-offset-2 sm:text-[10px]"
                            >
                              Edit
                            </Link>
                          </div>

                          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                            {item.printUnits.map(
                              (
                                unit,
                                index
                              ) => (
                                <span
                                  key={
                                    unit.unitId
                                  }
                                  className={`
                                    shrink-0
                                    rounded-[5px]
                                    px-2
                                    py-1
                                    text-[8px]
                                    font-extrabold
                                    ${
                                      unit
                                        .images
                                        .length >=
                                      1
                                        ? "bg-white text-green-700"
                                        : "bg-white text-[#8B6E32]"
                                    }
                                  `}
                                >
                                  P
                                  {index +
                                    1}
                                  {" "}
                                  {
                                    unit
                                      .images
                                      .length
                                  }
                                  /3
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* =================================================
                PAYMENT
            ================================================= */}

            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

              <div className="border-b border-[#EEF0F2] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#F5F2E8] text-[11px] font-extrabold text-[#B9954F]">
                    3
                  </span>

                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                      Secure
                    </p>

                    <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                      Payment
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 rounded-[9px] border border-[#E5E7EB] bg-[#FAFAF8] p-3.5 sm:p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#0A1B2E] text-white">
                    <CardIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#0A1B2E] sm:text-sm">
                      Secure online payment
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-[#64748B] sm:text-xs">
                      You will be securely
                      redirected to the payment
                      checkout after confirming
                      your order.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#64748B]">
                  <ShieldIcon />

                  <span>
                    Your payment is processed
                    securely.
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================
              DESKTOP SUMMARY
          ================================================== */}

          <aside className="hidden lg:sticky lg:top-[104px] lg:col-span-4 lg:block">
            <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

              <div className="border-b border-[#EEF0F2] px-5 py-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
                  Order
                </p>

                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
                  Summary
                </h2>
              </div>

              <div className="p-5">

                {/* STATUS */}

                <div
                  className={`
                    rounded-[9px]
                    border
                    p-3
                    ${
                      isCartPrintReady
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
                          isCartPrintReady
                            ? "bg-green-100 text-green-700"
                            : "bg-[#F1E8CD] text-[#8B6E32]"
                        }
                      `}
                    >
                      {isCartPrintReady ? (
                        <CheckIcon size={13} />
                      ) : (
                        <span className="text-[10px] font-extrabold">
                          !
                        </span>
                      )}
                    </span>

                    <div>
                      <p
                        className={`
                          text-xs
                          font-extrabold
                          ${
                            isCartPrintReady
                              ? "text-green-700"
                              : "text-[#8B6E32]"
                          }
                        `}
                      >
                        {isCartPrintReady
                          ? "Order ready"
                          : "Print images required"}
                      </p>

                      <p
                        className={`
                          mt-0.5
                          text-[10px]
                          leading-4
                          ${
                            isCartPrintReady
                              ? "text-green-600"
                              : "text-[#8B6E32]"
                          }
                        `}
                      >
                        {isCartPrintReady
                          ? "Everything is ready for payment."
                          : "Complete all print images in your cart."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PRICE */}

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">
                      Products
                    </span>

                    <span className="font-bold text-[#0A1B2E]">
                      {formatPrice(
                        subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">
                      Delivery
                    </span>

                    <span className="font-bold text-[#0A1B2E]">
                      FREE
                    </span>
                  </div>
                </div>

                {/* TOTAL */}

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#E5E7EB] pt-5">
                  <span className="text-sm font-extrabold text-[#0A1B2E]">
                    Total
                  </span>

                  <span className="text-[25px] font-extrabold tracking-[-0.03em] text-[#0A1B2E]">
                    {formatPrice(
                      totalAmount
                    )}
                  </span>
                </div>

                {/* ADDRESS */}

                {selectedAddress && (
                  <div className="mt-5 rounded-[9px] border border-[#E5E7EB] bg-[#FAFAF8] p-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                      Delivering to
                    </p>

                    <p className="mt-1 text-xs font-extrabold text-[#0A1B2E]">
                      {
                        selectedAddress.fullName
                      }
                    </p>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#64748B]">
                      {
                        selectedAddress.addressLine1
                      }
                      ,{" "}
                      {
                        selectedAddress.city
                      }
                      ,{" "}
                      {
                        selectedAddress.state
                      }{" "}
                      -{" "}
                      {
                        selectedAddress.pincode
                      }
                    </p>
                  </div>
                )}

                {/* PAY */}

                <button
                  type="button"
                  onClick={
                    handlePayment
                  }
                  disabled={
                    isCreatingPayment ||
                    isVerifyingPayment ||
                    !selectedAddressId ||
                    !isCartPrintReady ||
                    addresses.length ===
                      0
                  }
                  className="
                    mt-5
                    flex
                    h-13
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-[9px]
                    bg-[#0A1B2E]
                    px-5
                    text-sm
                    font-extrabold
                    text-white
                    transition-colors
                    duration-150
                    hover:bg-[#142C46]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {isCreatingPayment ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Starting payment...
                    </>
                  ) : isVerifyingPayment ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Pay{" "}
                      {formatPrice(
                        totalAmount
                      )}
                      <ArrowRightIcon size={17} />
                    </>
                  )}
                </button>

                {!selectedAddressId && (
                  <p className="mt-2.5 text-center text-[10px] font-semibold text-[#8B6E32]">
                    Select a delivery address
                    first.
                  </p>
                )}

                {!isCartPrintReady && (
                  <p className="mt-2.5 text-center text-[10px] font-semibold text-[#8B6E32]">
                    Complete print images
                    first.
                  </p>
                )}

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-[#94A3B8]">
                  <ShieldIcon />

                  <span>
                    Secure payment checkout
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ========================================================
          MOBILE PAYMENT BAR
      ======================================================== */}

      <div
        className="
          fixed
          inset-x-0
          bottom-0
          z-40
          border-t
          border-[#E5E7EB]
          bg-white
          px-3
          pb-[calc(0.75rem+env(safe-area-inset-bottom))]
          pt-3
          shadow-[0_-8px_28px_rgba(10,27,46,0.08)]
          lg:hidden
        "
      >
        <div className="mx-auto flex w-full max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#94A3B8]">
              Total
            </p>

            <p className="mt-0.5 text-lg font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
              {formatPrice(
                totalAmount
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handlePayment
            }
            disabled={
              isCreatingPayment ||
              isVerifyingPayment ||
              !selectedAddressId ||
              !isCartPrintReady ||
              addresses.length === 0
            }
            className="
              flex
              h-12
              min-w-[150px]
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-[9px]
              bg-[#0A1B2E]
              px-4
              text-xs
              font-extrabold
              text-white
              transition-colors
              duration-150
              active:bg-[#081827]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {isCreatingPayment ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing
              </>
            ) : isVerifyingPayment ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
  );
}