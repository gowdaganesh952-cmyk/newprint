import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    const [categoriesRes, productsRes, orderStatsRes] =
      await Promise.all([
        fetch(`${API_URL}/api/categories`, {
          cache: "no-store",
        }),

        fetch(`${API_URL}/api/products`, {
          cache: "no-store",
        }),

        fetch(`${API_URL}/api/orders/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          cache: "no-store",
        }),
      ]);

    const categoriesData = categoriesRes.ok
      ? await categoriesRes.json()
      : { categories: [] };

    const productsData = productsRes.ok
      ? await productsRes.json()
      : { products: [] };

    const orderStatsData = orderStatsRes.ok
      ? await orderStatsRes.json()
      : null;

    const categories = Array.isArray(categoriesData.categories)
      ? categoriesData.categories
      : [];

    const products = Array.isArray(productsData.products)
      ? productsData.products
      : [];

    const stats = orderStatsData?.stats || {};

    return {
      categories: categories.length,

      products: products.length,

      activeProducts: products.filter(
        (product) => product.status === "active"
      ).length,

      totalOrders: Number(stats.totalOrders || 0),

      totalRevenue: Number(stats.totalRevenue || 0),

      confirmedOrders: Number(
        stats.orderStatus?.confirmed || 0
      ),

      shippedOrders: Number(
        stats.orderStatus?.shipped || 0
      ),

      deliveredOrders: Number(
        stats.orderStatus?.delivered || 0
      ),

      notCompletedOrders: Number(
        stats.orderStatus?.notCompleted || 0
      ),
    };
  } catch (error) {
    console.error(
      "Failed to load admin dashboard data:",
      error
    );

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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B9954F] sm:text-xs">
            Management Console
          </p>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-3xl">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            Overview of sales, shipments, and catalog inventory.
          </p>
        </div>

        <Link
          href="/admin/revenue"
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#0A1B2E] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#142C46]"
        >
          <span>View Revenue Analytics</span>
          <span className="text-[#B9954F]">→</span>
        </Link>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Total Revenue
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
            ₹{data.totalRevenue.toLocaleString("en-IN")}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-green-600">
              Verified paid payments
            </span>
            <Link
              href="/admin/revenue"
              className="text-xs font-bold text-[#B9954F] hover:underline"
            >
              Details →
            </Link>
          </div>
        </div>

        {/* Needs Shipping */}
        <div className="rounded-[14px] border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Needs Shipping
          </p>

          <p className="mt-2 text-3xl font-extrabold text-blue-900">
            {data.confirmedOrders}
          </p>

          <Link
            href="/admin/orders?status=Confirmed"
            className="mt-2 inline-flex text-xs font-bold text-[#B9954F] hover:underline"
          >
            Process shipments →
          </Link>
        </div>

        {/* Shipped */}
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            In Transit
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
            {data.shippedOrders}
          </p>

          <p className="mt-1 text-xs text-[#64748B]">
            India Post shipments
          </p>

          <Link
            href="/admin/orders?status=Shipped"
            className="mt-2 inline-flex text-xs font-bold text-[#B9954F] hover:underline"
          >
            Track shipments →
          </Link>
        </div>

        {/* Delivered */}
        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Delivered Orders
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
            {data.deliveredOrders}
          </p>

          <p className="mt-2 text-xs text-[#64748B]">
            Completed fulfillments
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section>
        <h2 className="mb-4 text-lg font-extrabold text-[#0A1B2E]">
          Catalog Overview
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Products */}
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Total Products
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#0A1B2E]">
              {data.products}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              {data.activeProducts} active in store
            </p>

            <Link
              href="/admin/products"
              className="mt-4 inline-flex text-xs font-bold text-[#B9954F] hover:underline"
            >
              Manage products →
            </Link>
          </div>

          {/* Categories */}
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Categories
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#0A1B2E]">
              {data.categories}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Active category hierarchy
            </p>

            <Link
              href="/admin/categories"
              className="mt-4 inline-flex text-xs font-bold text-[#B9954F] hover:underline"
            >
              Manage categories →
            </Link>
          </div>

          {/* Orders */}
          <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              All Orders
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#0A1B2E]">
              {data.totalOrders}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Total order records logged
            </p>

            <Link
              href="/admin/orders"
              className="mt-4 inline-flex text-xs font-bold text-[#B9954F] hover:underline"
            >
              View order log →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}