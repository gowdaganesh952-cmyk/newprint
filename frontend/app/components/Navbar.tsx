"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton, useUser } from "@clerk/nextjs";
import { useCart } from "./cart/CartProvider";

// ============================================================
// NAVIGATION
// ============================================================

const navLinks = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Products",
    href: "/products",
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

// ============================================================
// CART ICON
// ============================================================

function CartIcon({ mobile = false }: { mobile?: boolean }) {
  return (
    <svg
      width={mobile ? 22 : 23}
      height={mobile ? 22 : 23}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

// ============================================================
// MENU ICON
// ============================================================

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="23"
        height="23"
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
    );
  }

  return (
    <svg
      width="23"
      height="23"
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
  );
}

// ============================================================
// NAVBAR
// ============================================================

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const { user } = useUser();
  const { itemCount, isInitializing } = useCart();

  const dashboardPath =
    user?.publicMetadata?.role === "admin"
      ? "/admin"
      : "/dashboard";

  // ==========================================================
  // SCROLL STATE
  // ==========================================================

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 12);
        ticking = false;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ==========================================================
  // LOCK BODY WHEN MOBILE MENU OPEN
  // ==========================================================

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // ==========================================================
  // CLOSE MENU ON ROUTE CHANGE
  // ==========================================================

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ==========================================================
  // ESCAPE KEY
  // ==========================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // ==========================================================
  // ACTIVE LINK
  // ==========================================================

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // ==========================================================
  // CLOSE MENU
  // ==========================================================

  const closeMenu = () => {
    setIsOpen(false);
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
        bg-white
        transition-[box-shadow,border-color]
        duration-200
        ${
          isScrolled
            ? "border-[#E5E7EB] shadow-[0_4px_20px_-14px_rgba(10,27,46,0.35)]"
            : "border-transparent"
        }
      `}
    >
      {/* ======================================================
          MAIN BAR
      ====================================================== */}

      <div
        className="
          mx-auto
          flex
          h-[66px]
          w-full
          max-w-7xl
          items-center
          justify-between
          px-4
          sm:h-[70px]
          sm:px-6
          lg:h-[76px]
          lg:px-8
        "
      >
        {/* ====================================================
            LOGO
        ==================================================== */}

        <Link
          href="/"
          onClick={closeMenu}
          className="
            flex
            shrink-0
            items-center
            rounded-[6px]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#B9954F]
            focus-visible:ring-offset-2
          "
          aria-label="New Print home"
        >
          <span
            className="
              whitespace-nowrap
              text-[18px]
              font-extrabold
              tracking-[-0.025em]
              text-[#0A1B2E]
              sm:text-[20px]
              lg:text-[23px]
            "
          >
            NEW{" "}
            <span className="text-[#B9954F]">
              PRINT
            </span>
          </span>
        </Link>

        {/* ====================================================
            DESKTOP NAVIGATION
        ==================================================== */}

        <div className="hidden items-center md:flex">
          <nav
            className="flex items-center gap-6 lg:gap-8"
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
                    rounded-[4px]
                    py-2
                    text-[14px]
                    font-medium
                    transition-colors
                    duration-150
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]
                    ${
                      active
                        ? "text-[#0A1B2E]"
                        : "text-[#64748B] hover:text-[#0A1B2E]"
                    }
                  `}
                >
                  {link.name}

                  <span
                    className={`
                      absolute
                      bottom-0
                      left-0
                      h-[2px]
                      rounded-full
                      bg-[#B9954F]
                      transition-[width]
                      duration-150
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

          {/* ==================================================
              DESKTOP ACTIONS
          ================================================== */}

          <div className="ml-7 flex items-center gap-3 lg:ml-8 lg:gap-4">
            {/* Cart */}

            <Link
              href="/cart"
              className="
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-[9px]
                text-[#0A1B2E]
                transition-colors
                duration-150
                hover:bg-[#F7F7F5]
                hover:text-[#B9954F]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#B9954F]
              "
              aria-label={
                itemCount > 0
                  ? `View cart with ${itemCount} items`
                  : "View cart"
              }
            >
              <CartIcon />

              {!isInitializing && itemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#B9954F] px-1 text-[9px] font-extrabold leading-none text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Signed out */}

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
                  transition-colors
                  duration-150
                  hover:bg-[#142C46]
                  active:bg-[#081827]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#B9954F]
                  focus-visible:ring-offset-2
                "
              >
                Login
              </Link>
            </Show>

            {/* Signed in */}

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
                    transition-colors
                    duration-150
                    hover:bg-[#142C46]
                    active:bg-[#081827]
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

        {/* ====================================================
            MOBILE ACTIONS
        ==================================================== */}

        <div className="flex items-center gap-1 md:hidden">
          {/* Mobile cart */}

          <Link
            href="/cart"
            className="
              relative
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-[9px]
              text-[#0A1B2E]
              transition-colors
              duration-150
              active:bg-[#F7F7F5]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#B9954F]
            "
            aria-label={
              itemCount > 0
                ? `View cart with ${itemCount} items`
                : "View cart"
            }
          >
            <CartIcon mobile />

            {!isInitializing && itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#B9954F] px-1 text-[9px] font-extrabold leading-none text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {/* Mobile menu */}

          <button
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-[9px]
              text-[#0A1B2E]
              transition-colors
              duration-150
              active:bg-[#F7F7F5]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#B9954F]
            "
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
          >
            <MenuIcon open={isOpen} />
          </button>
        </div>
      </div>

      {/* ======================================================
          MOBILE NAVIGATION
      ====================================================== */}

      {isOpen && (
        <div
          id="mobile-navigation"
          className="
            border-t
            border-[#E5E7EB]
            bg-white
            md:hidden
          "
        >
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
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`
                      flex
                      min-h-[50px]
                      items-center
                      rounded-[9px]
                      px-4
                      text-[15px]
                      font-medium
                      transition-colors
                      duration-150
                      ${
                        active
                          ? "bg-[#F7F7F5] font-semibold text-[#0A1B2E]"
                          : "text-[#334155] active:bg-[#F7F7F5]"
                      }
                    `}
                  >
                    <span
                      className={`
                        mr-3
                        h-1.5
                        w-1.5
                        rounded-full
                        ${
                          active
                            ? "bg-[#B9954F]"
                            : "bg-transparent"
                        }
                      `}
                    />

                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* ==================================================
                MOBILE ACCOUNT AREA
            ================================================== */}

            <div className="mt-3 border-t border-[#E5E7EB] pt-4">
              <Show when="signed-out">
                <Link
                  href="/sign-up"
                  onClick={closeMenu}
                  className="
                    flex
                    min-h-[50px]
                    w-full
                    items-center
                    justify-center
                    rounded-[9px]
                    bg-[#0A1B2E]
                    px-4
                    text-[15px]
                    font-semibold
                    text-white
                    shadow-sm
                    transition-colors
                    duration-150
                    active:bg-[#081827]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]
                    focus-visible:ring-offset-2
                  "
                >
                  Login
                </Link>
              </Show>

              <Show when="signed-in">
                <div className="flex min-h-[58px] items-center justify-between rounded-[9px] bg-[#F7F7F5] px-4">
                  <Link
                    href={dashboardPath}
                    onClick={closeMenu}
                    className="text-sm font-semibold text-[#0A1B2E] transition-colors duration-150 hover:text-[#B9954F]"
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
          </nav>
        </div>
      )}
    </header>
  );
}