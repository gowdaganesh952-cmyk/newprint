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
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-[#E5E7EB]" />
        <div className="h-64 animate-pulse rounded-[14px] bg-white" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-8 text-center">
        <p className="font-bold text-[#0A1B2E]">Order not found</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm font-semibold text-[#B9954F]">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 scroll-smooth pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <Link href="/admin/orders" className="text-[#0A1B2E] transition-colors hover:text-[#B9954F]">
              ← Orders
            </Link>
            <span>/</span>
            <span>Fulfillment</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-3xl">
            #{order.orderNumber}
          </h1>
          <p className="mt-1 text-xs text-[#64748B]">
            ID: {order._id} • Placed: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
          <span className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64748B] shadow-sm">
            Payment:{" "}
            <strong className={order.paymentStatus === "Paid" ? "text-emerald-600" : order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled" ? "text-red-600" : "text-amber-600"}>
              {order.paymentStatus}
            </strong>
          </span>
          <span className="flex items-center rounded-full bg-[#0A1B2E] px-4 py-1.5 text-xs font-semibold tracking-wide text-white shadow-sm">
            Status: {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side (Products & Delivery) */}
        <div className="space-y-6 lg:col-span-8">
          <OrderItemsList items={order.items} currency={order.currency} allImages={allImages} onOpenViewer={setViewerIndex} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#0A1B2E]">Customer Details</h2>
              <div className="mt-4 text-sm leading-relaxed text-[#0A1B2E]">
                <p className="font-bold">{order.shippingAddress.fullName}</p>
                <div className="mt-2 text-xs text-[#64748B] space-y-1">
                  <p><strong>Phone:</strong> {order.shippingAddress.phone}</p>
                  <p><strong>Email:</strong> {order.shippingAddress.email || "Not available"}</p>
                  <p className="mt-2 break-all text-[10px]"><strong>User ID:</strong> {order.userId}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#0A1B2E]">Delivery Destination</h2>
              <div className="mt-4 text-sm leading-relaxed text-[#0A1B2E]">
                <div className="text-xs text-[#0A1B2E] uppercase tracking-wide space-y-1">
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                </div>
                {order.shippingAddress.landmark && (
                  <p className="mt-2 text-xs text-[#64748B] italic">Landmark: {order.shippingAddress.landmark}</p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Right Side (Actions & Breakdown) */}
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
          />

          {/* Payment Breakdown Card */}
          <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#0A1B2E]">Payment Breakdown</h2>
            <div className="mt-4 space-y-3 text-sm text-[#64748B]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#0A1B2E]">{order.currency === "INR" ? "₹" : ""}{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping (India Post)</span>
                <span className="font-bold text-[#0A1B2E]">{order.currency === "INR" ? "₹" : ""}{order.deliveryFee}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5E7EB] pt-4 mt-1">
                <span className="font-bold text-[#0A1B2E]">Total Received</span>
                <span className="text-lg font-extrabold text-[#0A1B2E]">
                  {order.currency === "INR" ? "₹" : ""}{order.totalAmount}
                </span>
              </div>
            </div>
            
            <div className="mt-5 border-t border-[#E5E7EB] pt-4 space-y-2 text-[10px] text-[#64748B] break-all">
              <p className="uppercase tracking-wider font-bold mb-2">Gateway Records</p>
              <p><strong>Method:</strong> {order.paymentMethod || "Razorpay"}</p>
              <p><strong>Currency:</strong> {order.currency || "INR"}</p>
              {order.razorpayOrderId && <p><strong>Order ID:</strong> {order.razorpayOrderId}</p>}
              {order.razorpayPaymentId && <p><strong>Payment ID:</strong> {order.razorpayPaymentId}</p>}
              {order.razorpayReceipt && <p><strong>Receipt:</strong> {order.razorpayReceipt}</p>}
              {order.paymentVerifiedAt && <p><strong>Verified At:</strong> {new Date(order.paymentVerifiedAt).toLocaleString()}</p>}
              {order.razorpaySignature && <p><strong>Signature:</strong> Verified ✔</p>}
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