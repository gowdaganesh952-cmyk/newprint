import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderItem {
  _id?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  selections?: Record<string, unknown>;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  shippingProvider?: string;
  consignmentNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingNotes?: string;
  items?: OrderItem[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
}

const formatCurrency = (amount: number, currency: string = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

async function fetchOrder(id: string, token: string | null): Promise<Order | null> {
  try {
    const res = await fetch(`${API_URL}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order || null;
  } catch (error) {
    return null;
  }
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();
  const order = await fetchOrder(id, token);

  if (!order) {
    notFound();
  }

  const isCancelled = order.status === "Cancelled";
  const isNotCompleted = order.status === "Not Completed";
  
  const stepConfirmed = !isCancelled && !isNotCompleted;
  const stepShipped = stepConfirmed && (order.status === "Shipped" || order.status === "Delivered");
  const stepDelivered = stepConfirmed && order.status === "Delivered";

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden pb-8 sm:space-y-8 scroll-smooth">
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#B9954F]">Track Order</p>
          <h1 className="mt-1 break-words text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
            #{order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/orders/${id}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0A1B2E] whitespace-nowrap shadow-sm transition-colors hover:bg-[#F7F7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
          >
            Order Details
          </Link>
          <Link
            href="/dashboard/orders"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-semibold text-white whitespace-nowrap shadow-sm transition-colors hover:bg-[#142C46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F]"
          >
            All Orders
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
        <div className="border-b border-[#E5E7EB] bg-[#F7F7F5] px-5 py-4">
          <h2 className="font-bold text-[#0A1B2E]">Tracking Status</h2>
        </div>
        
        <div className="p-5 sm:p-8">
          {isCancelled ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <h3 className="font-bold text-red-900">Order Cancelled</h3>
              <p className="text-sm text-red-700 mt-1">This order has been cancelled and will not be delivered.</p>
            </div>
          ) : isNotCompleted ? (
            <div className="rounded-lg border border-[#B9954F]/30 bg-[#B9954F]/10 p-4">
              <h3 className="font-bold text-[#9A7839]">Payment Pending / Not Completed</h3>
              <p className="text-sm text-[#9A7839] mt-1">Complete your payment to confirm this order. Tracking will become available once the order is confirmed.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-[#E5E7EB]" aria-hidden="true" />
              
              <ul className="relative space-y-8">
                <li className="relative pl-10">
                  <span className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${stepConfirmed ? 'bg-[#0A1B2E] text-white' : 'bg-[#E5E7EB] text-transparent'}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <h3 className={`font-bold ${stepConfirmed ? 'text-[#0A1B2E]' : 'text-[#64748B]'}`}>Order Confirmed</h3>
                  <p className="mt-1 text-sm text-[#64748B]">Your order has been confirmed and is being prepared.</p>
                </li>

                <li className="relative pl-10">
                  <span className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${stepShipped ? 'bg-[#0A1B2E] text-white' : 'bg-[#E5E7EB] text-transparent'}`}>
                    {stepShipped ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <h3 className={`font-bold ${stepShipped ? 'text-[#0A1B2E]' : 'text-[#64748B]'}`}>Shipped</h3>
                  
                  {stepShipped ? (
                    <div className="mt-2 space-y-4">
                      <p className="text-sm text-[#64748B]">
                        Your order was handed over for delivery {order.shippedAt ? `on ${formatDate(order.shippedAt)}` : "and is on its way"}.
                      </p>
                      
                      {order.consignmentNumber && (
                        <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5] p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Shipping Provider</p>
                          <p className="font-semibold text-[#0A1B2E]">{order.shippingProvider || "India Post"}</p>
                          
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Consignment Number</p>
                              <p className="break-all font-mono text-lg font-bold text-[#0A1B2E]">{order.consignmentNumber}</p>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                            <p className="text-xs text-[#64748B] mb-3">Live carrier updates are not available here. Use the tracking link for the latest information.</p>
                            {order.trackingUrl && (
                              <a 
                                href={order.trackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-[#0A1B2E] px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap shadow-sm hover:bg-[#142C46] focus:outline-none focus:ring-2 focus:ring-[#B9954F]"
                              >
                                Track on {order.shippingProvider || "India Post"}
                                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {order.shippingNotes && (
                        <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
                          <p className="text-xs font-bold uppercase text-blue-900 mb-1">Shipping Update</p>
                          <p className="text-sm text-blue-800">{order.shippingNotes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-[#64748B]">Waiting for handover to delivery partner.</p>
                  )}
                </li>

                <li className="relative pl-10">
                  <span className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${stepDelivered ? 'bg-[#0A1B2E] text-white' : 'bg-[#E5E7EB] text-transparent'}`}>
                    {stepDelivered ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <h3 className={`font-bold ${stepDelivered ? 'text-[#0A1B2E]' : 'text-[#64748B]'}`}>Delivered</h3>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {stepDelivered 
                      ? `Your order was delivered successfully ${order.deliveredAt ? `on ${formatDate(order.deliveredAt)}` : ''}.` 
                      : "Waiting for delivery."}
                  </p>
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <section className="min-w-0 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
          <div className="border-b border-[#E5E7EB] bg-[#F7F7F5] px-4 py-4 sm:px-5">
            <h3 className="font-bold text-[#0A1B2E]">Ordered Items</h3>
          </div>
          <div className="divide-y divide-[#E5E7EB]">
            {order.items?.map((item, index) => (
              <div key={item._id || index} className="flex min-w-0 gap-4 p-4 sm:p-5">
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-lg border border-[#E5E7EB] object-cover sm:h-24 sm:w-24" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] sm:h-24 sm:w-24">
                    <span className="text-[10px] text-[#64748B]">No Image</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="break-words text-sm font-bold text-[#0A1B2E] sm:text-base">{item.name}</h4>
                  <p className="mt-1 text-xs text-[#64748B] sm:text-sm">Qty: {item.quantity}</p>
                  <p className="mt-1 font-extrabold text-[#0A1B2E]">{formatCurrency(item.price, order.currency)}</p>
                  {item.selections && Object.keys(item.selections).length > 0 && (
                    <div className="mt-2 text-xs text-[#64748B]">
                      {Object.entries(item.selections).map(([k, v]) => (
                        <p key={k}><span className="font-semibold capitalize text-[#0A1B2E]">{k}:</span> {String(v)}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="min-w-0 space-y-5 lg:space-y-6">
          <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-6">
            <h3 className="mb-4 font-bold text-[#0A1B2E]">Shipping Address</h3>
            <div className="space-y-1 text-sm text-[#0A1B2E]">
              <p className="font-semibold">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p className="pt-2">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
              {order.shippingAddress?.landmark && <p className="pt-2 text-xs text-[#64748B]">Landmark: {order.shippingAddress.landmark}</p>}
            </div>
          </section>

          <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-6">
            <h3 className="mb-4 font-bold text-[#0A1B2E]">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#64748B]">
                <span>Subtotal</span>
                <span className="font-medium text-[#0A1B2E]">{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Delivery</span>
                <span className="font-medium text-[#0A1B2E]">{formatCurrency(order.deliveryFee, order.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5E7EB] pt-3">
                <span className="font-bold text-[#0A1B2E]">Total</span>
                <span className="text-lg font-extrabold text-[#0A1B2E]">{formatCurrency(order.totalAmount, order.currency)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}