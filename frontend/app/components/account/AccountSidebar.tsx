"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Overview", href: "/dashboard" },
  { name: "Orders", href: "/dashboard/orders" },
  { name: "Profile", href: "/dashboard/profile" },
  { name: "Addresses", href: "/dashboard/addresses" },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account navigation" className="w-full">
      <div
        className="
          flex w-full gap-1.5 overflow-x-auto overscroll-x-contain
          pb-0.5 whitespace-nowrap scroll-smooth
          [-webkit-overflow-scrolling:touch]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          lg:flex-col
          lg:overflow-visible
        "
      >
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));

          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className={[
                "inline-flex min-h-[42px] shrink-0 items-center justify-center",
                "rounded-[10px] px-3.5 py-2.5 text-sm font-semibold",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97] touch-manipulation will-change-transform",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[#B9954F] focus-visible:ring-offset-1",
                "lg:w-full lg:justify-start lg:px-4",
                isActive
                  ? "bg-[#0A1B2E] text-white shadow-sm"
                  : "text-[#64748B] hover:bg-[#F7F7F5] hover:text-[#0A1B2E]",
              ].join(" ")}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}