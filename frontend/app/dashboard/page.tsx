import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isAuthenticated, userId } = await auth();

  // ------------------------------------------------------------
  // NOT AUTHENTICATED
  // ------------------------------------------------------------

  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  // ------------------------------------------------------------
  // GET CURRENT USER
  // ------------------------------------------------------------

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  // ------------------------------------------------------------
  // ADMIN
  //
  // Admin role is manually assigned in Clerk.
  // Never overwrite it here.
  // ------------------------------------------------------------

  if (role === "admin") {
    redirect("/admin");
  }

  // ------------------------------------------------------------
  // NORMAL USER
  // ------------------------------------------------------------

  if (role === "user") {
    return (
      <UserDashboardHome user={user} />
    );
  }

  // ------------------------------------------------------------
  // FIRST LOGIN
  //
  // No role exists.
  //
  // Assign user role from the server.
  // publicMetadata cannot safely be assigned from the browser.
  // ------------------------------------------------------------

  try {
    const client = await clerkClient();

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "user",
      },
    });
  } catch (error) {
    console.error("Failed to assign default user role:", error);

    // Do not expose Clerk/backend details to the user.
    // Keep them authenticated but stop here rather than
    // accidentally treating them as admin.
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[14px] border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-extrabold text-[#0A1B2E]">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            We couldn't finish setting up your account. Please refresh the
            page and try again.
          </p>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // FIRST LOGIN IS NOW A USER
  // ------------------------------------------------------------

  return (
    <UserDashboardHome user={user} />
  );
}


// ============================================================
// USER DASHBOARD HOME
// ============================================================

function UserDashboardHome({ user }) {
  const firstName =
    user.firstName ||
    user.username ||
    user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Welcome */}
      <section>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F] sm:text-xs">
          My Account
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-[#0A1B2E] sm:text-3xl">
          Welcome, {firstName}
        </h1>

        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
          Manage your orders and account from here.
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <a
          href="/dashboard/orders"
          className="group rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#B9954F] hover:shadow-md active:scale-[0.99]"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748B]">
            Orders
          </p>

          <h2 className="mt-2 text-lg font-extrabold text-[#0A1B2E]">
            My Orders
          </h2>

          <p className="mt-1 text-sm leading-5 text-[#64748B]">
            View your orders and track deliveries.
          </p>

          <span className="mt-4 inline-block text-xs font-bold text-[#B9954F]">
            View orders →
          </span>
        </a>

        <a
          href="/"
          className="group rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#B9954F] hover:shadow-md active:scale-[0.99]"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748B]">
            Shopping
          </p>

          <h2 className="mt-2 text-lg font-extrabold text-[#0A1B2E]">
            Continue Shopping
          </h2>

          <p className="mt-1 text-sm leading-5 text-[#64748B]">
            Browse products and create your next order.
          </p>

          <span className="mt-4 inline-block text-xs font-bold text-[#B9954F]">
            Shop now →
          </span>
        </a>
      </section>
    </div>
  );
}