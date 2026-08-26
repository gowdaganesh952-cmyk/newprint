"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AccountLink {
  name: string;
  href: string;
}

const links: AccountLink[] = [
  {
    name: "Overview",
    href: "/dashboard",
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
  },
  {
    name: "Addresses",
    href: "/dashboard/addresses",
  },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  return (
    <nav
      aria-label="Account navigation"
      className="w-full min-w-0"
    >
      {/* Mobile */}

      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:hidden">
        <div className="flex w-max min-w-full gap-2">
          {links.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] px-4 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 ${
                  active
                    ? "bg-[#0A1B2E] text-white shadow-sm"
                    : "border border-[#E5E7EB] bg-white text-[#64748B] active:bg-[#F7F7F5] active:text-[#0A1B2E]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop */}

      <div className="hidden md:block">
        <div className="space-y-1.5">
          {links.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={`flex min-h-[46px] w-full items-center rounded-[10px] px-4 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 ${
                  active
                    ? "bg-[#0A1B2E] text-white shadow-sm"
                    : "text-[#64748B] hover:bg-[#F7F7F5] hover:text-[#0A1B2E]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}