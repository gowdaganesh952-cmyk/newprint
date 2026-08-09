"use client";

interface CategoryControlsProps {
  onAdd: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: "all" | "active" | "inactive";
  setStatusFilter: (val: "all" | "active" | "inactive") => void;
}

export default function CategoryControls({ 
  onAdd, 
  searchQuery, 
  setSearchQuery,
  statusFilter,
  setStatusFilter
}: CategoryControlsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search and Filter: Stack on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-xs rounded-[9px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm placeholder-[#64748B] shadow-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="w-full sm:w-auto rounded-[9px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0A1B2E] shadow-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      
      {/* Add Button: Full width on mobile, auto width on sm+ */}
      <button
        onClick={onAdd}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-[9px] bg-[#0A1B2E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#142C46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2"
      >
        Add Category
      </button>
    </div>
  );
}