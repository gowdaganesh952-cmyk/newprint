"use client";

import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
            Profile Settings
          </h2>

          <p className="mt-1 text-sm text-[#64748B]">
            Manage your account information.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-sm font-semibold text-[#0A1B2E] transition-all hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98] sm:px-4"
        >
          <span className="hidden sm:inline">
            ← Home
          </span>

          <span className="sm:hidden">
            Home
          </span>
        </Link>
      </div>

      {/* Clerk Profile */}

      <div className="w-full min-w-0 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
        <div className="w-full overflow-x-auto">
          <div className="flex min-w-0 justify-center">
            <UserProfile
              appearance={{
                variables: {
                  colorPrimary:
                    "#0A1B2E",
                  colorBackground:
                    "#FFFFFF",
                  colorText:
                    "#111827",
                  colorTextSecondary:
                    "#64748B",
                  borderRadius:
                    "10px",
                },

                elements: {
                  card: "shadow-none border-none",
                  navbar: "hidden",
                  pageScrollBox:
                    "p-0",
                  headerTitle:
                    "text-[#0A1B2E]",
                  headerSubtitle:
                    "text-[#64748B]",
                  formButtonPrimary:
                    "bg-[#0A1B2E] hover:bg-[#142C46]",
                  profileSectionTitleText:
                    "text-[#0A1B2E] font-bold",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}