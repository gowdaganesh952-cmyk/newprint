//path : frontend/app/sign-in/%5B%5B...sign-in%5D%5D/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#B9954F]">
            New Print
          </p>

          <h1 className="mt-2 text-2xl font-extrabold text-[#0A1B2E]">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-[#64748B]">
            Sign in to continue to your account.
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "#0A1B2E",
                colorBackground: "#FFFFFF",
                colorText: "#111827",
                colorTextSecondary: "#64748B",
                borderRadius: "9px",
              },
              elements: {
                card: "border border-[#E5E7EB] shadow-sm",
                headerTitle: "text-[#0A1B2E]",
                headerSubtitle: "text-[#64748B]",
                formButtonPrimary:
                  "bg-[#0A1B2E] hover:bg-[#142C46]",
                footerActionLink:
                  "text-[#0A1B2E] hover:text-[#B9954F]",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}