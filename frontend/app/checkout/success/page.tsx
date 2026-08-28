"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import Navbar from "@/app/components/Navbar";

/* ============================================================
   CONFIG
============================================================ */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* ============================================================
   TYPES
============================================================ */

interface PrintImage {
  url: string;
  publicId: string;
}

interface PrintUnit {
  unitId: string;
  images: PrintImage[];
}

interface OrderItem {
  _id?: string;
  productId: string;
  itemKey: string;

  name: string;
  image?: string;

  price: number;
  quantity: number;

  selections?: Record<string, string>;

  printUnits: PrintUnit[];
}

interface ShippingAddress {
  addressId?: string;

  fullName: string;
  phone: string;

  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  pincode: string;

  landmark?: string;
}

interface Order {
  _id: string;
  userId: string;

  orderNumber: string;

  items: OrderItem[];

  subtotal: number;
  deliveryFee: number;
  totalAmount: number;

  currency: string;

  status:
    | "Pending Payment"
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Cancelled";

  paymentStatus:
    | "Pending"
    | "Paid"
    | "Failed"
    | "Refunded";

  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;

  paymentMethod?: string | null;

  paymentVerifiedAt?: string | null;

  shippingAddress: ShippingAddress;

  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   ICONS
============================================================ */

function CheckIcon({
  size = 24,
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

function ArrowRightIcon({
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon({
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function MapPinIcon({
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

function PackageIcon({
  size = 19,
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ShieldIcon({
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

function ClockIcon({
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatPrice(value: number): string {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ============================================================
   LOADING
============================================================ */

function SuccessSkeleton() {
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-[92px] sm:px-6 sm:pt-[106px] lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto h-20 w-20 rounded-full bg-[#E7E8E6] motion-safe:animate-pulse" />

          <div className="mx-auto mt-6 h-8 w-64 max-w-full rounded-md bg-[#E7E8E6] motion-safe:animate-pulse" />

          <div className="mx-auto mt-3 h-4 w-80 max-w-full rounded-md bg-[#E7E8E6] motion-safe:animate-pulse" />

          <div className="mx-auto mt-3 h-4 w-56 max-w-full rounded-md bg-[#E7E8E6] motion-safe:animate-pulse" />

          <div className="mx-auto mt-7 h-24 max-w-lg rounded-[12px] bg-white motion-safe:animate-pulse" />

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="h-[420px] rounded-[12px] bg-white motion-safe:animate-pulse lg:col-span-8" />

            <div className="h-[350px] rounded-[12px] bg-white motion-safe:animate-pulse lg:col-span-4" />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   ERROR
============================================================ */

function ErrorScreen({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto flex min-h-[80svh] w-full max-w-xl flex-col items-center justify-center px-5 pb-16 pt-[100px] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F]">
          <span className="text-2xl font-extrabold">!</span>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <span className="h-[2px] w-6 bg-[#B9954F]" />

          <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F]">
            New Print
          </span>

          <span className="h-[2px] w-6 bg-[#B9954F]" />
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-3xl">
          {title}
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-[#64748B]">
          {message}
        </p>

        <div className="mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        // Inside ErrorScreen...
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-[9px] border border-[#DDE2E7] bg-white px-6 text-xs font-extrabold text-[#0A1B2E] transition-[border-color,background-color,transform] duration-200 hover:border-[#B9954F] hover:bg-[#FBFAF6] active:scale-[0.99] touch-manipulation will-change-transform"
          >
            Go Home
          </Link>

          <Link
            href="/dashboard/orders"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#0A1B2E] px-6 text-xs font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#142C46] active:scale-[0.99] touch-manipulation will-change-transform"
          >
            My Orders
            <ArrowRightIcon size={15} />
          </Link>

                <Link
                  href="/dashboard/orders"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#0A1B2E] px-5 text-xs font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#142C46] active:scale-[0.99] touch-manipulation will-change-transform"
                >
                  View My Orders
                  <ArrowRightIcon size={15} />
                </Link>

                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#DDE2E7] bg-white px-5 text-xs font-extrabold text-[#0A1B2E] transition-[border-color,background-color,transform] duration-200 hover:border-[#B9954F] hover:bg-[#FBFAF6] active:scale-[0.99] touch-manipulation will-change-transform"
                >
                  <ArrowLeftIcon size={15} />
                  Continue Shopping
                </Link>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   SUCCESS MARK
============================================================ */

function SuccessMark() {
  return (
    <div className="mx-auto flex h-[82px] w-[82px] items-center justify-center rounded-full bg-[#F5F2E8]">
      <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#0A1B2E] text-white shadow-[0_10px_28px_rgba(10,27,46,0.15)]">
        <CheckIcon size={29} />
      </div>
    </div>
  );
}

/* ============================================================
   STATUS
============================================================ */

function StatusPill({
  status,
}: {
  status: Order["status"];
}) {
  let className =
    "border-[#E6D6A9] bg-[#FBF7E9] text-[#8B6E32]";

  if (status === "Processing") {
    className =
      "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "Shipped") {
    className =
      "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (status === "Delivered") {
    className =
      "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Cancelled") {
    className =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-center text-[9px] font-extrabold uppercase tracking-[0.07em] ${className}`}
    >
      {status}
    </span>
  );
}

/* ============================================================
   PAYMENT STATUS
============================================================ */

function PaymentStatus({
  status,
}: {
  status: Order["paymentStatus"];
}) {
  const paid = status === "Paid";

  return (
    <span
      className={`inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.07em] ${
        paid
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-[#E6D6A9] bg-[#FBF7E9] text-[#8B6E32]"
      }`}
    >
      {paid && <CheckIcon size={11} />}
      {status}
    </span>
  );
}

/* ============================================================
   MAIN CONTENT
============================================================ */

function CheckoutSuccessContent() {
  /*
   * IMPORTANT:
   *
   * ALL HOOKS ARE DECLARED BEFORE
   * ANY CONDITIONAL RETURN.
   *
   * This fixes:
   *
   * "Rendered more hooks than during
   * the previous render."
   */

  const searchParams = useSearchParams();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const orderId =
    searchParams.get("orderId");

  const orderNumberFromUrl =
    searchParams.get("orderNumber");

  const [order, setOrder] =
    useState<Order | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ==========================================================
     FETCH ORDER
  ========================================================== */

  const fetchOrder = useCallback(
    async () => {
      if (!orderId || !isSignedIn) {
        return;
      }

      try {
        setError(null);

        const token =
          await getToken();

        if (!token) {
          throw new Error(
            "Authentication token unavailable."
          );
        }

        const response =
          await fetch(
            `${API_URL}/api/orders/${encodeURIComponent(
              orderId
            )}`,
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
            .catch(() => null);

        if (
          !response.ok ||
          !data?.success ||
          !data?.order
        ) {
          throw new Error(
            data?.message ||
              "Unable to load your order."
          );
        }

        setOrder(data.order);
      } catch (fetchError) {
        console.error(
          "Order success page fetch error:",
          fetchError
        );

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load your order."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      orderId,
      isSignedIn,
      getToken,
    ]
  );

  /* ==========================================================
     LOAD ORDER
  ========================================================== */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    if (!orderId) {
      setIsLoading(false);

      setError(
        "This order confirmation link is incomplete."
      );

      return;
    }

    fetchOrder();
  }, [
    isLoaded,
    isSignedIn,
    orderId,
    fetchOrder,
  ]);

  /* ==========================================================
     PAGE SCROLL
  ========================================================== */

  useEffect(() => {
    document.documentElement.style.scrollBehavior =
      "smooth";

    return () => {
      document.documentElement.style.scrollBehavior =
        "";
    };
  }, []);

  /* ==========================================================
     DERIVED VALUES
     
     IMPORTANT:
     
     These are normal calculations,
     NOT HOOKS.
     
     Therefore they are safe after
     the loading/auth/error checks.
  ========================================================== */

  const displayOrderNumber =
    order?.orderNumber ||
    orderNumberFromUrl ||
    "Your order";

  const itemCount =
    order?.items?.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    ) || 0;

  const totalPrintUnits =
    order?.items?.reduce(
      (total, item) =>
        total +
        (Array.isArray(item.printUnits)
          ? item.printUnits.length
          : 0),
      0
    ) || 0;

  const paymentDate =
    order?.paymentVerifiedAt ||
    order?.createdAt ||
    "";

  const paymentTime =
    formatTime(paymentDate);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    !isLoaded ||
    isLoading
  ) {
    return (
      <SuccessSkeleton />
    );
  }

  /* ==========================================================
     AUTH
  ========================================================== */

  if (!isSignedIn) {
    return (
      <ErrorScreen
        title="Sign in required"
        message="Please sign in to view your order confirmation."
      />
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error ||
    !order
  ) {
    return (
      <ErrorScreen
        title="Order confirmation unavailable"
        message={
          error ||
          "We could not load this order."
        }
      />
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5] text-[#0A1B2E]">

      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-[92px] sm:px-6 sm:pb-20 sm:pt-[106px] lg:px-8">

        {/* ==================================================
            SUCCESS HERO
        ================================================== */}

        <section className="mx-auto max-w-2xl text-center">

          <SuccessMark />

          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="h-[2px] w-6 bg-[#B9954F]" />

            <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#B9954F]">
              New Print
            </span>

            <span className="h-[2px] w-6 bg-[#B9954F]" />
          </div>

          <h1 className="mt-3 text-[27px] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#0A1B2E] sm:text-4xl">
            Order placed successfully
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-[12px] leading-5 text-[#64748B] sm:text-sm sm:leading-6">
            Thank you for choosing New Print.
            Your payment has been confirmed
            and we have received your order.
          </p>

          {/* ORDER NUMBER */}

          <div className="mx-auto mt-6 inline-flex max-w-[calc(100vw-32px)] flex-col items-center rounded-[10px] border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-[0_5px_18px_rgba(10,27,46,0.035)] sm:px-7">

            <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#94A3B8]">
              Order Number
            </span>

            <span className="mt-1 break-all text-sm font-extrabold tracking-[0.035em] text-[#0A1B2E] sm:text-base">
              {displayOrderNumber}
            </span>

          </div>
        </section>

        {/* ==================================================
            QUICK STATUS
        ================================================== */}

        <section className="mx-auto mt-7 max-w-5xl">

          <div className="grid grid-cols-2 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white sm:grid-cols-4">

            {/* TOTAL */}

            <div className="border-b border-r border-[#EEF0F2] px-3 py-4 text-center sm:border-b-0 sm:px-4">

              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                Total
              </p>

              <p className="mt-1 text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                {formatPrice(
                  order.totalAmount
                )}
              </p>

            </div>

            {/* ITEMS */}

            <div className="border-b border-[#EEF0F2] px-3 py-4 text-center sm:border-b-0 sm:border-r sm:px-4">

              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                Items
              </p>

              <p className="mt-1 text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                {itemCount}
              </p>

            </div>

            {/* PAYMENT */}

            <div className="border-r border-[#EEF0F2] px-3 py-4 text-center sm:px-4">

              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                Payment
              </p>

              <div className="mt-1 flex justify-center">
                <PaymentStatus
                  status={
                    order.paymentStatus
                  }
                />
              </div>

            </div>

            {/* STATUS */}

            <div className="px-3 py-4 text-center sm:px-4">

              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                Status
              </p>

              <div className="mt-1 flex justify-center">
                <StatusPill
                  status={
                    order.status
                  }
                />
              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <div className="mx-auto mt-5 grid max-w-5xl grid-cols-1 items-start gap-5 lg:grid-cols-12">

          {/* ==================================================
              LEFT
          ================================================== */}

          <div className="min-w-0 space-y-5 lg:col-span-8">

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

              {/* HEADER */}

              <div className="flex items-center justify-between gap-3 border-b border-[#EEF0F2] px-4 py-4 sm:px-5">

                <div className="flex min-w-0 items-center gap-2.5">

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F2E8] text-[#B9954F]">
                    <PackageIcon size={17} />
                  </span>

                  <div className="min-w-0">

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                      Order
                    </p>

                    <h2 className="text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                      Your Products
                    </h2>

                  </div>

                </div>

                <span className="shrink-0 text-[10px] font-bold text-[#64748B]">
                  {itemCount}{" "}
                  {itemCount === 1
                    ? "item"
                    : "items"}
                </span>

              </div>

              {/* ITEMS */}

              <div className="divide-y divide-[#EEF0F2]">

                {order.items.map(
                  (
                    item,
                    itemIndex
                  ) => {

                    const productImage =
                      item.image || "";

                    const selections =
                      Object.entries(
                        item.selections ||
                          {}
                      );

                    const printUnits =
                      Array.isArray(
                        item.printUnits
                      )
                        ? item.printUnits
                        : [];

                    const itemTotal =
                      Number(
                        item.price || 0
                      ) *
                      Number(
                        item.quantity || 0
                      );

                    return (
                      <article
                        key={
                          item._id ||
                          `${item.itemKey}-${itemIndex}`
                        }
                        className="p-4 sm:p-5"
                      >

                        <div className="flex min-w-0 gap-3.5 sm:gap-4">

                          {/* PRODUCT IMAGE */}

                          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[9px] border border-[#E5E7EB] bg-[#F7F7F5] sm:h-[88px] sm:w-[88px]">

                            {productImage ? (
                              <img
                                src={
                                  productImage
                                }
                                alt={
                                  item.name
                                }
                                width={88}
                                height={88}
                                className="h-full w-full object-cover"
                                loading={
                                  itemIndex ===
                                  0
                                    ? "eager"
                                    : "lazy"
                                }
                                decoding="async"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#B9954F]">
                                <PackageIcon size={24} />
                              </div>
                            )}

                          </div>

                          {/* DETAILS */}

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <h3 className="break-words text-[12px] font-extrabold leading-5 text-[#0A1B2E] sm:text-sm">
                                  {item.name}
                                </h3>

                                <p className="mt-1 text-[10px] font-semibold text-[#64748B] sm:text-xs">
                                  Qty{" "}
                                  {item.quantity}
                                </p>

                              </div>

                              <p className="shrink-0 text-xs font-extrabold text-[#0A1B2E] sm:text-sm">
                                {formatPrice(
                                  itemTotal
                                )}
                              </p>

                            </div>

                            {/* VARIANTS */}

                            {selections.length >
                              0 && (
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">

                                {selections.map(
                                  ([
                                    key,
                                    value,
                                  ]) => (
                                    <span
                                      key={
                                        key
                                      }
                                      className="max-w-full break-words text-[9px] text-[#64748B] sm:text-[10px]"
                                    >
                                      <span className="font-extrabold text-[#94A3B8]">
                                        {
                                          key
                                        }
                                        :
                                      </span>{" "}
                                      {
                                        value
                                      }
                                    </span>
                                  )
                                )}

                              </div>
                            )}

                            {/* PRINT UNITS */}

                            <div className="mt-3">

                              <div className="flex items-center justify-between gap-3">

                                <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#94A3B8]">
                                  Print images
                                </p>

                                <p className="shrink-0 text-[9px] font-bold text-green-700">
                                  {
                                    printUnits.length
                                  }{" "}
                                  units
                                </p>

                              </div>

                              <div className="mt-1.5 flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                                {printUnits.length >
                                0 ? (
                                  printUnits.map(
                                    (
                                      unit,
                                      unitIndex
                                    ) => (
                                      <div
                                        key={
                                          unit.unitId ||
                                          unitIndex
                                        }
                                        className="flex shrink-0 items-center gap-1 rounded-[6px] border border-[#E5E7EB] bg-[#FAFAF8] px-2 py-1"
                                      >
                                        <span className="text-[8px] font-extrabold text-[#64748B]">
                                          P
                                          {unitIndex +
                                            1}
                                        </span>

                                        <span className="text-[8px] font-bold text-green-700">
                                          {
                                            unit
                                              .images
                                              .length
                                          }{" "}
                                          photo
                                          {unit
                                            .images
                                            .length ===
                                          1
                                            ? ""
                                            : "s"}
                                        </span>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <span className="text-[9px] text-[#94A3B8]">
                                    No print images
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            </section>

            {/* =================================================
                SHIPPING ADDRESS
            ================================================= */}

            <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

              <div className="border-b border-[#EEF0F2] px-4 py-4 sm:px-5">

                <div className="flex items-center gap-2.5">

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F2E8] text-[#B9954F]">
                    <MapPinIcon size={17} />
                  </span>

                  <div>

                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                      Delivery
                    </p>

                    <h2 className="text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                      Shipping Address
                    </h2>

                  </div>

                </div>

              </div>

              <div className="p-4 sm:p-5">

                <div className="rounded-[9px] border border-[#E5E7EB] bg-[#FAFAF8] p-3.5 sm:p-4">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="break-words text-xs font-extrabold text-[#0A1B2E] sm:text-sm">
                        {
                          order
                            .shippingAddress
                            .fullName
                        }
                      </p>

                      <p className="mt-1 break-all text-[10px] font-semibold text-[#64748B] sm:text-xs">
                        {
                          order
                            .shippingAddress
                            .phone
                        }
                      </p>

                    </div>

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#B9954F]">
                      <MapPinIcon size={14} />
                    </span>

                  </div>

                  <p className="mt-3 break-words text-[10px] leading-5 text-[#475569] sm:text-xs">

                    {
                      order
                        .shippingAddress
                        .addressLine1
                    }

                    {order.shippingAddress.addressLine2 && (
                      <>
                        <br />
                        {
                          order
                            .shippingAddress
                            .addressLine2
                        }
                      </>
                    )}

                    <br />

                    {
                      order
                        .shippingAddress
                        .city
                    }
                    ,{" "}
                    {
                      order
                        .shippingAddress
                        .state
                    }{" "}
                    -{" "}
                    {
                      order
                        .shippingAddress
                        .pincode
                    }

                    {order.shippingAddress.landmark && (
                      <>
                        <br />
                        Landmark:{" "}
                        {
                          order
                            .shippingAddress
                            .landmark
                        }
                      </>
                    )}

                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                NEXT STEP
            ================================================= */}

            <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 sm:p-5">

              <div className="flex items-start gap-3">

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F2E8] text-[#B9954F]">
                  <ClockIcon size={17} />
                </span>

                <div className="min-w-0">

                  <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F]">
                    What happens next
                  </p>

                  <h2 className="mt-1 text-sm font-extrabold leading-5 text-[#0A1B2E] sm:text-base">
                    We will start processing your order
                  </h2>

                  <p className="mt-2 text-[10px] leading-5 text-[#64748B] sm:text-xs">
                    Your payment is confirmed and
                    your order has been received.
                    You can track the order from
                    your orders section.
                  </p>

                </div>

              </div>

            </section>

          </div>

          {/* ==================================================
              RIGHT
          ================================================== */}

          <aside className="min-w-0 lg:col-span-4">

            <div className="lg:sticky lg:top-[100px]">

              {/* SUMMARY */}

              <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

                <div className="border-b border-[#EEF0F2] px-4 py-4 sm:px-5">

                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#B9954F]">
                    Payment
                  </p>

                  <h2 className="mt-1 text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                    Order Summary
                  </h2>

                </div>

                <div className="p-4 sm:p-5">

                  <div className="space-y-3">

                    <div className="flex items-center justify-between gap-4 text-xs">

                      <span className="text-[#64748B]">
                        Products
                      </span>

                      <span className="font-bold text-[#0A1B2E]">
                        {formatPrice(
                          order.subtotal
                        )}
                      </span>

                    </div>

                    <div className="flex items-center justify-between gap-4 text-xs">

                      <span className="text-[#64748B]">
                        Delivery
                      </span>

                      <span
                        className={
                          Number(
                            order.deliveryFee
                          ) === 0
                            ? "font-bold text-green-700"
                            : "font-bold text-[#0A1B2E]"
                        }
                      >
                        {Number(
                          order.deliveryFee
                        ) === 0
                          ? "FREE"
                          : formatPrice(
                              order.deliveryFee
                            )}
                      </span>

                    </div>

                  </div>

                  <div className="mt-5 border-t border-[#E5E7EB] pt-4">

                    <div className="flex items-end justify-between gap-4">

                      <span className="text-sm font-extrabold text-[#0A1B2E]">
                        Total paid
                      </span>

                      <span className="text-[23px] font-extrabold tracking-[-0.035em] text-[#0A1B2E] sm:text-[25px]">
                        {formatPrice(
                          order.totalAmount
                        )}
                      </span>

                    </div>

                  </div>

                  {/* PAYMENT CONFIRMATION */}

                  <div className="mt-5 rounded-[9px] border border-green-200 bg-green-50 p-3">

                    <div className="flex items-start gap-2.5">

                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <CheckIcon size={14} />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] font-extrabold text-green-700 sm:text-xs">
                          Payment confirmed
                        </p>

                        <p className="mt-0.5 break-words text-[9px] leading-4 text-green-600 sm:text-[10px]">
                          {formatDate(
                            paymentDate
                          )}

                          {paymentTime
                            ? ` • ${paymentTime}`
                            : ""}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* SECURITY */}

                  <div className="mt-4 flex items-center gap-2 text-[9px] font-semibold text-[#94A3B8]">

                    <ShieldIcon size={15} />

                    <span>
                      Your payment was securely
                      verified.
                    </span>

                  </div>

                </div>

              </section>

              {/* ACTIONS */}

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">

                <Link
                  href="/dashboard/orders"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#0A1B2E] px-5 text-xs font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#142C46] active:scale-[0.99]"
                >
                  View My Orders
                  <ArrowRightIcon size={15} />
                </Link>

                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#DDE2E7] bg-white px-5 text-xs font-extrabold text-[#0A1B2E] transition-[border-color,background-color,transform] duration-200 hover:border-[#B9954F] hover:bg-[#FBFAF6] active:scale-[0.99]"
                >
                  <ArrowLeftIcon size={15} />
                  Continue Shopping
                </Link>

              </div>

              {/* ORDER INFORMATION */}

              <div className="mt-4 rounded-[10px] border border-[#E5E7EB] bg-white p-4">

                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#94A3B8]">
                  Order information
                </p>

                <div className="mt-3 space-y-2.5">

                  <div className="flex items-start justify-between gap-3">

                    <span className="text-[10px] text-[#64748B]">
                      Order placed
                    </span>

                    <span className="text-right text-[10px] font-bold text-[#0A1B2E]">
                      {formatDate(
                        order.createdAt
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <span className="text-[10px] text-[#64748B]">
                      Print units
                    </span>

                    <span className="text-[10px] font-bold text-[#0A1B2E]">
                      {totalPrintUnits}
                    </span>

                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <span className="text-[10px] text-[#64748B]">
                      Payment
                    </span>

                    <span className="text-[10px] font-bold text-[#0A1B2E]">
                      {order.paymentStatus}
                    </span>

                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <span className="text-[10px] text-[#64748B]">
                      Status
                    </span>

                    <span className="max-w-[55%] text-right text-[10px] font-bold text-[#0A1B2E]">
                      {order.status}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </aside>

        </div>

        {/* ====================================================
            TRUST FOOTER
        ==================================================== */}

        <div className="mx-auto mt-7 flex max-w-5xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">

          <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#94A3B8]">
            <ShieldIcon size={14} />
            Secure payment
          </div>

          <span className="hidden h-1 w-1 rounded-full bg-[#CBD5E1] sm:block" />

          <span className="text-[9px] font-semibold text-[#94A3B8]">
            Order safely received by New Print
          </span>

        </div>

      </main>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessSkeleton />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}