"use client";

export default function CategoryEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[9px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F7F5]">
        <svg className="h-6 w-6 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#0A1B2E]">No categories found</h3>
      <p className="mt-1 text-sm text-[#64748B]">Get started by adding a new category.</p>
      <div className="mt-6">
        <button
          onClick={onAdd}
          className="inline-flex items-center rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#142C46]"
        >
          Add Category
        </button>
      </div>
    </div>
  );
}