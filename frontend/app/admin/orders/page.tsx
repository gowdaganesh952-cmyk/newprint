// path: frontend/app/admin/orders/page.tsx
"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
  };
  consignmentNumber?: string;
  items?: unknown[];
}

const statusFilters = ["All", "Confirmed", "Shipped", "Delivered", "Not Completed", "Cancelled"];

export function getStatusBadge(status: string) {
  switch (status) {
    case "Confirmed": return "border-emerald-200 bg-emerald-50/80 text-emerald-800";
    case "Shipped": return "border-blue-200 bg-blue-50/80 text-blue-800";
    case "Delivered": return "border-green-200 bg-green-50/80 text-green-800";
    case "Cancelled": return "border-red-200 bg-red-50/80 text-red-800";
    case "Not Completed":
    default: return "border-amber-200 bg-amber-50/80 text-amber-800";
  }
}

export function getPaymentBadge(status: string) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "paid") return "border-emerald-200 bg-emerald-50/80 text-emerald-800";
  if (normalized === "failed" || normalized === "cancelled") return "border-red-200 bg-red-50/80 text-red-800";
  return "border-amber-200 bg-amber-50/80 text-amber-800";
}

export default function AdminOrdersPage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const statusParam = selectedStatus !== "All" ? `&status=${encodeURIComponent(selectedStatus)}` : "";
      
      const res = await fetch(`${API_URL}/api/orders/admin?limit=100${statusParam}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("Admin orders load error:", err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, selectedStatus]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // Safe counts calculation from loaded orders
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    statusFilters.forEach((status) => {
      if (status !== "All") {
        counts[status] = orders.filter((o) => o.status === status).length;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        (order.shippingAddress?.fullName || "").toLowerCase().includes(query) ||
        (order.shippingAddress?.phone || "").toLowerCase().includes(query) ||
        (order.consignmentNumber || "").toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#B9954F]" />
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">Sales Fulfillment</p>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-3xl">Orders Operations Center</h1>
          <p className="mt-1 text-xs text-[#64748B]">Manage payments, production, shipping and delivery from one place.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-xs font-bold text-[#0A1B2E] transition-all hover:bg-[#F7F7F5] active:scale-[0.98] shadow-sm"
          title="Refresh Orders"
        >
          <svg className="h-3.5 w-3.5 text-[#B9954F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Orders
        </button>
      </div>

      {/* Workflow Navigation & Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusFilters.map((status) => {
            const count = statusCounts[status] ?? 0;
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`group shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all touch-manipulation border ${
                  isActive
                    ? "bg-[#0A1B2E] border-[#0A1B2E] text-white shadow-md shadow-[#0A1B2E]/10"
                    : "bg-white text-[#64748B] border-[#E5E7EB] hover:border-[#B9954F] hover:text-[#0A1B2E]"
                }`}
              >
                <span>{status}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold transition-colors ${
                  isActive ? "bg-white/20 text-white" : "bg-[#F7F7F5] text-[#64748B] group-hover:bg-[#B9954F]/10 group-hover:text-[#B9954F]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search order, customer, phone or tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-10 pr-4 text-xs font-medium text-[#0A1B2E] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/10 shadow-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[14px] border border-[#E5E7EB] bg-white" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F5] text-[#B9954F] mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#0A1B2E]">No orders found</p>
          <p className="mt-1 text-xs text-[#64748B]">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <>
          {/* Desktop Operations Table View */}
          <div className="hidden overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F7F7F5] text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
                <tr>
                  <th className="px-6 py-4">Order Identity</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Fulfillment</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="group transition-all hover:bg-[#FBFAF8]">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order._id}`} className="font-extrabold text-[#0A1B2E] group-hover:text-[#B9954F] transition-colors">
                        #{order.orderNumber}
                      </Link>
                      {order.consignmentNumber && (
                        <p className="mt-0.5 text-[10px] font-mono text-[#64748B]">TRK: {order.consignmentNumber}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#0A1B2E]">{order.shippingAddress?.fullName || "—"}</p>
                      <p className="mt-0.5 text-[11px] text-[#64748B]">{order.shippingAddress?.phone || "No phone"}</p>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      <p>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      <p className="text-[10px] text-[#94A3B8]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-extrabold shadow-2xs ${getPaymentBadge(order.paymentStatus)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold shadow-2xs ${getStatusBadge(order.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-sm text-[#0A1B2E]">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="inline-flex min-h-[36px] items-center justify-center rounded-[8px] bg-[#0A1B2E] px-4 text-xs font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] shadow-sm"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Operations View */}
          <div className="space-y-3.5 md:hidden">
            {filteredOrders.map((order) => (
              <article key={order._id} className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:border-[#B9954F]/50">
                <div className="flex items-start justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B9954F]">Order Identity</span>
                    <p className="text-base font-extrabold text-[#0A1B2E]">#{order.orderNumber}</p>
                    <p className="text-[10px] text-[#64748B]">
                      {new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="py-3 space-y-1 text-xs">
                  <p className="font-bold text-[#0A1B2E]">{order.shippingAddress?.fullName || "—"}</p>
                  <p className="text-[#64748B]">{order.shippingAddress?.phone} • {order.shippingAddress?.city}</p>
                  {order.consignmentNumber && (
                    <p className="font-mono text-[10px] text-[#B9954F]">TRK: {order.consignmentNumber}</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3">
                  <div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPaymentBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    <span className="ml-2 text-sm font-extrabold text-[#0A1B2E]">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="inline-flex min-h-[38px] items-center justify-center rounded-[8px] bg-[#0A1B2E] px-4 text-xs font-bold text-white shadow-sm"
                  >
                    Manage Order →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}