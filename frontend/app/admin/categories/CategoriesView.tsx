"use client";

import { useState, useEffect } from "react";
import { Category } from "./types";
import { useApi, ApiError } from "@/app/lib/api";
import CategoryControls from "./CategoryControls";
import CategoryEmptyState from "./CategoryEmptyState";
import CategoryModal from "./CategoryModal";
import CategoryCard from "./CategoryCard";
import CategoryPagination from "./CategoryPagination";
import CategorySkeleton from "./CategorySkeleton";
import CategoryDeleteDialog from "./CategoryDeleteDialog";

export default function CategoriesView() {
  const api = useApi();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ success: boolean; categories: Category[] }>("/api/categories");
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/categories/${deletingCategory._id}`);
      await loadCategories();
      setDeletingCategory(null);
    } catch (err: any) {
      alert(err instanceof ApiError ? err.message : "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    loadCategories();
  };

  // Client-side filtering
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" ? true : cat.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <CategoryControls 
        onAdd={() => {
          setEditingCategory(null);
          setIsModalOpen(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <CategorySkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-[9px] border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <p>{error}</p>
          <button 
            onClick={loadCategories} 
            className="mt-4 rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#142C46]"
          >
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <CategoryEmptyState onAdd={() => {
          setEditingCategory(null);
          setIsModalOpen(true);
        }} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <CategoryCard 
                key={category._id} 
                category={category}
                onEdit={() => {
                  setEditingCategory(category);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingCategory(category)} 
              />
            ))}
          </div>
          {filteredCategories.length === 0 && (
            <p className="text-center text-sm text-[#64748B]">No categories match your search.</p>
          )}
          <CategoryPagination />
        </>
      )}

      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {deletingCategory && (
        <CategoryDeleteDialog
          category={deletingCategory}
          loading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}