import { auth, currentUser } from "@clerk/nextjs/server";
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

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

interface DashboardData {
  stats: Stats;
  recentOrders: Order[];
}

async function getDashboardData(
  token: string | null
): Promise<DashboardData> {
  const defaultStats: Stats = {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  };

  try {
    const [statsRes, ordersRes] =
      await Promise.all([
        fetch(
          `${API_URL}/api/orders/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        ),

        fetch(
          `${API_URL}/api/orders?limit=3`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        ),
      ]);

    const statsData = statsRes.ok
      ? await statsRes.json()
      : { stats: defaultStats };

    const ordersData = ordersRes.ok
      ? await ordersRes.json()
      : { orders: [] };

    return {
      stats: {
        totalOrders:
          statsData.stats?.totalOrders ?? 0,

        pendingOrders:
          statsData.stats?.pendingOrders ?? 0,

        completedOrders:
          statsData.stats?.completedOrders ?? 0,
      },

      recentOrders:
        Array.isArray(ordersData.orders)
          ? ordersData.orders
          : [],
    };
  } catch (error) {
    console.error(
      "Dashboard data error:",
      error
    );

    return {
      stats: defaultStats,
      recentOrders: [],
    };
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

export default async function DashboardPage() {
  const { getToken } = await auth();

  const token = await getToken();

  const user = await currentUser();

  const firstName =
    user?.firstName || "there";

  const {
    stats,
    recentOrders,
  } = await getDashboardData(token);

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {/* Welcome */}

      <section className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#B9954F]">
              My Account
            </p>

            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
              Welcome back, {firstName}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748B]">
              Manage your orders, profile,
              and saved delivery addresses.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0A1B2E] transition-all duration-150 hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
          >
            ← Back to Home
          </Link>
        </div>
      </section>

      {/* Statistics */}

      <section>
        <h3 className="mb-3 text-base font-bold text-[#0A1B2E] sm:text-lg">
          Account Overview
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
            <p className="text-sm font-medium text-[#64748B]">
              Total Orders
            </p>

            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#0A1B2E]">
              {stats.totalOrders}
            </p>
          </div>

          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
            <p className="text-sm font-medium text-[#64748B]">
              Pending Orders
            </p>

            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#0A1B2E]">
              {stats.pendingOrders}
            </p>
          </div>

          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
            <p className="text-sm font-medium text-[#64748B]">
              Completed
            </p>

            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#0A1B2E]">
              {stats.completedOrders}
            </p>
          </div>
        </div>
      </section>

      {/* Recent Orders */}

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-base font-bold text-[#0A1B2E] sm:text-lg">
            Recent Orders
          </h3>

          <Link
            href="/dashboard/orders"
            className="shrink-0 text-sm font-semibold text-[#B9954F] hover:text-[#9A7839] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
          >
            View All →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-8 text-center shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-12">
            <p className="text-sm text-[#64748B]">
              You haven't placed any
              orders yet.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#0A1B2E] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#142C46] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order._id}
                className="min-w-0 rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                      {" • "}

                      {order.items?.length ?? 0}{" "}
                      items
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-[#0A1B2E]">
                        ₹{order.totalAmount}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/orders/${order._id}`}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] px-3.5 text-xs font-semibold text-[#0A1B2E] transition-all duration-150 hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98] sm:px-4 sm:text-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Account */}

      <section>
        <h3 className="mb-3 text-base font-bold text-[#0A1B2E] sm:text-lg">
          Account
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/profile"
            className="group rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] transition-all duration-150 hover:border-[#B9954F]/50 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-[#0A1B2E]">
                  Profile
                </h4>

                <p className="mt-1 text-sm leading-5 text-[#64748B]">
                  Manage your personal
                  information
                </p>
              </div>

              <span className="text-lg text-[#B9954F] transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard/addresses"
            className="group rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] transition-all duration-150 hover:border-[#B9954F]/50 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-[#0A1B2E]">
                  Addresses
                </h4>

                <p className="mt-1 text-sm leading-5 text-[#64748B]">
                  Manage your delivery
                  addresses
                </p>
              </div>

              <span className="text-lg text-[#B9954F] transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}