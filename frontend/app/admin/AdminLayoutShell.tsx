"use client";

import { useCallback, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminMobileHeader from "./AdminMobileHeader";

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#F7F7F5] text-[#0A1B2E] scroll-smooth">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <AdminMobileHeader
        onMenuClick={openSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <main className="min-w-0 flex-1 p-4 pb-12 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}