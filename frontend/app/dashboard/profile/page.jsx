import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#0A1B2E]">Profile Settings</h2>
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-0 sm:p-4 shadow-sm overflow-hidden flex justify-center">
        {/* Clerk's highly capable UserProfile handles Name/Email correctly and securely */}
        <UserProfile 
          appearance={{
            variables: {
              colorPrimary: "#0A1B2E",
              colorBackground: "#FFFFFF",
              colorText: "#111827",
              colorTextSecondary: "#64748B",
              borderRadius: "9px",
            },
            elements: {
              card: "shadow-none border-none", 
              navbar: "hidden", 
              pageScrollBox: "p-0",
              headerTitle: "text-[#0A1B2E]",
              headerSubtitle: "text-[#64748B]",
              formButtonPrimary: "bg-[#0A1B2E] hover:bg-[#142C46]",
              profileSectionTitleText: "text-[#0A1B2E] font-bold"
            }
          }}
        />
      </div>
    </div>
  );
}