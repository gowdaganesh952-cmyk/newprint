import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-[100svh] bg-[#F7F7F5] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[430px] items-center justify-center sm:min-h-[calc(100svh-5rem)]">
        <div className="w-full">
          {/* =====================================================
              BRAND
          ===================================================== */}

          <div className="mb-5 text-center sm:mb-6">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="h-px w-5 bg-[#B9954F] sm:w-6" />

              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F]">
                New Print
              </span>

              <span className="h-px w-5 bg-[#B9954F] sm:w-6" />
            </div>

            <h1 className="text-[27px] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#0A1B2E] sm:text-[30px]">
              Welcome back
            </h1>

            <p className="mx-auto mt-2 max-w-[290px] text-[13px] leading-5 text-[#64748B] sm:text-sm">
              Sign in to continue to your New Print account.
            </p>
          </div>

          {/* =====================================================
              CLERK
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
                  colorDanger: "#B42318",
                  borderRadius: "10px",
                  fontFamily:
                    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                },

                elements: {
                  /* Container */
                  rootBox:
                    "w-full flex justify-center",

                  card:
                    "w-full max-w-[430px] overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white p-1 shadow-[0_14px_40px_-24px_rgba(10,27,46,0.32)] sm:rounded-[13px]",

                  /* Header */
                  header:
                    "px-2 pt-2 sm:px-3 sm:pt-3",

                  headerTitle:
                    "text-[#0A1B2E] font-extrabold tracking-[-0.02em]",

                  headerSubtitle:
                    "text-[#64748B]",

                  /* Form */
                  form:
                    "px-1 sm:px-2",

                  formFieldLabel:
                    "text-[#0A1B2E] font-semibold",

                  formFieldInput:
                    "h-11 rounded-[9px] border-[#D8DDE3] bg-white px-3 text-[14px] text-[#0A1B2E] shadow-none transition-[border-color,box-shadow] duration-150 focus:border-[#B9954F] focus:ring-1 focus:ring-[#B9954F] sm:h-11",

                  formButtonPrimary:
                    "min-h-11 rounded-[9px] bg-[#0A1B2E] text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[#142C46] active:scale-[0.99] active:bg-[#081827]",

                  /* Links / actions */
                  formFieldAction:
                    "text-[#0A1B2E] font-semibold hover:text-[#B9954F]",

                  footerActionLink:
                    "font-semibold text-[#0A1B2E] hover:text-[#B9954F]",

                  identityPreviewEditButton:
                    "text-[#0A1B2E] hover:text-[#B9954F]",

                  /* OTP */
                  otpCodeFieldInput:
                    "border-[#D8DDE3] text-[#0A1B2E] focus:border-[#B9954F] focus:ring-[#B9954F]",

                  /* Footer */
                  footer:
                    "border-t border-[#E5E7EB] rounded-b-[10px] bg-[#F7F7F5]",

                  /* Alerts */
                  alert:
                    "rounded-[9px] border border-[#E5E7EB]",

                  /* Social login */
                  socialButtonsBlockButton:
                    "min-h-11 rounded-[9px] border border-[#D8DDE3] bg-white text-[#0A1B2E] shadow-none transition-[background-color,border-color] duration-150 hover:border-[#C8CDD4] hover:bg-[#F7F7F5]",

                  socialButtonsBlockButtonText:
                    "font-semibold text-[#0A1B2E]",

                  /* Divider */
                  dividerLine:
                    "bg-[#E5E7EB]",

                  dividerText:
                    "text-[#94A3B8]",

                  /* General */
                  formResendCodeLink:
                    "font-semibold text-[#0A1B2E] hover:text-[#B9954F]",
                },
              }}
            />
          </div>

          {/* =====================================================
              BRAND FOOTER
          ===================================================== */}

          <p className="mt-5 text-center text-[9px] font-medium uppercase tracking-[0.14em] text-[#94A3B8] sm:mt-6 sm:text-[10px]">
            Custom printing made simple
          </p>
        </div>
      </div>
    </main>
  );
}