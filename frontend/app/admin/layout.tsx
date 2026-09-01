import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminLayoutShell from "./AdminLayoutShell";

export default async function AdminLayout({ children }) {
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  // ============================================================
  // CURRENT USER
  // ============================================================

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // ============================================================
  // ADMIN ONLY
  // ============================================================

  if (user.publicMetadata?.role !== "admin") {
    redirect("/dashboard");
  }

  // ============================================================
  // ADMIN APP
  // ============================================================

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}