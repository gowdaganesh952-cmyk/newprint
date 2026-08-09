import ProductForm from "../ProductForm"; // Adjust import path as needed

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1B2E] sm:text-3xl">
          Add New Product
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Create a new product to list on New Print.
        </p>
      </div>
      
      <ProductForm />
    </div>
  );
}