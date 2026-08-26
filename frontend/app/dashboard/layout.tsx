import type { ReactNode } from "react";
import Link from "next/link";
import AccountSidebar from "../components/account/AccountSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#F7F7F5] text-[#0A1B2E]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-[88px] sm:px-6 sm:pt-[96px] lg:px-8 lg:pb-14">
        {/* Header */}

        <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#B9954F]">
              Account
            </p>

            <h1 className="mt-1 truncate text-2xl font-extrabold tracking-[-0.025em] text-[#0A1B2E] sm:text-3xl">
              My Dashboard
            </h1>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-sm font-semibold text-[#0A1B2E] shadow-sm transition-all duration-150 hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 sm:px-4"
          >
            <span className="hidden sm:inline">
              ← Back to Home
            </span>

            <span className="sm:hidden">
              Home
            </span>
          </Link>
        </div>

        {/* Dashboard */}

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <aside className="min-w-0 lg:sticky lg:top-[96px] lg:self-start">
            <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-2 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] lg:p-2.5">
              <AccountSidebar />
            </div>
          </aside>

          <section className="min-w-0 overflow-visible">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}