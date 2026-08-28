"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@clerk/nextjs";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navGroups = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/admin" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { name: "Categories", href: "/admin/categories" },
      { name: "Products", href: "/admin/products" },
    ],
  },
  {
    title: "Sales",
    items: [
      { name: "Orders", href: "/admin/orders" },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "#", disabled: true },
    ],
  },
];

export default function AdminSidebar({
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const SidebarContent = (
    <div className="flex h-full flex-col bg-[#0A1B2E] text-white">
      {/* Logo */}
      <div className="flex h-[68px] shrink-0 items-center px-6 lg:h-[76px]">
        <Link href="/admin" onClick={onClose} className="text-[21px] font-extrabold tracking-[-0.025em]">
          NEW <span className="text-[#B9954F]">PRINT</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
        <nav className="flex-1 space-y-7">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                {group.title}
              </h3>

              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                  if (item.disabled) {
                    return (
                      <div
                        key={item.name}
                        className="flex cursor-not-allowed items-center rounded-lg px-3 py-2 text-sm font-medium text-white/30"
                        title="Coming Soon"
                      >
                        {item.name}
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-[#B9954F]/50">
                          Soon
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`relative flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 touch-manipulation active:scale-[0.98] ${
                        isActive
                          ? "bg-[#142C46] text-white shadow-sm"
                          : "text-white/70 hover:bg-[#142C46] hover:text-white"
                      }`}
                    >
                      {item.name}

                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-0 h-full w-1 rounded-r bg-[#B9954F]"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-1 ring-white/20",
              },
            }}
          />

          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin Portal</span>
            <Link
              href="/"
              onClick={onClose}
              className="text-xs text-[#B9954F] hover:underline"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 hidden w-64 flex-col md:flex">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-[#0A1B2E]/80 backdrop-blur-sm md:hidden"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                bounce: 0,
                duration: 0.25,
              }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden shadow-2xl"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}