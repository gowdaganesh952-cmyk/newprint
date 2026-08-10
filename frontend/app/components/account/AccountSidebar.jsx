"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AccountSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/dashboard" },
    { name: "Orders", href: "/dashboard/orders" },
    { name: "Profile", href: "/dashboard/profile" },
    { name: "Addresses", href: "/dashboard/addresses" },
  ];

  return (
    <nav className="flex overflow-x-auto whitespace-nowrap lg:flex-col lg:overflow-visible no-scrollbar space-x-2 lg:space-x-0 lg:space-y-2 border-b border-[#E5E7EB] lg:border-none pb-2 lg:pb-0">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`rounded-[10px] px-4 py-3 text-sm font-medium transition-all duration-200 inline-block lg:block ${
              isActive
                ? "bg-[#0A1B2E] text-white shadow-sm"
                : "text-[#64748B] hover:bg-[#E5E7EB] hover:text-[#0A1B2E]"
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}