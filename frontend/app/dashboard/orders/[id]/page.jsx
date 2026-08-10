import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchOrder(id, token) {
  try {
    const res = await fetch(`${API_URL}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order || null;
  } catch (error) {
    return null;
  }
}

export default async function OrderDetailsPage({ params }) {
  const { id } = params;
  const { getToken } = await auth();
  const token = await getToken();
  
  const order = await fetchOrder(id, token);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0A1B2E]">Order #{order.orderNumber}</h2>
        <Link href="/dashboard/orders" className="text-sm font-medium text-[#B9954F] hover:underline">
          ← Back to Orders
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="border-b border-[#E5E7EB] bg-[#F7F7F5] px-6 py-4">
              <h3 className="font-bold text-[#0A1B2E]">Products</h3>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {order.items?.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start gap-4 p-6">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-24 w-24 rounded-[10px] object-cover border border-[#E5E7EB]" />
                  ) : (
                    <div className="h-24 w-24 rounded-[10px] bg-[#F7F7F5] border border-[#E5E7EB] flex items-center justify-center">
                      <span className="text-xs text-[#64748B]">No Image</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#0A1B2E]">{item.name}</h4>
                    <div className="mt-1 text-sm text-[#64748B]">
                      <p>Qty: {item.quantity}</p>
                      {item.selections && Object.entries(item.selections).map(([key, val]) => (
                        <p key={key} className="capitalize">{key}: {val}</p>
                      ))}
                    </div>
                  </div>
                  <div className="font-bold text-[#0A1B2E]">
                    ₹{item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#0A1B2E] mb-4">Summary</h3>
            <div className="space-y-3 text-sm text-[#64748B]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#0A1B2E]">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-medium text-[#0A1B2E]">₹{order.deliveryFee}</span>
              </div>
              <div className="pt-3 border-t border-[#E5E7EB] flex justify-between">
                <span className="font-bold text-[#0A1B2E]">Total</span>
                <span className="font-bold text-lg text-[#0A1B2E]">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#0A1B2E] mb-4">Status & Info</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[#64748B]">Order Date</p>
                <p className="font-medium text-[#0A1B2E]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Order Status</p>
                <p className={`font-semibold ${order.status === 'Processing' ? 'text-[#B9954F]' : 'text-green-600'}`}>
                  {order.status}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Payment Status</p>
                <p className="font-medium text-[#0A1B2E]">{order.paymentStatus}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#0A1B2E] mb-4">Shipping Address</h3>
            <div className="text-sm text-[#0A1B2E]">
              <p className="font-semibold">{order.shippingAddress?.fullName}</p>
              <p className="mt-1">{order.shippingAddress?.phone}</p>
              <p className="mt-2">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}