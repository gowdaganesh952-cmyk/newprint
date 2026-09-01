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
    case "Confirmed": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Shipped": return "border-blue-200 bg-blue-50 text-blue-700";
    case "Delivered": return "border-green-200 bg-green-50 text-green-700";
    case "Cancelled": return "border-red-200 bg-red-50 text-red-700";
    case "Not Completed":
    default: return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function getPaymentBadge(status: string) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "paid") return "border-green-200 bg-green-50 text-green-700";
  if (normalized === "failed" || normalized === "cancelled") return "border-red-200 bg-red-50 text-red-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
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
    <div className="space-y-5 sm:space-y-6 scroll-smooth">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B9954F]">Sales Fulfillment</p>
          <h1 className="text-xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-2xl">Orders Management</h1>
        </div>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-xs font-semibold text-[#0A1B2E] transition-all hover:bg-[#F7F7F5] active:scale-[0.98] shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all touch-manipulation ${
                selectedStatus === status
                  ? "bg-[#0A1B2E] text-white shadow-sm"
                  : "bg-white text-[#64748B] border border-[#E5E7EB] hover:bg-[#F7F7F5] hover:text-[#0A1B2E]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search order, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm text-[#0A1B2E] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#B9954F]"
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
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-sm font-semibold text-[#0A1B2E]">No orders found</p>
          <p className="mt-1 text-xs text-[#64748B]">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm text-[#0A1B2E]">
              <thead className="border-b border-[#E5E7EB] bg-[#F7F7F5] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-[#FBFAF8]">
                    <td className="px-5 py-4 font-bold text-[#0A1B2E]">#{order.orderNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{order.shippingAddress?.fullName || "—"}</p>
                      <p className="text-xs text-[#64748B]">{order.shippingAddress?.phone || ""}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#64748B]">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getPaymentBadge(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-extrabold text-[#0A1B2E]">₹{order.totalAmount}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="inline-flex min-h-[36px] items-center justify-center rounded-[8px] bg-[#0A1B2E] px-3.5 text-xs font-semibold text-white transition-all hover:bg-[#142C46]"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {filteredOrders.map((order) => (
              <article key={order._id} className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#0A1B2E]">#{order.orderNumber}</p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mt-3 border-t border-[#E5E7EB] pt-3 text-xs space-y-1">
                  <p className="font-semibold text-[#0A1B2E]">
                    {order.shippingAddress?.fullName} ({order.shippingAddress?.phone})
                  </p>
                  <p className="text-[#64748B]">{order.shippingAddress?.city}</p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#E5E7EB] pt-3">
                  <div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPaymentBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    <span className="ml-2 text-sm font-extrabold text-[#0A1B2E]">₹{order.totalAmount}</span>
                  </div>

                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="inline-flex min-h-[38px] items-center justify-center rounded-[8px] bg-[#0A1B2E] px-4 text-xs font-semibold text-white"
                  >
                    Manage
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