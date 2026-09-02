// path: frontend/app/admin/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getAdminDashboardData(token) {
  const fallback = {
    categories: 0,
    products: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    notCompletedOrders: 0,
  };

  try {
    const [categoriesRes, productsRes, orderStatsRes] = await Promise.all([
      fetch(`${API_URL}/api/categories`, { cache: "no-store" }),
      fetch(`${API_URL}/api/products`, { cache: "no-store" }),
      fetch(`${API_URL}/api/orders/admin/stats`, {
        headers: { Authorization: `Bearer ${token || ""}` },
        cache: "no-store",
      }),
    ]);

    const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [] };
    const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
    const orderStatsData = orderStatsRes.ok ? await orderStatsRes.json() : null;

    const categories = Array.isArray(categoriesData.categories) ? categoriesData.categories : [];
    const products = Array.isArray(productsData.products) ? productsData.products : [];
    const stats = orderStatsData?.stats || {};

    return {
      categories: categories.length,
      products: products.length,
      activeProducts: products.filter((product) => product.status === "active").length,
      totalOrders: Number(stats.totalOrders || 0),
      totalRevenue: Number(stats.totalRevenue || 0),
      confirmedOrders: Number(stats.orderStatus?.confirmed || 0),
      shippedOrders: Number(stats.orderStatus?.shipped || 0),
      deliveredOrders: Number(stats.orderStatus?.delivered || 0),
      notCompletedOrders: Number(stats.orderStatus?.notCompleted || 0),
    };
  } catch (error) {
    console.error("Failed to load admin dashboard data:", error);
    return fallback;
  }
}

export default async function AdminPage() {
  const { isAuthenticated, getToken } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user || user.publicMetadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const token = await getToken();
  const data = await getAdminDashboardData(token);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#B9954F]" />
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">Management Console</p>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-xs text-[#64748B]">Overview of verified sales, live shipments, and catalog inventory.</p>
        </div>

        <Link
          href="/admin/revenue"
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[10px] bg-[#0A1B2E] px-4 text-xs font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] shadow-sm"
        >
          <span>View Revenue Analytics</span>
          <span className="text-[#B9954F]">→</span>
        </Link>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:border-[#B9954F]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Total Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F7F5] text-[#0A1B2E]">
              <svg className="h-4 w-4 text-[#B9954F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-[#0A1B2E]">
            ₹{data.totalRevenue.toLocaleString("en-IN")}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs">
            <span className="font-bold text-emerald-700">Verified paid</span>
            <Link href="/admin/revenue" className="font-bold text-[#B9954F] hover:underline">
              Analytics →
            </Link>
          </div>
        </div>

        {/* Needs Shipping */}
        <div className="rounded-[16px] border border-blue-200 bg-blue-50/50 p-5 shadow-sm transition-all hover:border-blue-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900">Needs Shipping</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-blue-950">
            {data.confirmedOrders}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-blue-200 pt-3 text-xs">
            <span className="font-bold text-blue-800">Ready to dispatch</span>
            <Link href="/admin/orders?status=Confirmed" className="font-bold text-[#B9954F] hover:underline">
              Fulfill →
            </Link>
          </div>
        </div>

        {/* In Transit */}
        <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:border-[#B9954F]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">In Transit</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F7F5] text-[#0A1B2E]">
              <svg className="h-4 w-4 text-[#B9954F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-[#0A1B2E]">
            {data.shippedOrders}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs">
            <span className="font-bold text-[#64748B]">India Post active</span>
            <Link href="/admin/orders?status=Shipped" className="font-bold text-[#B9954F] hover:underline">
              Track →
            </Link>
          </div>
        </div>

        {/* Delivered */}
        <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:border-[#B9954F]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Delivered</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-[#0A1B2E]">
            {data.deliveredOrders}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs">
            <span className="font-bold text-emerald-700">Completed</span>
            <Link href="/admin/orders?status=Delivered" className="font-bold text-[#B9954F] hover:underline">
              View log →
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog Overview */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B9954F]">Inventory & Setup</span>
            <h2 className="text-base font-extrabold text-[#0A1B2E]">Catalog & Store Management</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Products */}
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:border-[#B9954F]/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Products</span>
              <span className="rounded-full bg-[#F7F7F5] border border-[#E5E7EB] px-2.5 py-1 text-[10px] font-extrabold text-[#0A1B2E]">
                {data.activeProducts} Active
              </span>
            </div>
            <p className="text-3xl font-black text-[#0A1B2E]">{data.products}</p>
            <p className="mt-1 text-xs text-[#64748B]">Total products registered in store inventory</p>
            <div className="mt-5 border-t border-[#E5E7EB] pt-4">
              <Link
                href="/admin/products"
                className="inline-flex items-center justify-center w-full min-h-[38px] rounded-[8px] bg-[#0A1B2E] text-xs font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98]"
              >
                Manage Products →
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:border-[#B9954F]/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Categories</span>
              <span className="rounded-full bg-[#F7F7F5] border border-[#E5E7EB] px-2.5 py-1 text-[10px] font-extrabold text-[#0A1B2E]">
                Active Hierarchy
              </span>
            </div>
            <p className="text-3xl font-black text-[#0A1B2E]">{data.categories}</p>
            <p className="mt-1 text-xs text-[#64748B]">Store categories organized for print items</p>
            <div className="mt-5 border-t border-[#E5E7EB] pt-4">
              <Link
                href="/admin/categories"
                className="inline-flex items-center justify-center w-full min-h-[38px] rounded-[8px] bg-[#0A1B2E] text-xs font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98]"
              >
                Manage Categories →
              </Link>
            </div>
          </div>

          {/* All Orders */}
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:border-[#B9954F]/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Order Log</span>
              <span className="rounded-full bg-[#F7F7F5] border border-[#E5E7EB] px-2.5 py-1 text-[10px] font-extrabold text-[#0A1B2E]">
                All Records
              </span>
            </div>
            <p className="text-3xl font-black text-[#0A1B2E]">{data.totalOrders}</p>
            <p className="mt-1 text-xs text-[#64748B]">Total orders processed across all statuses</p>
            <div className="mt-5 border-t border-[#E5E7EB] pt-4">
              <Link
                href="/admin/orders"
                className="inline-flex items-center justify-center w-full min-h-[38px] rounded-[8px] bg-[#0A1B2E] text-xs font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98]"
              >
                View Order Log →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}