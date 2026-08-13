import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-[100svh] bg-[#F7F7F5] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center justify-center sm:min-h-[calc(100svh-6rem)]">
        <div className="w-full">
          {/* =====================================================
              BRAND / HEADER
          ===================================================== */}
          <div className="mb-6 text-center sm:mb-7">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="h-[2px] w-6 bg-[#B9954F]" />

              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F] sm:text-[10px]">
                New Print
              </span>

              <span className="h-[2px] w-6 bg-[#B9954F]" />
            </div>

            <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#0A1B2E] sm:text-3xl">
              Welcome back
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-5 text-[#64748B] sm:text-sm">
              Sign in to continue to your account.
            </p>
          </div>

          {/* =====================================================
              CLERK SIGN IN
          ===================================================== */}
          <div className="flex w-full justify-center">
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                variables: {
                  colorPrimary: "#0A1B2E",
                  colorBackground: "#FFFFFF",
                  colorText: "#0A1B2E",
                  colorTextSecondary: "#64748B",
                  colorInputBackground: "#FFFFFF",
                  colorInputText: "#0A1B2E",
                  borderRadius: "10px",
                  fontFamily:
                    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                },

                elements: {
                  rootBox:
                    "w-full flex justify-center",

                  card:
                    "w-full max-w-md border border-[#E5E7EB] bg-white shadow-[0_12px_35px_-20px_rgba(10,27,46,0.25)] rounded-[12px] p-1",

                  header:
                    "px-2 pt-2 sm:px-3",

                  headerTitle:
                    "text-[#0A1B2E] font-extrabold tracking-[-0.02em]",

                  headerSubtitle:
                    "text-[#64748B]",

                  form:
                    "px-1 sm:px-2",

                  formFieldLabel:
                    "text-[#0A1B2E] font-semibold",

                  formFieldInput:
                    "h-11 rounded-[9px] border-[#D8DDE3] bg-white text-[#0A1B2E] shadow-none transition-colors duration-200 focus:border-[#B9954F] focus:ring-1 focus:ring-[#B9954F]",

                  formButtonPrimary:
                    "min-h-11 rounded-[9px] bg-[#0A1B2E] text-sm font-semibold shadow-sm transition-colors duration-200 hover:bg-[#142C46] active:bg-[#081827]",

                  footer:
                    "border-t border-[#E5E7EB] bg-[#F7F7F5] rounded-b-[10px]",

                  footerActionLink:
                    "font-semibold text-[#0A1B2E] transition-colors duration-200 hover:text-[#B9954F]",

                  identityPreviewEditButton:
                    "text-[#0A1B2E] hover:text-[#B9954F]",

                  otpCodeFieldInput:
                    "border-[#D8DDE3] text-[#0A1B2E] focus:border-[#B9954F] focus:ring-[#B9954F]",

                  formFieldAction:
                    "text-[#0A1B2E] hover:text-[#B9954F]",

                  alert:
                    "rounded-[9px] border border-[#E5E7EB]",

                  socialButtonsBlockButton:
                    "min-h-11 rounded-[9px] border border-[#D8DDE3] bg-white text-[#0A1B2E] shadow-none transition-colors duration-200 hover:bg-[#F7F7F5]",

                  socialButtonsBlockButtonText:
                    "font-semibold text-[#0A1B2E]",

                  dividerLine:
                    "bg-[#E5E7EB]",

                  dividerText:
                    "text-[#94A3B8]",
                },
              }}
            />
          </div>

          {/* =====================================================
              BOTTOM BRAND DETAIL
          ===================================================== */}
          <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-[#94A3B8]">
            Custom printing made simple
          </p>
        </div>
      </div>
    </main>
  );
}