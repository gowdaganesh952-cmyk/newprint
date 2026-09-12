"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

/* ============================================================
   TYPES
============================================================ */

interface OrderItem {
  name?: string;
  image?: string;
  quantity?: number;
  price?: number;
  selections?: Record<string, unknown>;
}

interface ShippingAddress {
  addressId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status?: string;
  paymentStatus?: string;
  subtotal?: number;
  deliveryFee?: number;
  totalAmount: number;
  currency?: string;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
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

function formatCurrency(
  amount: number,
  currency = "INR"
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(order: Order) {
  if (order.status === "Not Completed") {
    if (order.paymentStatus === "Failed") {
      return "Payment Failed";
    }

    if (order.paymentStatus === "Cancelled") {
      return "Payment Cancelled";
    }

    return "Not Completed";
  }

  if (order.status === "Confirmed") {
    return "Confirmed";
  }

  return order.status || "Processing";
}

function getStatusClass(order: Order) {
  if (order.status === "Not Completed") {
    if (
      order.paymentStatus === "Failed" ||
      order.paymentStatus === "Cancelled"
    ) {
      return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (order.status === "Delivered") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (order.status === "Cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getItemCount(order: Order) {
  return (order.items || []).reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );
}

/* ============================================================
   RAZORPAY LOADER
============================================================ */

let razorpayPromise: Promise<boolean> | null = null;

function loadRazorpay(): Promise<boolean> {
  if (
    typeof window !== "undefined" &&
    window.Razorpay
  ) {
    return Promise.resolve(true);
  }

  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true }
      );

      existingScript.addEventListener(
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

function ShoppingBagIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function TrashIcon() {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function ArrowRightIcon() {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function OrdersPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isSignedIn) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();

      if (!token) {
        setOrders([]);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load your orders."
        );
      }

      setOrders(
        Array.isArray(data?.orders)
          ? data.orders
          : []
      );
    } catch (fetchError) {
      console.error("Fetch orders error:", fetchError);

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load your orders."
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded) {
      void fetchOrders();
    }
  }, [fetchOrders, isLoaded]);

  const incompleteOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === "Not Completed" &&
          order.paymentStatus !== "Paid"
      ),
    [orders]
  );

  const completedOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !(
            order.status === "Not Completed" &&
            order.paymentStatus !== "Paid"
          )
      ),
    [orders]
  );

  const handleDeleteOrder = useCallback(
    async (order: Order) => {
      const confirmed = window.confirm(
        `Delete order #${order.orderNumber}?\n\nThis incomplete order will be permanently removed.`
      );

      if (!confirmed) return;

      setLoadingAction(`delete-${order._id}`);
      setError(null);
      setSuccess(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token unavailable.");
        }

        const response = await fetch(
          `${API_URL}/api/orders/${order._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to delete this order."
          );
        }

        setOrders((previous) =>
          previous.filter(
            (item) => item._id !== order._id
          )
        );

        setSuccess(
          `Order #${order.orderNumber} deleted successfully.`
        );
      } catch (deleteError) {
        console.error("Delete order error:", deleteError);

        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete this order."
        );
      } finally {
        setLoadingAction(null);
      }
    },
    [getToken]
  );

  const handleCompletePayment = useCallback(
    async (order: Order) => {
      if (loadingAction) return;

      setLoadingAction(`pay-${order._id}`);
      setError(null);
      setSuccess(null);

      try {
        const addressId =
          order.shippingAddress?.addressId;

        if (!addressId) {
          throw new Error(
            "This order has no saved address. Please contact support to complete payment."
          );
        }

        const loaded = await loadRazorpay();

        if (!loaded || !window.Razorpay) {
          throw new Error(
            "Unable to load payment gateway. Please try again."
          );
        }

        const token = await getToken();

        if (!token) {
          throw new Error(
            "Authentication token unavailable."
          );
        }

        const createPaymentResponse = await fetch(
          `${API_URL}/api/orders/create-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              addressId,
              orderId: order._id,
            }),
          }
        );

        const paymentData =
          await createPaymentResponse
            .json()
            .catch(() => null);

        if (
          !createPaymentResponse.ok ||
          !paymentData?.success
        ) {
          throw new Error(
            paymentData?.message ||
              "Unable to restart payment."
          );
        }

        const payment = paymentData.razorpay;

        if (
          !payment?.keyId ||
          !payment?.orderId ||
          !payment?.amount
        ) {
          throw new Error(
            "Invalid payment information received."
          );
        }

        const razorpayOptions: RazorpayOptions = {
          key: payment.keyId,
          amount: payment.amount,
          currency: payment.currency || "INR",
          name: "New Print",
          description: `Complete Order ${order.orderNumber}`,
          order_id: payment.orderId,
          prefill: {
            name:
              order.shippingAddress?.fullName ||
              "",
            contact:
              order.shippingAddress?.phone ||
              "",
            email:
              order.shippingAddress?.email ||
              "",
          },
          notes: {
            orderNumber: order.orderNumber,
          },
          theme: {
            color: "#0A1B2E",
          },
          modal: {
            ondismiss: () => {
              setLoadingAction(null);
              setError(
                "Payment window closed. Your order is still incomplete."
              );
            },
          },
          handler: async (
            razorpayResponse
          ) => {
            try {
              const verifyResponse = await fetch(
                `${API_URL}/api/orders/verify-payment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(
                    razorpayResponse
                  ),
                }
              );

              const verifyData =
                await verifyResponse
                  .json()
                  .catch(() => null);

              if (
                !verifyResponse.ok ||
                !verifyData?.success
              ) {
                throw new Error(
                  verifyData?.message ||
                    "Payment verification failed."
                );
              }

              const newOrderId =
                verifyData?.order?.id ||
                order._id;

              router.replace(
                `/checkout/success?orderId=${encodeURIComponent(
                  newOrderId
                )}&orderNumber=${encodeURIComponent(
                  order.orderNumber
                )}`
              );
            } catch (verifyError) {
              console.error(
                "Payment verification error:",
                verifyError
              );

              setError(
                verifyError instanceof Error
                  ? verifyError.message
                  : "Payment verification failed."
              );

              setLoadingAction(null);
            }
          },
        };

        const razorpay =
          new window.Razorpay(
            razorpayOptions
          );

        razorpay.open();
      } catch (paymentError) {
        console.error(
          "Complete payment error:",
          paymentError
        );

        setError(
          paymentError instanceof Error
            ? paymentError.message
            : "Unable to start payment."
        );

        setLoadingAction(null);
      }
    },
    [getToken, loadingAction, router]
  );

  if (!isLoaded || isLoading) {
    return (
      <div className="min-w-0 space-y-4 pb-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="h-4 w-64 animate-pulse rounded bg-[#E5E7EB]" />

        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-44 animate-pulse rounded-[14px] border border-[#E5E7EB] bg-white"
          />
        ))}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-7 text-center sm:p-12">
        <h1 className="text-xl font-extrabold text-[#0A1B2E]">
          Sign in to view your orders
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
          Sign in to view completed orders and continue
          any incomplete payments.
        </p>

        <Link
          href="/sign-in?redirect_url=/dashboard/orders"
          className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-[10px] bg-[#0A1B2E] px-6 text-sm font-bold text-white transition-colors hover:bg-[#142C46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
        >
          Sign In
        </Link>
      </section>
    );
  }

  return (
    <div className="min-w-0 w-full space-y-6 pb-8 sm:space-y-8">
      {/* HEADER */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#B9954F]">
            Account
          </p>

          <h1 className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
            My Orders
          </h1>

          <p className="mt-1 text-sm text-[#64748B]">
            Track your orders and complete pending payments.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#0A1B2E] shadow-sm transition-colors hover:border-[#B9954F] hover:text-[#B9954F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
        >
          ← Home
        </Link>
      </header>

      {/* ALERTS */}
      {error && (
        <div
          role="alert"
          className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium leading-6 text-green-700"
        >
          {success}
        </div>
      )}

      {/* INCOMPLETE ORDERS */}
      {incompleteOrders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B9954F]/15 text-[#9A7839]">
              <ClockIcon />
            </span>

            <div>
              <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                Incomplete Orders
              </h2>

              <p className="text-xs text-[#64748B] sm:text-sm">
                Complete payment if you still want these orders.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {incompleteOrders.map((order) => {
              const isPaying =
                loadingAction === `pay-${order._id}`;

              const isDeleting =
                loadingAction === `delete-${order._id}`;

              return (
                <article
                  key={order._id}
                  className="min-w-0 overflow-hidden rounded-[14px] border border-[#E8D6AA] bg-white shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]"
                >
                  <div className="border-b border-[#E8D6AA] bg-[#FFF9ED] px-4 py-3 sm:px-5">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                          Order #{order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-[#8A7650]">
                          Created on {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-bold ${getStatusClass(
                          order
                        )}`}
                      >
                        {getStatusLabel(order)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="min-w-0 rounded-[10px] bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Items
                        </p>

                        <p className="mt-1 text-base font-extrabold text-[#0A1B2E]">
                          {getItemCount(order)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-[10px] bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Total
                        </p>

                        <p className="mt-1 break-words text-base font-extrabold text-[#0A1B2E]">
                          {formatCurrency(
                            order.totalAmount,
                            order.currency || "INR"
                          )}
                        </p>
                      </div>

                      <div className="col-span-2 min-w-0 rounded-[10px] bg-[#F8FAFC] p-3 sm:col-span-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Payment
                        </p>

                        <p className="mt-1 text-sm font-extrabold text-[#9A7839]">
                          {order.paymentStatus || "Pending"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[10px] border border-[#E5E7EB] bg-[#FAFAF9] p-3">
                      <p className="text-xs font-bold text-[#0A1B2E]">
                        What do you want to do?
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#64748B]">
                        Continue payment to confirm this order,
                        or delete it if you no longer want it.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() =>
                          void handleCompletePayment(order)
                        }
                        disabled={
                          Boolean(loadingAction)
                        }
                        className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-extrabold text-white transition-colors hover:bg-[#142C46] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] sm:col-span-2"
                      >
                        {isPaying ? (
                          <>
                            <Spinner />
                            Opening Payment...
                          </>
                        ) : (
                          <>
                            <CheckIcon />
                            Complete Payment
                            <ArrowRightIcon />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteOrder(order)
                        }
                        disabled={
                          Boolean(loadingAction)
                        }
                        className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        {isDeleting ? (
                          <>
                            <Spinner />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <TrashIcon />
                            Delete Order
                          </>
                        )}
                      </button>
                    </div>

                    <Link
                      href={`/dashboard/orders/${order._id}`}
                      className="inline-flex min-h-[42px] w-full items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#0A1B2E] transition-colors hover:bg-[#F7F7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
                    >
                      View Order Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* COMPLETED ORDERS */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A1B2E] text-white">
            <ShoppingBagIcon />
          </span>

          <div>
            <h2 className="text-base font-extrabold text-[#0A1B2E] sm:text-lg">
              {incompleteOrders.length > 0
                ? "My Orders"
                : "Order History"}
            </h2>

            <p className="text-xs text-[#64748B] sm:text-sm">
              Your confirmed and previous orders.
            </p>
          </div>
        </div>

        {completedOrders.length === 0 ? (
          <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-7 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
              <ShoppingBagIcon />
            </div>

            <h3 className="mt-4 font-extrabold text-[#0A1B2E]">
              No completed orders yet
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
              Once you complete a payment, your confirmed
              order will appear here.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-[10px] bg-[#0A1B2E] px-6 text-sm font-bold text-white transition-colors hover:bg-[#142C46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
            >
              Browse Products
            </Link>
          </section>
        ) : (
          <div className="space-y-3">
            {completedOrders.map((order) => (
              <article
                key={order._id}
                className="min-w-0 rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                        Order #{order.orderNumber}
                      </p>

                      <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-bold ${getStatusClass(
                        order
                      )}`}
                    >
                      {getStatusLabel(order)}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-[#64748B]">
                        {getItemCount(order)}{" "}
                        {getItemCount(order) === 1
                          ? "item"
                          : "items"}
                      </p>

                      <p className="mt-1 break-words text-lg font-extrabold text-[#0A1B2E]">
                        {formatCurrency(
                          order.totalAmount,
                          order.currency || "INR"
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/orders/${order._id}`}
                      className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-bold text-white transition-colors hover:bg-[#142C46] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] sm:w-auto"
                    >
                      View Order
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}