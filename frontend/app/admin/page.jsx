import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getDashboardStats() {
  try {
    const [categoriesResponse, productsResponse] = await Promise.all([
      fetch(`${API_URL}/api/categories`, {
        cache: "no-store",
      }),
      fetch(`${API_URL}/api/products`, {
        cache: "no-store",
      }),
    ]);

    if (!categoriesResponse.ok || !productsResponse.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    const [categoriesData, productsData] = await Promise.all([
      categoriesResponse.json(),
      productsResponse.json(),
    ]);

    const categories = categoriesData.success
      ? categoriesData.categories || []
      : [];

    const products = productsData.success
      ? productsData.products || []
      : [];

    return {
      categories: categories.length,
      products: products.length,
      activeProducts: products.filter(
        (product) => product.status === "active"
      ).length,
      featuredProducts: products.filter(
        (product) => product.featured === true
      ).length,
    };
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);

    return {
      categories: 0,
      products: 0,
      activeProducts: 0,
      featuredProducts: 0,
    };
  }
}

export default async function AdminPage() {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const stats = await getDashboardStats();

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-10">
      <div className="mx-auto max-w-7xl">

        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#B9954F]">
          New Print
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-[#64748B]">
          Manage New Print from here.
        </p>

        {/* Dashboard Statistics */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Categories */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">
              Categories
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
              {stats.categories}
            </p>

            <a
              href="/admin/categories"
              className="mt-4 inline-block text-sm font-semibold text-[#B9954F] hover:underline"
            >
              Manage categories →
            </a>
          </div>

          {/* Products */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">
              Products
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
              {stats.products}
            </p>

            <a
              href="/admin/products"
              className="mt-4 inline-block text-sm font-semibold text-[#B9954F] hover:underline"
            >
              Manage products →
            </a>
          </div>

          {/* Active Products */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">
              Active Products
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
              {stats.activeProducts}
            </p>

            <p className="mt-4 text-sm text-[#64748B]">
              Currently visible in catalog
            </p>
          </div>

          {/* Featured Products */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">
              Featured Products
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
              {stats.featuredProducts}
            </p>

            <p className="mt-4 text-sm text-[#64748B]">
              Products marked as featured
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}