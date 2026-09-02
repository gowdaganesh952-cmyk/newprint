"use client";

import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="min-w-0 w-full space-y-5 sm:space-y-6 scroll-smooth">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold tracking-tight text-[#0A1B2E] sm:text-2xl">
            Profile Settings
          </h2>

          <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
            Manage your account information.
          </p>
        </div>

        <Link
          href="/"
          className="
            inline-flex min-h-[42px] shrink-0 items-center justify-center
            rounded-[10px] border border-[#E5E7EB] bg-white
            px-3.5 text-sm font-semibold text-[#0A1B2E]
            shadow-sm transition-all duration-200
            hover:border-[#B9954F]
            hover:text-[#B9954F]
            active:scale-[0.97]
            touch-manipulation will-change-transform
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#B9954F]
            focus-visible:ring-offset-2
            sm:min-h-[44px] sm:px-4
          "
        >
          <span className="hidden sm:inline">←&nbsp; Home</span>
          <span className="sm:hidden">Home</span>
        </Link>
      </div>

      <section className="w-full min-w-0 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)]">
        <div className="w-full min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-0 justify-center">
            <UserProfile
              appearance={{
                variables: {
                  colorPrimary: "#0A1B2E",
                  colorBackground: "#FFFFFF",
                  colorText: "#111827",
                  colorTextSecondary: "#64748B",
                  borderRadius: "10px",
                },

                elements: {
                  card: "shadow-none border-none w-full",
                  navbar: "hidden",
                  pageScrollBox: "p-0",
                  headerTitle: "text-[#0A1B2E]",
                  headerSubtitle: "text-[#64748B]",
                  formButtonPrimary:
                    "bg-[#0A1B2E] hover:bg-[#142C46] active:scale-[0.98] touch-manipulation will-change-transform",
                  profileSectionTitleText:
                    "text-[#0A1B2E] font-bold",
                },
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}