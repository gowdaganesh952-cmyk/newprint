import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getDashboardData(token) {
  try {
    const [statsRes, ordersRes] = await Promise.all([
      fetch(`${API_URL}/api/orders/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_URL}/api/orders?limit=3`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const statsData = statsRes.ok ? await statsRes.json() : { stats: { totalOrders: 0, pendingOrders: 0, completedOrders: 0 } };
    const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };

    return {
      stats: statsData.stats || { totalOrders: 0, pendingOrders: 0, completedOrders: 0 },
      recentOrders: ordersData.orders || []
    };
  } catch (error) {
    return {
      stats: { totalOrders: 0, pendingOrders: 0, completedOrders: 0 },
      recentOrders: []
    };
  }
}

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const user = await currentUser();
  const firstName = user?.firstName || "there";

  const { stats, recentOrders } = await getDashboardData(token);

  return (
    <div className="space-y-8">
      
      {/* Welcome Section */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#0A1B2E]">
          Welcome back, {firstName}
        </h2>
        <p className="mt-2 text-[#64748B]">
          Manage your orders, profile, and saved addresses.
        </p>
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-[#64748B]">Total Orders</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">{stats.totalOrders}</p>
        </div>
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-[#64748B]">Pending Orders</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">{stats.pendingOrders}</p>
        </div>
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-[#64748B]">Completed</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">{stats.completedOrders}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0A1B2E]">Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-sm font-semibold text-[#B9954F] hover:underline">
            View All →
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <p className="text-[#64748B] mb-4">You haven't placed any orders yet.</p>
            <Link href="/" className="inline-block rounded-[10px] bg-[#0A1B2E] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#142C46]">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm gap-4">
                <div>
                  <p className="font-bold text-[#0A1B2E]">Order #{order.orderNumber}</p>
                  <p className="text-sm text-[#64748B]">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })} • {order.items?.length || 0} items
                  </p>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-[#0A1B2E]">₹{order.totalAmount}</p>
                    <p className={`text-sm font-medium ${order.status === 'Processing' ? 'text-[#B9954F]' : 'text-green-600'}`}>
                      {order.status}
                    </p>
                  </div>
                  <Link href={`/dashboard/orders/${order._id}`} className="rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#0A1B2E] transition-colors duration-200 hover:bg-[#F7F7F5]">
                    View Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Shortcuts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/profile" className="block rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-colors duration-200 hover:border-[#B9954F]">
          <h4 className="font-bold text-[#0A1B2E]">Profile</h4>
          <p className="mt-1 text-sm text-[#64748B]">Manage your personal information</p>
        </Link>
        <Link href="/dashboard/addresses" className="block rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-colors duration-200 hover:border-[#B9954F]">
          <h4 className="font-bold text-[#0A1B2E]">Addresses</h4>
          <p className="mt-1 text-sm text-[#64748B]">Manage delivery addresses</p>
        </Link>
      </div>

    </div>
  );
}