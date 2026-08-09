// frontend/app/dashboard/page.jsx

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isAuthenticated, userId } = await auth();

  // Not authenticated
  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  /*
   * =========================================================
   * ADMIN
   * =========================================================
   *
   * Admin role is manually assigned in Clerk Public Metadata.
   * NEVER overwrite it.
   */
  if (role === "admin") {
    redirect("/admin");
  }

  /*
   * =========================================================
   * USER
   * =========================================================
   *
   * If the user already has role=user:
   * simply stay on the dashboard.
   */
  if (role === "user") {
    return (
      <main className="min-h-screen bg-[#F7F7F5] px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#B9954F]">
            New Print
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
            My Dashboard
          </h1>

          <p className="mt-2 text-[#64748B]">
            Welcome to New Print.
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * ROLE MISSING / INVALID
   * =========================================================
   *
   * Any role other than "admin" or "user" becomes "user".
   *
   * IMPORTANT:
   * We create the Clerk client first.
   */
  const client = await clerkClient();

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: "user",
    },
  });

  /*
   * After assigning the default role,
   * the user is a normal user.
   */
  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#B9954F]">
          New Print
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-[#0A1B2E]">
          My Dashboard
        </h1>

        <p className="mt-2 text-[#64748B]">
          Welcome to New Print.
        </p>
      </div>
    </main>
  );
}
