"use client";

import { useCallback, useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PrintImage {
  url: string;
  publicId: string;
}

interface PrintUnit {
  unitId: string;
  images: PrintImage[];
}

interface OrderItem {
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

interface Order {
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

  // Handler: Mark as Shipped (India Post)
  const handleMarkShipped = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consignmentNumber.trim()) {
      window.alert("Please provide an India Post consignment number.");
      return;
    }

    try {
      setIsUpdating(true);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/orders/admin/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          status: "Shipped",
          consignmentNumber: consignmentNumber.trim(),
          trackingUrl:
            trackingUrl.trim() ||
            `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`,
          shippingNotes: shippingNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update shipment");
      }

      await fetchOrder();
      window.alert("Order marked as Shipped via India Post successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update shipping.";
      window.alert(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler: Mark as Delivered
  const handleMarkDelivered = async () => {
    const confirmed = window.confirm(
      "Are you sure this order has been delivered to the customer?"
    );
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/orders/admin/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          status: "Delivered",
          shippingNotes: shippingNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to mark delivered");
      }

      await fetchOrder();
      window.alert("Order marked as Delivered successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status.";
      window.alert(message);
    } finally {
      setIsUpdating(false);
    }
  };

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
        <Link
          href="/admin/orders"
          className="mt-4 inline-block text-sm font-semibold text-[#B9954F]"
        >
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
            <Link
              href="/admin/orders"
              className="text-[#0A1B2E] transition-colors hover:text-[#B9954F]"
            >
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
            <strong
              className={
                order.paymentStatus === "Paid"
                  ? "text-emerald-600"
                  : order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled"
                  ? "text-red-600"
                  : "text-amber-600"
              }
            >
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
          
          {/* Ordered Products Card */}
          <section className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <h2 className="text-base font-bold text-[#0A1B2E]">
                Ordered Products & Custom Photos
              </h2>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {order.items.map((item, idx) => {
                const hasPrintFiles = Array.isArray(item.printUnits) && item.printUnits.length > 0;
                
                return (
                  <div key={idx} className="p-5">
                    <div className="flex min-w-0 items-start justify-between gap-4">
                      {/* Image & Details */}
                      <div className="flex gap-4">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 shrink-0 rounded-[8px] border border-[#E5E7EB] object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[8px] bg-[#F7F7F5] border border-[#E5E7EB] text-xs text-[#64748B]">
                            No image
                          </div>
                        )}

                        <div className="flex flex-col">
                          <h3 className="text-sm font-bold text-[#0A1B2E]">
                            {item.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-[#64748B]">
                            Qty: {item.quantity} × {order.currency === "INR" ? "₹" : ""}{item.price}
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            Item Key: {item.itemKey || item.productId}
                          </p>

                          {/* Custom selections (Size, Color, etc.) */}
                          {item.selections && Object.keys(item.selections).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(item.selections).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="rounded-[4px] border border-[#E5E7EB] bg-[#F7F7F5] px-2 py-1 text-[10px] font-medium text-[#64748B]"
                                >
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total Price */}
                      <p className="text-sm font-extrabold text-[#0A1B2E]">
                        {order.currency === "INR" ? "₹" : ""}{item.price * item.quantity}
                      </p>
                    </div>

                    {/* Customer Uploaded Print Units */}
                    {hasPrintFiles ? (
                      <div className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-[#FAFAF8] p-4">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="text-xs font-bold text-[#0A1B2E]">
                              Attached Printing Files
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#64748B]">
                              Customer uploaded files distributed across {item.quantity} physical unit{item.quantity !== 1 ? 's' : ''}.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-[#B9954F] bg-white border border-[#E5E7EB] px-2 py-1 rounded">
                            {item.printUnits!.reduce((sum, u) => sum + u.images.length, 0)} Total Images
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          {item.printUnits!.map((unit, uIdx) => (
                            <div
                              key={unit.unitId || uIdx}
                              className="border-t border-[#E5E7EB]/80 pt-3 first:border-t-0 first:pt-0"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#0A1B2E]">
                                  PHYSICAL UNIT {uIdx + 1}
                                </span>
                                <span className="text-[10px] text-[#64748B]">{unit.images.length} file(s)</span>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {unit.images.map((img, iIdx) => {
                                  const globalIndex = allImages.findIndex(i => i.url === img.url);
                                  return (
                                    <div key={img.publicId || iIdx} className="flex flex-col gap-1 w-[72px]">
                                      <button
                                        type="button"
                                        onClick={() => setViewerIndex(globalIndex !== -1 ? globalIndex : 0)}
                                        className="group relative h-[72px] w-[72px] overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-white transition-all hover:border-[#B9954F] shadow-sm"
                                      >
                                        <img
                                          src={img.url}
                                          alt="Custom print upload"
                                          className="h-full w-full object-cover"
                                        />
                                        <span className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                          </svg>
                                        </span>
                                      </button>
                                      <p className="text-[8px] text-center text-gray-400 truncate w-full" title={img.publicId}>
                                        {img.publicId.split('/').pop()}
                                      </p>
                                    </div>
                                  );
                                })}
                                {unit.images.length === 0 && (
                                  <p className="text-xs text-red-500 italic">No images uploaded for this unit.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-[8px] border border-dashed border-[#E5E7EB] bg-gray-50/50 p-4 text-center">
                        <p className="text-xs font-semibold text-[#64748B]">No print files attached</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Customer & Delivery Cards stacked */}
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
                  <p className="mt-2 text-xs text-[#64748B] italic">
                    Landmark: {order.shippingAddress.landmark}
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Right Side (Actions & Breakdown) */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Fulfillment Actions Card */}
          <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#B9954F]">
              Fulfillment Actions
            </p>
            <h2 className="mt-1 text-base font-extrabold text-[#0A1B2E]">
              India Post Shipping
            </h2>

            {order.status === "Confirmed" && (
              <form onSubmit={handleMarkShipped} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A1B2E]">Consignment Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ED123456789IN"
                    value={consignmentNumber}
                    onChange={(e) => setConsignmentNumber(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[8px] border border-[#E5E7EB] px-3 text-sm uppercase text-[#0A1B2E] outline-none focus:border-[#B9954F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A1B2E]">Tracking URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://www.indiapost.gov.in/..."
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#0A1B2E] outline-none focus:border-[#B9954F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A1B2E]">Shipping Notes (Internal)</label>
                  <textarea
                    rows={2}
                    placeholder="Packed in standard bubble mailer..."
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] p-2.5 text-sm text-[#0A1B2E] outline-none focus:border-[#B9954F]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] disabled:opacity-50"
                >
                  {isUpdating ? "Saving Shipment..." : "Mark as Shipped"}
                </button>
              </form>
            )}

            {order.status === "Shipped" && (
              <div className="mt-4 space-y-4">
                <div className="rounded-[8px] border border-blue-200 bg-blue-50/50 p-4 text-xs leading-5 text-blue-900">
                  <p className="font-bold text-base mb-1 text-blue-950">Currently in Transit</p>
                  <p>Consignment: <strong>{order.consignmentNumber}</strong></p>
                  {order.shippedAt && <p>Shipped on: {new Date(order.shippedAt).toLocaleDateString("en-IN")}</p>}
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-bold text-[#B9954F] underline">
                      Track with India Post →
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMarkDelivered}
                  disabled={isUpdating}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-emerald-700 px-4 text-sm font-bold text-white transition-all hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Mark as Delivered ✓"}
                </button>
              </div>
            )}

            {order.status === "Delivered" && (
              <div className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50/40 p-4 text-xs text-emerald-800 leading-5">
                <p className="font-bold text-emerald-900 mb-1">Delivered Successfully</p>
                {order.deliveredAt && <p>Delivered on: {new Date(order.deliveredAt).toLocaleDateString("en-IN")}</p>}
                {order.consignmentNumber && <p>India Post: {order.consignmentNumber}</p>}
              </div>
            )}

            {order.status === "Not Completed" && (
              <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-800 leading-5">
                <p className="font-bold text-amber-900 mb-1">Payment Not Completed</p>
                <p>Shipping cannot proceed until the customer finishes payment.</p>
              </div>
            )}
          </section>

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
            
            {/* Razorpay Diagnostic Info */}
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

      {/* Lightbox / Full Photo Viewer Modal */}
      {viewerIndex !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm touch-none"
        >
          <div className="absolute top-4 right-4 z-10 flex gap-4">
            <a
              href={allImages[viewerIndex].url}
              target="_blank"
              download
              rel="noreferrer"
              className="flex h-10 items-center rounded bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Download Original
            </a>
            <button
              onClick={() => setViewerIndex(null)}
              className="flex h-10 items-center justify-center rounded bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Close (✕)
            </button>
          </div>

          {allImages.length > 1 && (
            <>
              <button 
                onClick={() => setViewerIndex((prev) => (prev! > 0 ? prev! - 1 : allImages.length - 1))}
                className="absolute left-4 p-4 text-white/50 hover:text-white transition hidden md:block"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={() => setViewerIndex((prev) => (prev! < allImages.length - 1 ? prev! + 1 : 0))}
                className="absolute right-4 p-4 text-white/50 hover:text-white transition hidden md:block"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          <div className="relative max-h-[90dvh] max-w-5xl w-full flex flex-col items-center justify-center">
            <img
              src={allImages[viewerIndex].url}
              alt="High resolution print preview"
              className="max-h-[75dvh] max-w-full rounded-[4px] object-contain shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-bold text-sm">
                {allImages[viewerIndex].productName} — Unit {allImages[viewerIndex].unitIndex}
              </p>
              <p className="text-white/60 text-xs mt-1 font-mono">
                {allImages[viewerIndex].publicId}
              </p>
              <p className="text-white/40 text-[10px] mt-2 tracking-widest">
                IMAGE {viewerIndex + 1} OF {allImages.length}
              </p>
            </div>
            
            {/* Mobile Controls */}
            {allImages.length > 1 && (
              <div className="mt-6 flex gap-8 md:hidden">
                <button onClick={() => setViewerIndex((prev) => (prev! > 0 ? prev! - 1 : allImages.length - 1))} className="text-white px-4 py-2 bg-white/10 rounded">Prev</button>
                <button onClick={() => setViewerIndex((prev) => (prev! < allImages.length - 1 ? prev! + 1 : 0))} className="text-white px-4 py-2 bg-white/10 rounded">Next</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}