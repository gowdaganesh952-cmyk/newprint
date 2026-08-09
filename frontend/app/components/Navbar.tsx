"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton, useUser } from "@clerk/nextjs";

const navLinks = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Services",
    href: "/services",
  },
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const { user } = useUser();

  const dashboardPath =
    user?.publicMetadata?.role === "admin"
      ? "/admin"
      : "/dashboard";

  /* =========================================================
     SCROLL EFFECT (Optimized with requestAnimationFrame)
  ========================================================= */
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll(); // Check initial state

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* =========================================================
     PREVENT BODY SCROLL WHEN MOBILE MENU IS OPEN
  ========================================================= */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* =========================================================
     CLOSE MOBILE MENU WHEN ROUTE CHANGES
  ========================================================= */
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  /* =========================================================
     ESCAPE KEY CLOSE
  ========================================================= */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  /* =========================================================
     ACTIVE LINK
  ========================================================= */
  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  return (
    <header
      className={`
        fixed
        inset-x-0
        top-0
        z-50
        w-full
        border-b
        transition-all
        duration-300
        ${
          isScrolled
            ? "border-[#E5E7EB] bg-white/95 shadow-sm backdrop-blur-md"
            : "border-transparent bg-white"
        }
      `}
    >
      {/* =======================================================
          MAIN NAVBAR
      ======================================================= */}
      <div
        className="
          mx-auto
          flex
          h-[68px]
          w-full
          max-w-7xl
          items-center
          justify-between
          px-4
          sm:px-6
          lg:h-[76px]
          lg:px-8
        "
      >
        {/* =====================================================
            LOGO
        ===================================================== */}
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="
            flex
            shrink-0
            items-center
          "
          aria-label="New Print home"
        >
          <span
            className="
              whitespace-nowrap
              text-[19px]
              font-extrabold
              tracking-[-0.025em]
              text-[#0A1B2E]
              sm:text-[21px]
              lg:text-[23px]
            "
          >
            NEW{" "}
            <span className="text-[#B9954F]">
              PRINT
            </span>
          </span>
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ===================================================== */}
        <div className="hidden items-center md:flex">
          <nav
            className="
              flex
              items-center
              gap-7
              lg:gap-9
            "
            aria-label="Desktop navigation"
          >
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative
                    py-2
                    text-[14px]
                    font-medium
                    transition-colors
                    duration-200
                    ${
                      active
                        ? "text-[#0A1B2E]"
                        : "text-[#64748B] hover:text-[#0A1B2E]"
                    }
                  `}
                >
                  {link.name}

                  {/* Active indicator */}
                  <span
                    className={`
                      absolute
                      bottom-0
                      left-0
                      h-[2px]
                      rounded-full
                      bg-[#B9954F]
                      transition-all
                      duration-200
                      ${
                        active
                          ? "w-full"
                          : "w-0"
                      }
                    `}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ===================================================
              CLERK AUTH - DESKTOP
          =================================================== */}
          <div className="ml-8 flex items-center">
            {/* -------------------------------------------------
                LOGGED OUT
                Login intentionally opens SIGN UP
            ------------------------------------------------- */}
            <Show when="signed-out">
              <Link
                href="/sign-up"
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  rounded-[9px]
                  bg-[#0A1B2E]
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  duration-200
                  hover:bg-[#142C46]
                  hover:shadow
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#B9954F]
                  focus-visible:ring-offset-2
                "
              >
                Login
              </Link>
            </Show>

            {/* -------------------------------------------------
                LOGGED IN
            ------------------------------------------------- */}
            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardPath}
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    rounded-[9px]
                    bg-[#0A1B2E]
                    px-5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition-all
                    duration-200
                    hover:bg-[#142C46]
                    hover:shadow
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]
                    focus-visible:ring-offset-2
                  "
                >
                  Dashboard
                </Link>

                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "h-9 w-9 ring-1 ring-[#E5E7EB]",
                    },
                  }}
                />
              </div>
            </Show>
          </div>
        </div>

        {/* =====================================================
            MOBILE MENU BUTTON
        ===================================================== */}
        <button
          type="button"
          onClick={() =>
            setIsOpen((previous) => !previous)
          }
          className="
            inline-flex
            h-11
            w-11
            items-center
            justify-center
            rounded-[9px]
            text-[#0A1B2E]
            transition-colors
            duration-200
            hover:bg-[#F7F7F5]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#B9954F]
            md:hidden
          "
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={
            isOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
        >
          {isOpen ? (
            /* Close */
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 6L18 18" />
              <path d="M18 6L6 18" />
            </svg>
          ) : (
            /* Hamburger */
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7H20" />
              <path d="M4 12H20" />
              <path d="M4 17H20" />
            </svg>
          )}
        </button>
      </div>

      {/* =======================================================
          MOBILE NAVIGATION (Optimized with CSS Grid transition)
      ======================================================= */}
      <div
        id="mobile-navigation"
        className={`
          grid
          bg-white
          transition-all
          duration-300
          ease-out
          md:hidden
          ${
            isOpen
              ? "grid-rows-[1fr] border-t border-[#E5E7EB] opacity-100"
              : "pointer-events-none grid-rows-[0fr] border-t-0 border-transparent opacity-0"
          }
        `}
      >
        <div className="overflow-hidden">
          <nav
            className="
              mx-auto
              w-full
              max-w-7xl
              px-4
              pb-5
              pt-3
              sm:px-6
            "
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col">
              {/* =================================================
                  MOBILE LINKS
              ================================================= */}
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex
                      min-h-[52px]
                      items-center
                      rounded-[9px]
                      px-4
                      text-[16px]
                      font-medium
                      transition-colors
                      duration-200
                      ${
                        active
                          ? "bg-[#F7F7F5] text-[#0A1B2E]"
                          : "text-[#111827] hover:bg-[#F7F7F5] hover:text-[#0A1B2E]"
                      }
                    `}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* =================================================
                  MOBILE AUTH
              ================================================= */}
              <div
                className="
                  mt-3
                  border-t
                  border-[#E5E7EB]
                  pt-4
                "
              >
                {/* -------------------------------------------------
                    LOGGED OUT
                    Login → SIGN UP
                ------------------------------------------------- */}
                <Show when="signed-out">
                  <Link
                    href="/sign-up"
                    onClick={() => setIsOpen(false)}
                    className="
                      flex
                      min-h-[50px]
                      w-full
                      items-center
                      justify-center
                      rounded-[9px]
                      bg-[#0A1B2E]
                      px-4
                      text-[16px]
                      font-semibold
                      text-white
                      shadow-sm
                      transition-colors
                      duration-200
                      hover:bg-[#142C46]
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#B9954F]
                      focus-visible:ring-offset-2
                    "
                  >
                    Login
                  </Link>
                </Show>

                {/* -------------------------------------------------
                    LOGGED IN
                ------------------------------------------------- */}
                <Show when="signed-in">
                  <div
                    className="
                      flex
                      min-h-[58px]
                      items-center
                      justify-between
                      rounded-[9px]
                      bg-[#F7F7F5]
                      px-4
                    "
                  >
                    <Link
                      href={dashboardPath}
                      onClick={() => setIsOpen(false)}
                      className="
                        text-sm
                        font-semibold
                        text-[#0A1B2E]
                        hover:text-[#B9954F]
                      "
                    >
                      Dashboard
                    </Link>

                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox:
                            "h-9 w-9 ring-1 ring-[#E5E7EB]",
                        },
                      }}
                    />
                  </div>
                </Show>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}