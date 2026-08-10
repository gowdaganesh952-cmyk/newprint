import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AccountSidebar from "../components/account/AccountSidebar";

export default async function DashboardLayout({ children }) {
  const { isAuthenticated, userId } = await auth();

  // Route protection
  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  let role = user.publicMetadata?.role;

  // Protect Admin override
  if (role === "admin") {
    redirect("/admin");
  }

  // Set default role for new users
  if (!role || role !== "user") {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "user",
      },
    });
    role = "user";
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        
        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#B9954F]">
            New Print
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
            My Account
          </h1>
        </header>

        <div className="flex flex-col lg:flex-row lg:gap-10">
          <aside className="w-full lg:w-64 shrink-0 mb-6 lg:mb-0">
            <AccountSidebar />
          </aside>
          
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>

      </div>
    </main>
  );
}