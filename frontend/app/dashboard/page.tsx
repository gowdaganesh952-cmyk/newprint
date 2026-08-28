import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderItem { quantity?: number; }
interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items?: OrderItem[];
}
interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

async function getDashboardData(token: string | null): Promise<{ stats: DashboardStats; recentOrders: Order[]; }> {
  const fallback = {
    stats: { totalOrders: 0, pendingOrders: 0, completedOrders: 0 },
    recentOrders: [],
  };
  if (!token) return fallback;
  try {
    const [statsRes, ordersRes] = await Promise.all([
      fetch(`${API_URL}/api/orders/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      fetch(`${API_URL}/api/orders?limit=5`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
    ]);
    const statsData = statsRes.ok ? await statsRes.json() : { stats: fallback.stats };
    const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
    return {
      stats: {
        totalOrders: Number(statsData.stats?.totalOrders ?? 0),
        pendingOrders: Number(statsData.stats?.pendingOrders ?? 0),
        completedOrders: Number(statsData.stats?.completedOrders ?? 0),
      },
      recentOrders: Array.isArray(ordersData.orders) ? ordersData.orders : [],
    };
  } catch {
    return fallback;
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Confirmed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Shipped": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Delivered": return "bg-green-50 text-green-700 border-green-200";
    case "Cancelled": return "bg-red-50 text-red-700 border-red-200";
    case "Not Completed":
    default: return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const user = await currentUser();
  const firstName = user?.firstName || "there";
  const { stats, recentOrders } = await getDashboardData(token);
  const incompleteOrders = recentOrders.filter(order => order.status === "Not Completed" && order.paymentStatus !== "Paid");

  return (
    <div className="space-y-6 sm:space-y-8 scroll-smooth">
      {/* Welcome */}
      <section className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm">
        <div className="p-5 sm:p-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#B9954F]">
            My Account
          </p>
          <h2 className="text-xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-2xl">
            Welcome back, {firstName}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748B]">
            Manage your orders, profile, and saved delivery addresses from one place.
          </p>
        </div>
      </section>

      {/* Incomplete payment notice */}
      {incompleteOrders.length > 0 && (
        <section className="rounded-[14px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
              !
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-amber-900">Payment not completed</h3>
              <p className="mt-1 text-sm leading-5 text-amber-800">
                You have {incompleteOrders.length} order{incompleteOrders.length > 1 ? "s" : ""} that{incompleteOrders.length > 1 ? " have" : " has"} not been confirmed because payment was not completed.
              </p>
              <Link
                href="/dashboard/orders"
                className="mt-3 inline-flex rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] touch-manipulation will-change-transform"
              >
                View Orders
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Statistics */}
      <section>
        <h3 className="mb-3 text-base font-bold text-[#0A1B2E]">Order Overview</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">Total Orders</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">{stats.totalOrders}</p>
          </div>
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">Active Orders</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">{stats.pendingOrders}</p>
          </div>
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">Delivered</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">{stats.completedOrders}</p>
          </div>
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold text-[#0A1B2E]">Recent Orders</h3>
          <Link
            href="/dashboard/orders"
            className="shrink-0 text-sm font-bold text-[#B9954F] transition-colors hover:text-[#8F7138] touch-manipulation"
          >
            View All →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F5] text-xl">🛍️</div>
            <p className="mt-4 text-sm text-[#64748B]">You haven't placed any orders yet.</p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-[10px] bg-[#0A1B2E] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] touch-manipulation will-change-transform"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const isIncomplete = order.status === "Not Completed" && order.paymentStatus !== "Paid";
              return (
                <div
                  key={order._id}
                  className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#0A1B2E]">Order #{order.orderNumber}</p>
                        <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })} • {order.items?.length || 0} items
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold sm:text-xs ${getStatusClasses(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-[#64748B]">Total</p>
                        <p className="mt-0.5 font-extrabold text-[#0A1B2E]">₹{order.totalAmount}</p>
                      </div>

                      <div className="flex w-full gap-2 sm:w-auto">
                        <Link
                          href={`/dashboard/orders/${order._id}`}
                          className="flex-1 rounded-[9px] border border-[#E5E7EB] px-4 py-2.5 text-center text-sm font-semibold text-[#0A1B2E] transition-all hover:border-[#B9954F] hover:bg-[#F7F7F5] active:scale-[0.98] touch-manipulation will-change-transform sm:flex-none"
                        >
                          View Order
                        </Link>
                        {isIncomplete && (
                          <Link
                            href={`/dashboard/orders/${order._id}`}
                            className="flex-1 rounded-[9px] bg-[#0A1B2E] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] touch-manipulation will-change-transform sm:flex-none"
                          >
                            Complete Payment
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Account shortcuts */}
      <section>
        <h3 className="mb-3 text-base font-bold text-[#0A1B2E]">Account</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/profile"
            className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:border-[#B9954F] hover:shadow-md active:scale-[0.99] touch-manipulation will-change-transform"
          >
            <h4 className="font-bold text-[#0A1B2E]">Profile</h4>
            <p className="mt-1 text-sm leading-5 text-[#64748B]">Manage your personal information</p>
          </Link>
          <Link
            href="/dashboard/addresses"
            className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:border-[#B9954F] hover:shadow-md active:scale-[0.99] touch-manipulation will-change-transform"
          >
            <h4 className="font-bold text-[#0A1B2E]">Addresses</h4>
            <p className="mt-1 text-sm leading-5 text-[#64748B]">Manage your delivery addresses</p>
          </Link>
        </div>
      </section>
    </div>
  );
}