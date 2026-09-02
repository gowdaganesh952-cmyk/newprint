// path: frontend/app/admin/orders/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import ImageViewerModal from "../ImageViewerModal";
import FulfillmentActions from "../FulfillmentActions";
import OrderItemsList from "../OrderItemsList";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface PrintImage {
  url: string;
  publicId: string;
}

export interface PrintUnit {
  unitId: string;
  images: PrintImage[];
}

export interface OrderItem {
  _id?: string;
  productId: string;
  itemKey?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  selections?: Record<string, string>;
  printUnits?: PrintUnit[];
}

export interface Order {
  _id: string;
  userId: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: "Not Completed" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  paymentStatus: "Pending" | "Paid" | "Failed" | "Cancelled" | "Refunded";
  currency: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: {
    addressId?: string;
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  razorpayReceipt?: string;
  paymentVerifiedAt?: string;
  shippingProvider?: string;
  consignmentNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingNotes?: string;
}

export default function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getToken } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Shipping Form State
  const [consignmentNumber, setConsignmentNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  
  // Image Viewer State
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/orders/admin/${id}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load order");
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setConsignmentNumber(data.order.consignmentNumber || "");
        setTrackingUrl(data.order.trackingUrl || "");
        setShippingNotes(data.order.shippingNotes || "");
      }
    } catch (err) {
      console.error("Fetch admin order detail error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  // Flatten all images across the order to allow sequential Next/Prev viewing
  const allImages = useMemo(() => {
    if (!order) return [];
    const images: { url: string; publicId: string; productName: string; unitIndex: number }[] = [];
    order.items.forEach((item) => {
      item.printUnits?.forEach((unit, uIdx) => {
        unit.images.forEach((img) => {
          images.push({ ...img, productName: item.name, unitIndex: uIdx + 1 });
        });
      });
    });
    return images;
  }, [order]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="h-10 w-48 animate-pulse rounded-md bg-[#E5E7EB]" />
        <div className="h-96 animate-pulse rounded-[16px] bg-white border border-[#E5E7EB]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-3">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-base font-bold text-[#0A1B2E]">Order not found</p>
        <p className="mt-1 text-xs text-[#64748B]">The requested order ID does not exist or has been removed.</p>
        <Link href="/admin/orders" className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-[#0A1B2E] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#142C46]">
          ← Back to Orders Operations
        </Link>
      </div>
    );
  }

  // Lifecycle steps determination
  const steps = ["Confirmed", "Shipped", "Delivered"];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Lifecycle Workspace Banner */}
      <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#64748B]">
              <Link href="/admin/orders" className="text-[#0A1B2E] transition-colors hover:text-[#B9954F]">
                Orders
              </Link>
              <span>/</span>
              <span className="text-[#B9954F] uppercase tracking-wider font-extrabold">Fulfillment Workspace</span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0A1B2E]">
                #{order.orderNumber}
              </h1>
              <span className="text-xs font-mono text-[#64748B]">ID: {order._id}</span>
            </div>
            <p className="mt-1 text-xs text-[#64748B]">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F7F7F5] px-4 py-2 text-xs font-bold">
              <span className="text-[#64748B]">Payment:</span>
              <span className={order.paymentStatus === "Paid" ? "text-emerald-700 font-extrabold" : order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled" ? "text-red-700 font-extrabold" : "text-amber-700 font-extrabold"}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#0A1B2E] px-5 py-2 text-xs font-extrabold text-white shadow-sm">
              <span>Status:</span>
              <span className="text-[#B9954F]">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Visual Lifecycle Progress Bar if status is in standard workflow */}
        {currentStepIndex !== -1 && (
          <div className="mt-6 border-t border-[#E5E7EB] pt-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                    {idx > 0 && (
                      <div className={`absolute top-4 -left-1/2 w-full h-1 -z-0 transition-colors ${idx <= currentStepIndex ? "bg-emerald-600" : "bg-[#E5E7EB]"}`} />
                    )}
                    <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm ${
                      isCurrent 
                        ? "bg-[#0A1B2E] text-[#B9954F] ring-4 ring-[#0A1B2E]/10" 
                        : isPassed 
                        ? "bg-emerald-600 text-white" 
                        : "bg-[#F7F7F5] border border-[#E5E7EB] text-[#64748B]"
                    }`}>
                      {isPassed && !isCurrent ? "✓" : idx + 1}
                    </div>
                    <span className={`mt-2 text-xs font-extrabold ${isCurrent ? "text-[#0A1B2E]" : isPassed ? "text-emerald-800" : "text-[#64748B]"}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Products, Custom Assets, Customer & Delivery) */}
        <div className="space-y-6 lg:col-span-8">
          <OrderItemsList items={order.items} currency={order.currency} allImages={allImages} onOpenViewer={setViewerIndex} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F7F5] text-[#0A1B2E]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-base font-extrabold text-[#0A1B2E]">Customer Information</h2>
              </div>
              <div className="text-sm leading-relaxed text-[#0A1B2E] space-y-2">
                <p className="font-extrabold text-base">{order.shippingAddress.fullName}</p>
                <div className="space-y-1 text-xs text-[#64748B] pt-1">
                  <p className="flex items-center gap-2">
                    <strong className="text-[#0A1B2E]">Phone:</strong> {order.shippingAddress.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <strong className="text-[#0A1B2E]">Email:</strong> {order.shippingAddress.email || "Not provided"}
                  </p>
                  <p className="pt-2 font-mono text-[10px] text-gray-400 break-all">
                    <strong>User ID:</strong> {order.userId}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F7F5] text-[#0A1B2E]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-extrabold text-[#0A1B2E]">Delivery Destination</h2>
              </div>
              <div className="text-xs leading-relaxed text-[#0A1B2E] space-y-1.5 uppercase font-medium">
                <p className="font-bold text-[#0A1B2E]">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p className="text-[#64748B]">
                  {order.shippingAddress.city}, {order.shippingAddress.state} — <strong className="text-[#0A1B2E]">{order.shippingAddress.pincode}</strong>
                </p>
                {order.shippingAddress.landmark && (
                  <p className="mt-3 text-[11px] text-[#B9954F] normal-case italic">
                    Landmark: {order.shippingAddress.landmark}
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Right Column (Fulfillment & Payment Breakdown) */}
        <div className="space-y-6 lg:col-span-4">
          <FulfillmentActions
            orderId={id}
            orderStatus={order.status}
            consignmentNumber={consignmentNumber}
            setConsignmentNumber={setConsignmentNumber}
            trackingUrl={trackingUrl}
            setTrackingUrl={setTrackingUrl}
            shippingNotes={shippingNotes}
            setShippingNotes={setShippingNotes}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
            isUpdating={isUpdating}
            setIsUpdating={setIsUpdating}
            onRefresh={fetchOrder}
            getToken={getToken}
            orderNumber={order.orderNumber}
            shippingAddress={order.shippingAddress}
            shippingProvider={order.shippingProvider}
          />

          {/* Payment Breakdown Card */}
          <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-[#0A1B2E]">Payment Breakdown</h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B9954F] bg-[#F7F7F5] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                {order.currency || "INR"}
              </span>
            </div>

            <div className="space-y-3 text-xs text-[#64748B]">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-bold text-[#0A1B2E]">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shipping (India Post)</span>
                <span className="font-bold text-[#0A1B2E]">₹{order.deliveryFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#E5E7EB] pt-4 mt-2">
                <span className="font-extrabold text-[#0A1B2E]">Total Received</span>
                <span className="text-xl font-black text-[#0A1B2E]">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            
            <div className="mt-6 border-t border-[#E5E7EB] pt-4 space-y-2 text-[10px] text-[#64748B]">
              <p className="uppercase tracking-widest font-extrabold text-[#0A1B2E] mb-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B9954F]" />
                Gateway Records
              </p>
              <div className="rounded-[10px] bg-[#F7F7F5] border border-[#E5E7EB] p-3 space-y-1.5 font-mono break-all">
                <p><strong>Method:</strong> {order.paymentMethod || "Razorpay"}</p>
                {order.razorpayOrderId && <p><strong>Order ID:</strong> {order.razorpayOrderId}</p>}
                {order.razorpayPaymentId && <p><strong>Payment ID:</strong> {order.razorpayPaymentId}</p>}
                {order.razorpayReceipt && <p><strong>Receipt:</strong> {order.razorpayReceipt}</p>}
                {order.paymentVerifiedAt && <p><strong>Verified:</strong> {new Date(order.paymentVerifiedAt).toLocaleString()}</p>}
                {order.razorpaySignature && <p className="text-emerald-700 font-bold"><strong>Signature:</strong> Verified ✔</p>}
              </div>
            </div>
          </section>
        </div>
      </div>

      <ImageViewerModal
        viewerIndex={viewerIndex}
        setViewerIndex={setViewerIndex}
        allImages={allImages}
      />
    </div>
  );
}