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
  status: string;
  items?: unknown[];
}

async function fetchOrders(
  token: string | null
): Promise<Order[]> {
  try {
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
    console.error(
      "Fetch orders error:",
      error
    );

    return [];
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "Delivered":
      return "border-green-100 bg-green-50 text-green-700";

    case "Shipped":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "Processing":
      return "border-[#B9954F]/20 bg-[#B9954F]/10 text-[#9A7839]";

    case "Cancelled":
      return "border-red-100 bg-red-50 text-red-600";

    default:
      return "border-slate-100 bg-slate-50 text-slate-600";
  }
}

export default async function OrdersPage() {
  const { getToken } = await auth();

  const token = await getToken();

  const orders = await fetchOrders(token);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
            My Orders
          </h2>

          <p className="mt-1 text-sm text-[#64748B]">
            View and track your orders.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-sm font-semibold text-[#0A1B2E] transition-all hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98] sm:px-4"
        >
          <span className="hidden sm:inline">
            ← Home
          </span>

          <span className="sm:hidden">
            Home
          </span>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-8 text-center shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
            #
          </div>

          <h3 className="mt-4 font-bold text-[#0A1B2E]">
            No orders yet
          </h3>

          <p className="mt-1 text-sm text-[#64748B]">
            Your completed purchases will
            appear here.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#0A1B2E] px-6 text-sm font-semibold text-white transition-all hover:bg-[#142C46] active:scale-[0.98]"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article
              key={order._id}
              className="min-w-0 rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-5"
            >
              <div className="flex flex-col gap-4">
                {/* Top */}

                <div className="flex items-start justify-between gap-3">
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
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Bottom */}

                <div className="flex items-center justify-between gap-4 border-t border-[#E5E7EB] pt-4">
                  <div>
                    <p className="text-xs text-[#64748B]">
                      {order.items?.length ?? 0}{" "}
                      items
                    </p>

                    <p className="mt-0.5 text-base font-extrabold text-[#0A1B2E]">
                      ₹{order.totalAmount}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/orders/${order._id}`}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-semibold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2"
                  >
                    View Order
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}