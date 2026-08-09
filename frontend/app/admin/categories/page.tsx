import CategoriesView from "./CategoriesView";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1B2E] sm:text-3xl">
          Categories
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Manage product categories for New Print.
        </p>
      </div>
      
      <CategoriesView />
    </div>
  );
}