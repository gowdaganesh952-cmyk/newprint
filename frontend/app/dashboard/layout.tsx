import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AccountSidebar from "../components/account/AccountSidebar";

export default async function DashboardLayout({ children }) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  if (role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#F7F7F5] text-[#0A1B2E]">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <header className="mb-5 sm:mb-7">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-3xl">
                My Account
              </h1>

              <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
                Manage your orders and account.
              </p>
            </div>

            <Link
              href="/"
              prefetch={false}
              className="inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-sm font-semibold text-[#0A1B2E] shadow-sm transition-[border-color,color,transform] duration-150 hover:border-[#B9954F] hover:text-[#B9954F] active:scale-[0.97] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2 sm:min-h-[44px] sm:px-4"
            >
              <span className="hidden sm:inline">←&nbsp;</span>
              Home
            </Link>
          </div>
        </header>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-7">
          <aside className="min-w-0 lg:sticky lg:top-5 lg:h-fit">
            <div className="w-full overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white p-2 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-2.5 lg:p-3">
              <AccountSidebar />
            </div>
          </aside>

          <main className="min-w-0 w-full pb-8 sm:pb-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}