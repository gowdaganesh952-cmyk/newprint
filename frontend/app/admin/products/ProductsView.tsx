"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApi, ApiError } from "@/app/lib/api";
import { Product, Category } from "./types";
import ProductDeleteDialog from "./ProductDeleteDialog";

export default function ProductsView() {
  const api = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Delete States
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch both in parallel
      const [catsRes, prodsRes] = await Promise.all([
        api.get<{ success: boolean; categories: Category[] }>("/api/categories"),
        api.get<{ success: boolean; products: Product[] }>("/api/products")
      ]);
      
      if (catsRes.success) setCategories(catsRes.categories);
      if (prodsRes.success) setProducts(prodsRes.products);
    } catch (err) {
      console.error("Failed to load products view data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/products/${deletingProduct._id}`);
      setProducts(products.filter(p => p._id !== deletingProduct._id));
      setDeletingProduct(null);
    } catch (err: any) {
      alert(err instanceof ApiError ? err.message : "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryName = (idOrObj: any) => {
    // Check if it's populated or just an ID string
    const id = typeof idOrObj === 'object' ? idOrObj._id : idOrObj;
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : (typeof idOrObj === 'object' ? idOrObj.name : "Unknown Category");
  };

  // Local Client Filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" ? true : (typeof p.category === 'object' ? (p.category as any)._id : p.category) === categoryFilter;
    const matchesStatus = statusFilter === "all" ? true : p.status === statusFilter;
    const matchesFeatured = featuredFilter === "all" ? true : (featuredFilter === "featured" ? p.featured : !p.featured);
    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  });

  // Local Client Sorting
  filteredProducts.sort((a, b) => {
    if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    return 0; // Default to newest which is the backend array order
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#B9954F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:flex-1 xl:flex-nowrap">
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-64 rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm placeholder-[#64748B] focus:border-[#B9954F] focus:outline-none" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-auto rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)} className="w-full sm:w-auto rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm">
            <option value="all">All Visibility</option>
            <option value="featured">Featured</option>
            <option value="not_featured">Not Featured</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto rounded-[9px] border border-[#E5E7EB] px-3 py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
        <Link href="/admin/products/new" className="inline-flex w-full items-center justify-center rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white xl:w-auto">
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F5]">
            <svg className="h-6 w-6 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[#0A1B2E]">No products yet</h3>
          <p className="mt-1 text-sm text-[#64748B]">Add your first product to start building the New Print catalog.</p>
          <Link href="/admin/products/new" className="mt-6 inline-flex items-center rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white">Add Product</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map((product) => (
              <div key={product._id} className="flex flex-col overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
                <div className="flex p-4 gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[6px] bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No Img</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-semibold text-[#0A1B2E]">{product.name}</h3>
                    <p className="text-xs text-[#64748B]">{getCategoryName(product.category)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-medium text-[#B9954F]">{product.price !== undefined ? `₹${product.price}` : 'N/A'}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${product.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{product.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-[#E5E7EB] bg-[#F7F7F5]">
                  <Link href={`/admin/products/${product._id}/edit`} className="flex-1 py-2 text-center text-sm font-semibold text-[#0A1B2E] hover:bg-gray-200">Edit</Link>
                  <div className="w-[1px] bg-[#E5E7EB]"></div>
                  <button onClick={() => setDeletingProduct(product)} className="flex-1 py-2 text-center text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead className="bg-[#F7F7F5]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Image</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748B]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="h-12 w-12 overflow-hidden rounded-[6px] bg-gray-100">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[10px] text-gray-400">No Img</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[#0A1B2E]">{product.name}</div>
                        {product.featured && <span className="mt-1 inline-flex rounded-full bg-[#B9954F]/10 px-2 py-0.5 text-[10px] font-medium text-[#B9954F]">Featured</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#64748B]">
                        {getCategoryName(product.category)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#0A1B2E]">
                        {product.price !== undefined ? `₹${product.price}` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${product.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link href={`/admin/products/${product._id}/edit`} className="text-[#0A1B2E] hover:text-[#B9954F] mr-4">Edit</Link>
                        <button onClick={() => setDeletingProduct(product)} className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {deletingProduct && (
        <ProductDeleteDialog
          product={deletingProduct}
          loading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}