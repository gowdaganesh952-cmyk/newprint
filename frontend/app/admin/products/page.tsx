import ProductsView from "./ProductsView";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1B2E] sm:text-3xl">
          Products
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Manage products listed on New Print.
        </p>
      </div>
      
      <ProductsView />
    </div>
  );
}