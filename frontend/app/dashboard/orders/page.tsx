import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchOrders(token) {
  try {
    const res = await fetch(`${API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = res.ok ? await res.json() : { orders: [] };
    return data.orders || [];
  } catch (error) {
    return [];
  }
}

export default async function OrdersPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const orders = await fetchOrders(token);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#0A1B2E]">My Orders</h2>

      {orders.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
          <p className="text-[#64748B] mb-6">No orders yet.</p>
          <Link href="/" className="inline-block rounded-[10px] bg-[#0A1B2E] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#142C46]">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm gap-4">
              <div className="w-full sm:w-1/3">
                <p className="font-bold text-[#0A1B2E]">Order #{order.orderNumber}</p>
                <p className="text-sm text-[#64748B]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="w-full sm:w-1/3 text-left sm:text-center">
                <p className="font-medium text-[#0A1B2E]">{order.items?.length || 0} items</p>
                <p className="font-bold text-[#0A1B2E]">₹{order.totalAmount}</p>
              </div>
              <div className="w-full sm:w-1/3 flex items-center justify-between sm:justify-end gap-4">
                <p className={`text-sm font-semibold ${order.status === 'Processing' ? 'text-[#B9954F]' : 'text-green-600'}`}>
                  {order.status}
                </p>
                <Link href={`/dashboard/orders/${order._id}`} className="shrink-0 rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#0A1B2E] transition-colors duration-200 hover:bg-[#F7F7F5]">
                  View Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}