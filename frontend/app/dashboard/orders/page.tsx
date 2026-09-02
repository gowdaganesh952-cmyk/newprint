import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status?: string;
  paymentStatus?: string;
  items?: unknown[];
}

async function fetchOrders(
  token: string | null
): Promise<Order[]> {
  try {
    if (!token) {
      return [];
    }

    const res = await fetch(
      `${API_URL}/api/orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return [];
    }

    const data = await res.json();

    return Array.isArray(data.orders)
      ? data.orders
      : [];
  } catch (error) {
    console.error("Fetch orders error:", error);
    return [];
  }
}

function isConfirmedOrder(order: Order): boolean {
  return (
    String(order.paymentStatus || "").toLowerCase() ===
    "paid"
  );
}

function getPaymentStatusClass(
  paymentStatus?: string
) {
  const status = String(
    paymentStatus || ""
  ).toLowerCase();

  if (status === "paid") {
    return "border-green-100 bg-green-50 text-green-700";
  }

  if (
    status === "failed" ||
    status === "cancelled"
  ) {
    return "border-red-100 bg-red-50 text-red-600";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

export default async function OrdersPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const allOrders = await fetchOrders(token);
  const orders = allOrders.filter(isConfirmedOrder);

  return (
    <div className="min-w-0 w-full space-y-5 sm:space-y-6 scroll-smooth">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-2xl">
            My Orders
          </h2>
          <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
            View your confirmed orders.
          </p>
        </div>

        <Link
          href="/"
          className="
            inline-flex min-h-[42px] shrink-0 items-center justify-center
            rounded-[10px] border border-[#E5E7EB] bg-white
            px-3.5 text-sm font-semibold text-[#0A1B2E]
            shadow-sm transition-all duration-200
            hover:border-[#B9954F]
            hover:text-[#B9954F]
            active:scale-[0.97]
            touch-manipulation will-change-transform
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#B9954F]
            focus-visible:ring-offset-2
            sm:min-h-[44px] sm:px-4
          "
        >
          <span className="hidden sm:inline">←&nbsp; Home</span>
          <span className="sm:hidden">Home</span>
        </Link>
      </div>

      {orders.length === 0 ? (
        <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-7 text-center shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5]">
            <svg
              className="h-6 w-6 text-[#64748B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h13m-11 0a2 2 0 104 0m4 0a2 2 0 104 0"
              />
            </svg>
          </div>

          <h3 className="mt-4 font-bold text-[#0A1B2E]">
            No confirmed orders yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#64748B]">
            Orders will appear here after your payment
            has been successfully completed.
          </p>

          <Link
            href="/"
            className="
              mt-6 inline-flex min-h-[44px]
              items-center justify-center
              rounded-[10px]
              bg-[#0A1B2E]
              px-6
              text-sm font-semibold text-white
              transition-all duration-200
              hover:bg-[#142C46]
              active:scale-[0.97]
              touch-manipulation will-change-transform
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#B9954F]
              focus-visible:ring-offset-2
            "
          >
            Browse Products
          </Link>
        </section>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount =
              order.items?.length ?? 0;

            return (
              <article
                key={order._id}
                className="
                  min-w-0 w-full
                  rounded-[14px]
                  border border-[#E5E7EB]
                  bg-white
                  p-4
                  shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]
                  transition-shadow duration-200
                  sm:p-5
                "
              >
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0A1B2E] sm:text-base">
                        Order #{order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                        {new Date(
                          order.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full border px-2.5 py-1",
                        "text-[11px] font-semibold sm:text-xs",
                        getPaymentStatusClass(
                          order.paymentStatus
                        ),
                      ].join(" ")}
                    >
                      Payment Confirmed
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-[#64748B]">
                        {itemCount}{" "}
                        {itemCount === 1
                          ? "item"
                          : "items"}
                      </p>
                      <p className="mt-0.5 text-base font-extrabold text-[#0A1B2E] sm:text-lg">
                        ₹{order.totalAmount}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/orders/${order._id}`}
                      className="
                        inline-flex min-h-[44px] w-full
                        shrink-0 items-center justify-center
                        rounded-[10px]
                        bg-[#0A1B2E]
                        px-5
                        text-sm font-semibold text-white whitespace-nowrap
                        transition-all duration-200
                        hover:bg-[#142C46]
                        active:scale-[0.97]
                        touch-manipulation will-change-transform
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[#B9954F]
                        focus-visible:ring-offset-2
                        sm:w-auto
                      "
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}