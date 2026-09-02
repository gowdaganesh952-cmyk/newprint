// path: frontend/app/admin/revenue/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface RevenueData {
  range: string;
  startDate: string;
  endDate: string;
  summary: {
    paidRevenue: number;
    paidRevenueGrowth: number;
    paidOrdersCount: number;
    paidOrdersGrowth: number;
    averageOrderValue: number;
    aovGrowth: number;
    deliveryRevenue: number;
    subtotalRevenue: number;
  };
  comparison: {
    previousPaidRevenue: number;
    previousPaidOrdersCount: number;
    previousAov: number;
  };
  trend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  paymentBreakdown: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  orderStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  topProductsByRevenue: Array<{
    productId: string;
    name: string;
    revenue: number;
    unitsSold: number;
    share: number;
  }>;
  topProductsByUnits: Array<{
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  salesTable: Array<{
    date: string;
    orders: number;
    paidOrders: number;
    revenue: number;
    aov: number;
  }>;
}

const ranges = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "12 Months", value: "1y" },
];

export default function AdminRevenuePage() {
  const { getToken } = useAuth();
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom date range state
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const fetchRevenue = useCallback(async (selectedRange: string, start?: string, end?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();

      let query = `range=${selectedRange}`;
      if (selectedRange === "custom" && start && end) {
        query += `&startDate=${start}&endDate=${end}`;
      }

      const res = await fetch(`${API_URL}/api/admin/revenue?${query}`, {
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch revenue analytics");
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Revenue fetch error:", err);
      setError("Unable to load revenue data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (range !== "custom") {
      void fetchRevenue(range);
    }
  }, [range, fetchRevenue]);

  const handleCustomApply = () => {
    if (!customStart || !customEnd) {
      alert("Please select both start and end dates.");
      return;
    }
    setRange("custom");
    void fetchRevenue("custom", customStart, customEnd);
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-16 w-full rounded-[14px] bg-white border border-[#E5E7EB]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-[14px] bg-white border border-[#E5E7EB]" />
          ))}
        </div>
        <div className="h-80 rounded-[14px] bg-white border border-[#E5E7EB]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm max-w-xl mx-auto my-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-3">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-base font-bold text-[#0A1B2E]">Unable to load revenue data</p>
        <p className="mt-1 text-xs text-[#64748B]">{error}</p>
        <button
          type="button"
          onClick={() => void fetchRevenue(range, customStart, customEnd)}
          className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-[#0A1B2E] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#142C46]"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const comparison = data?.comparison;
  const trend = data?.trend || [];
  const paymentBreakdown = data?.paymentBreakdown || [];
  const orderStatusBreakdown = data?.orderStatusBreakdown || [];
  const topProductsByRevenue = data?.topProductsByRevenue || [];
  const topProductsByUnits = data?.topProductsByUnits || [];
  const salesTable = data?.salesTable || [];

  const hasRevenue = summary && summary.paidRevenue > 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Header & Date Controls */}
      <div className="flex flex-col gap-4 border-b border-[#E5E7EB] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#B9954F]" />
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
              Revenue Intelligence
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-3xl">
            Revenue Command Center
          </h1>
          <p className="mt-1 text-xs text-[#64748B]">
            Understand sales performance, payment flow and product contribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setRange(r.value);
                setShowCustomPicker(false);
              }}
              className={`rounded-[10px] px-3.5 py-2 text-xs font-bold transition-all border ${
                range === r.value && !showCustomPicker
                  ? "bg-[#0A1B2E] border-[#0A1B2E] text-white shadow-sm"
                  : "bg-white text-[#64748B] border-[#E5E7EB] hover:border-[#B9954F] hover:text-[#0A1B2E]"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`rounded-[10px] px-3.5 py-2 text-xs font-bold transition-all border ${
              range === "custom" || showCustomPicker
                ? "bg-[#0A1B2E] border-[#0A1B2E] text-white shadow-sm"
                : "bg-white text-[#64748B] border-[#E5E7EB] hover:border-[#B9954F] hover:text-[#0A1B2E]"
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Drawer */}
      {showCustomPicker && (
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#64748B]">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-xs text-[#0A1B2E] outline-none focus:border-[#B9954F]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#64748B]">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-xs text-[#0A1B2E] outline-none focus:border-[#B9954F]"
            />
          </div>
          <button
            type="button"
            onClick={handleCustomApply}
            className="h-10 px-5 rounded-[8px] bg-[#0A1B2E] text-xs font-bold text-white hover:bg-[#142C46] transition w-full sm:w-auto"
          >
            Apply Range
          </button>
        </div>
      )}

      {!hasRevenue && !isLoading ? (
        /* Empty State */
        <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F5] text-[#B9954F] mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-bold text-[#0A1B2E]">No revenue yet</p>
          <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
            Once customers complete payments, revenue analytics and trends will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Primary Revenue Hero & KPIs */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Paid Revenue Hero */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Paid Revenue
                </p>
                <p className="mt-2 text-3xl font-black text-[#0A1B2E]">
                  {formatINR(summary?.paidRevenue || 0)}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  (summary?.paidRevenueGrowth || 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}>
                  {(summary?.paidRevenueGrowth || 0) >= 0 ? "↑" : "↓"} {Math.abs(summary?.paidRevenueGrowth || 0)}%
                </span>
                <span className="text-[11px] text-[#64748B]">vs previous period</span>
              </div>
            </div>

            {/* Paid Orders */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Paid Orders
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
                  {summary?.paidOrdersCount || 0}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  (summary?.paidOrdersGrowth || 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}>
                  {(summary?.paidOrdersGrowth || 0) >= 0 ? "↑" : "↓"} {Math.abs(summary?.paidOrdersGrowth || 0)}%
                </span>
                <span className="text-[11px] text-[#64748B]">vs previous period</span>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Average Order Value (AOV)
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
                  {formatINR(summary?.averageOrderValue || 0)}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  (summary?.aovGrowth || 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}>
                  {(summary?.aovGrowth || 0) >= 0 ? "↑" : "↓"} {Math.abs(summary?.aovGrowth || 0)}%
                </span>
                <span className="text-[11px] text-[#64748B]">vs previous period</span>
              </div>
            </div>

            {/* Delivery Revenue */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Delivery Revenue
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
                  {formatINR(summary?.deliveryRevenue || 0)}
                </p>
              </div>
              <div className="mt-4 text-[11px] text-[#64748B]">
                India Post shipping collected
              </div>
            </div>
          </section>

          {/* Revenue Trend Chart */}
          <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-[#0A1B2E]">Revenue Trend</h2>
                <p className="text-xs text-[#64748B]">Verified paid revenue over time</p>
              </div>
              <span className="text-xs font-bold text-[#B9954F] bg-[#F7F7F5] px-3 py-1 rounded-full border border-[#E5E7EB]">
                {range.toUpperCase()}
              </span>
            </div>

            {trend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#64748B]">
                No trend data for this period
              </div>
            ) : (
              <div className="h-72 w-full">
                {/* SVG Responsive Area/Line Chart */}
                <div className="relative h-full w-full">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#B9954F" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#B9954F" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Background grid lines */}
                    {[0, 60, 120, 180, 240].map((y) => (
                      <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
                    ))}

                    {/* Calculate polyline points */}
                    {(() => {
                      const maxVal = Math.max(...trend.map(t => t.revenue), 100);
                      const points = trend.map((t, idx) => {
                        const x = (idx / (Math.max(trend.length - 1, 1))) * 780 + 10;
                        const y = 220 - (t.revenue / maxVal) * 200;
                        return { x, y, ...t };
                      });

                      const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                      const areaD = `${pathD} L ${points[points.length - 1].x} 240 L ${points[0].x} 240 Z`;

                      return (
                        <>
                          <path d={areaD} fill="url(#revenueGradient)" />
                          <path d={pathD} fill="none" stroke="#0A1B2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {points.map((p, idx) => (
                            <g key={idx} className="group cursor-pointer">
                              <circle cx={p.x} cy={p.y} r="4" fill="#B9954F" stroke="#ffffff" strokeWidth="2" />
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="mt-3 flex justify-between text-[10px] text-[#64748B]">
                  <span>{trend[0]?.date}</span>
                  <span>{trend[Math.floor(trend.length / 2)]?.date}</span>
                  <span>{trend[trend.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </section>

          {/* Period Comparison & Revenue Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Period Comparison */}
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0A1B2E] mb-4">Period Comparison</h2>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F7F5] border border-[#E5E7EB]">
                  <div>
                    <p className="text-[#64748B]">Previous Period Revenue</p>
                    <p className="text-sm font-extrabold text-[#0A1B2E] mt-0.5">
                      {formatINR(comparison?.previousPaidRevenue || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#64748B]">Growth</p>
                    <p className={`text-sm font-bold mt-0.5 ${summary.paidRevenueGrowth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {summary.paidRevenueGrowth >= 0 ? "+" : ""}{summary.paidRevenueGrowth}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F7F5] border border-[#E5E7EB]">
                  <div>
                    <p className="text-[#64748B]">Previous Paid Orders</p>
                    <p className="text-sm font-extrabold text-[#0A1B2E] mt-0.5">
                      {comparison?.previousPaidOrdersCount || 0} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#64748B]">Growth</p>
                    <p className={`text-sm font-bold mt-0.5 ${summary.paidOrdersGrowth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {summary.paidOrdersGrowth >= 0 ? "+" : ""}{summary.paidOrdersGrowth}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F7F5] border border-[#E5E7EB]">
                  <div>
                    <p className="text-[#64748B]">Previous AOV</p>
                    <p className="text-sm font-extrabold text-[#0A1B2E] mt-0.5">
                      {formatINR(comparison?.previousAov || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#64748B]">Growth</p>
                    <p className={`text-sm font-bold mt-0.5 ${summary.aovGrowth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {summary.aovGrowth >= 0 ? "+" : ""}{summary.aovGrowth}%
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Revenue Breakdown */}
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0A1B2E] mb-4">Financial Breakdown</h2>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Product Subtotal</span>
                  <span className="font-extrabold text-[#0A1B2E]">
                    {formatINR(summary?.subtotalRevenue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Delivery / Shipping Fees</span>
                  <span className="font-extrabold text-[#0A1B2E]">
                    {formatINR(summary?.deliveryRevenue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4">
                  <span className="font-extrabold text-[#0A1B2E]">Total Paid Volume</span>
                  <span className="text-base font-black text-[#0A1B2E]">
                    {formatINR(summary?.paidRevenue || 0)}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] italic pt-2">
                  * Based on verified successful Razorpay payments within the selected time window.
                </p>
              </div>
            </section>
          </div>

          {/* Payment Health & Order Status Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Payment Health */}
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0A1B2E] mb-4">Payment Health</h2>
              <div className="space-y-3">
                {paymentBreakdown.map((p) => (
                  <div key={p.status} className="flex items-center justify-between p-3 rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5]/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        p.status === "Paid" ? "bg-emerald-600" :
                        p.status === "Pending" ? "bg-amber-500" :
                        p.status === "Failed" ? "bg-red-500" : "bg-gray-400"
                      }`} />
                      <span className="font-bold text-[#0A1B2E]">{p.status}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#64748B]">{p.count} orders</span>
                      <span className="font-extrabold text-[#0A1B2E]">{formatINR(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Order Status Breakdown */}
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0A1B2E] mb-4">Order Status Breakdown</h2>
              <div className="space-y-3">
                {orderStatusBreakdown.map((o) => (
                  <div key={o.status} className="flex items-center justify-between p-3 rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5]/50 text-xs">
                    <span className="font-bold text-[#0A1B2E]">{o.status}</span>
                    <span className="font-extrabold text-[#0A1B2E] bg-white px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                      {o.count} orders
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Top Products by Revenue & Units */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Products by Revenue */}
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0A1B2E] mb-4">Top Products by Revenue</h2>
              {topProductsByRevenue.length === 0 ? (
                <p className="text-xs text-[#64748B]">No product revenue recorded in this range.</p>
              ) : (
                <div className="space-y-3">
                  {topProductsByRevenue.map((prod, idx) => (
                    <div key={prod.productId || idx} className="flex items-center justify-between p-3 rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5]/50 text-xs">
                      <div>
                        <p className="font-bold text-[#0A1B2E]">{prod.name}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">{prod.unitsSold} units sold • {prod.share}% of revenue</p>
                      </div>
                      <p className="font-extrabold text-[#0A1B2E]">{formatINR(prod.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Top Products by Units (Best Sellers) */}
            <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0A1B2E] mb-4">Best Sellers by Units Sold</h2>
              {topProductsByUnits.length === 0 ? (
                <p className="text-xs text-[#64748B]">No units sold in this range.</p>
              ) : (
                <div className="space-y-3">
                  {topProductsByUnits.map((prod, idx) => (
                    <div key={prod.productId || idx} className="flex items-center justify-between p-3 rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5]/50 text-xs">
                      <div>
                        <p className="font-bold text-[#0A1B2E]">{prod.name}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">Revenue: {formatINR(prod.revenue)}</p>
                      </div>
                      <span className="font-extrabold text-[#0A1B2E] bg-[#0A1B2E] text-white px-3 py-1 rounded-full text-xs">
                        {prod.unitsSold} units
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sales Performance Table */}
          <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#0A1B2E] mb-4">Sales Performance Table</h2>
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs text-[#0A1B2E]">
                <thead className="border-b border-[#E5E7EB] bg-[#F7F7F5] font-extrabold uppercase tracking-wider text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3">Date / Period</th>
                    <th className="px-4 py-3">Total Orders</th>
                    <th className="px-4 py-3">Paid Orders</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3 text-right">Average Order Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {salesTable.map((row, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-[#FBFAF8]">
                      <td className="px-4 py-3 font-bold text-[#0A1B2E]">{row.date}</td>
                      <td className="px-4 py-3 text-[#64748B]">{row.orders}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{row.paidOrders}</td>
                      <td className="px-4 py-3 font-extrabold text-[#0A1B2E]">{formatINR(row.revenue)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#64748B]">{formatINR(row.aov)}</td>
                    </tr>
                  ))}
                  {salesTable.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-[#64748B]">
                        No sales data found for this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
