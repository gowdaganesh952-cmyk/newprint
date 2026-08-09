"use client";

import { Category } from "./types";

interface CategoryCardProps {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[9px] border border-[#E5E7EB] bg-white shadow-sm transition-shadow hover:shadow-md">
      {category.image && (
        <div className="h-32 w-full bg-gray-100">
          <img 
            src={category.image} 
            alt={category.name} 
            className="h-full w-full object-cover" 
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Added overflow-hidden to prevent long names from pushing the status badge off-screen */}
          <div className="overflow-hidden">
            <h3 className="font-semibold text-[#0A1B2E] truncate">{category.name}</h3>
            <p className="text-xs text-[#64748B] truncate">/{category.slug}</p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              category.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-[#64748B]"
            }`}
          >
            {category.status}
          </span>
        </div>
        
        {category.description && (
          <p className="mt-2 line-clamp-2 text-sm text-[#64748B]">
            {category.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-sm font-medium text-[#0A1B2E] hover:text-[#B9954F]"
            >
              Edit
            </button>
            <span className="text-[#E5E7EB]">|</span>
            <button
              onClick={onDelete}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}