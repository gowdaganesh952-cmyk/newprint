"use client";

import { usePathname } from "next/navigation";

interface AdminMobileHeaderProps {
  onMenuClick: () => void;
}

export default function AdminMobileHeader({
  onMenuClick,
}: AdminMobileHeaderProps) {
  const pathname = usePathname();

  const formatRouteName = (path: string) => {
    if (path === "/admin") return "Dashboard";
    if (path === "/admin/categories") return "Categories";
    if (path === "/admin/products") return "Products";

    const segment = path.split("/").filter(Boolean).pop();

    if (!segment) return "";

    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#E5E7EB] bg-white px-4 md:hidden">

      {/* Menu Button */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open sidebar"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#0A1B2E] hover:bg-[#F7F7F5] focus:outline-none focus:ring-2 focus:ring-[#B9954F]"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Logo */}
      <span className="text-[19px] font-extrabold tracking-[-0.025em] text-[#0A1B2E]">
        NEW <span className="text-[#B9954F]">PRINT</span>
      </span>

      {/* Page Name */}
      <div className="text-sm font-medium text-[#64748B]">
        {formatRouteName(pathname)}
      </div>

    </div>
  );
}