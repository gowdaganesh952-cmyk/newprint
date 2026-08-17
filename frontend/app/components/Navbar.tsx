"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Show,
  UserButton,
  useUser,
} from "@clerk/nextjs";
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

function CartIcon({
  mobile = false,
}: {
  mobile?: boolean;
}) {
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

function MenuIcon({
  open,
}: {
  open: boolean;
}) {
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
// ARROW ICON
// ============================================================

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7H17V17" />
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

  const {
    itemCount,
    isInitializing,
  } = useCart();

  const scrollFrameRef = useRef<number | null>(
    null
  );

  const menuOpenRef = useRef(false);

  const dashboardPath =
    user?.publicMetadata?.role === "admin"
      ? "/admin"
      : "/dashboard";

  // ==========================================================
  // SCROLL STATE
  // ==========================================================

  useEffect(() => {
    const updateScrollState = () => {
      scrollFrameRef.current = null;

      const nextScrolled =
        window.scrollY > 12;

      setIsScrolled((previous) => {
        if (previous === nextScrolled) {
          return previous;
        }

        return nextScrolled;
      });
    };

    const handleScroll = () => {
      if (
        scrollFrameRef.current !== null
      ) {
        return;
      }

      scrollFrameRef.current =
        window.requestAnimationFrame(
          updateScrollState
        );
    };

    /*
     * Set the correct initial state immediately.
     */
    updateScrollState();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      if (
        scrollFrameRef.current !== null
      ) {
        window.cancelAnimationFrame(
          scrollFrameRef.current
        );

        scrollFrameRef.current = null;
      }
    };
  }, []);

  // ==========================================================
  // MOBILE MENU SCROLL LOCK
  // ==========================================================

  useEffect(() => {
    menuOpenRef.current = isOpen;

    /*
     * The initial homepage loader also controls these classes.
     *
     * We therefore use classes instead of permanently
     * overwriting the loader's scroll-lock state.
     */
    if (!isOpen) {
      document.documentElement.classList.remove(
        "newprint-menu-open"
      );

      document.body.classList.remove(
        "newprint-menu-open"
      );

      return;
    }

    document.documentElement.classList.add(
      "newprint-menu-open"
    );

    document.body.classList.add(
      "newprint-menu-open"
    );

    return () => {
      document.documentElement.classList.remove(
        "newprint-menu-open"
      );

      document.body.classList.remove(
        "newprint-menu-open"
      );
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
    if (!isOpen) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen]);

  // ==========================================================
  // CLOSE MENU WHEN SCREEN BECOMES DESKTOP
  // ==========================================================

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(min-width: 768px)"
    );

    const handleMediaChange = (
      event: MediaQueryListEvent
    ) => {
      if (event.matches) {
        setIsOpen(false);
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleMediaChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleMediaChange
      );
    };
  }, []);

  // ==========================================================
  // ACTIVE LINK
  // ==========================================================

  const isLinkActive = useCallback(
    (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }

      return (
        pathname === href ||
        pathname.startsWith(`${href}/`)
      );
    },
    [pathname]
  );

  // ==========================================================
  // CLOSE MENU
  // ==========================================================

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ==========================================================
  // TOGGLE MENU
  // ==========================================================

  const toggleMenu = useCallback(() => {
    setIsOpen((previous) => !previous);
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <header
      className={`
        fixed
        inset-x-0
        top-0
        z-[500]
        w-full
        border-b
        bg-white/95
        backdrop-blur-[10px]
        supports-[backdrop-filter]:bg-white/90
        transition-[box-shadow,border-color,background-color]
        duration-200
        ease-out

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
            min-h-[44px]
            shrink-0
            items-center
            rounded-[7px]
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
            className="
              flex
              items-center
              gap-6
              lg:gap-8
            "
            aria-label="Desktop navigation"
          >
            {navLinks.map((link) => {
              const active =
                isLinkActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative
                    flex
                    min-h-[44px]
                    items-center
                    justify-center
                    px-1
                    text-[13px]
                    font-semibold
                    transition-colors
                    duration-150
                    ease-out
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]
                    focus-visible:ring-offset-2

                    ${
                      active
                        ? "text-[#0A1B2E]"
                        : "text-[#64748B] hover:text-[#0A1B2E]"
                    }

                    after:absolute
                    after:bottom-[7px]
                    after:left-1/2
                    after:h-[2px]
                    after:-translate-x-1/2
                    after:rounded-full
                    after:bg-[#B9954F]
                    after:transition-all
                    after:duration-200

                    ${
                      active
                        ? "after:w-5"
                        : "after:w-0 hover:after:w-4"
                    }
                  `}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ====================================================
            DESKTOP ACTIONS
        ==================================================== */}

        <div className="hidden items-center gap-2 md:flex">
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

            {!isInitializing &&
              itemCount > 0 && (
                <span
                  className="
                    absolute
                    right-0
                    top-0
                    flex
                    h-[17px]
                    min-w-[17px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#B9954F]
                    px-1
                    text-[9px]
                    font-extrabold
                    leading-none
                    text-white
                  "
                >
                  {itemCount > 99
                    ? "99+"
                    : itemCount}
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
                transition-[background-color,transform]
                duration-150
                hover:bg-[#142C46]
                active:scale-[0.98]
                active:bg-[#081827]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#B9954F]
                focus-visible:ring-offset-2
              "
            >
              Sign Up
            </Link>

            <Link
              href="/sign-in"
              className="
                inline-flex
                h-10
                items-center
                justify-center
                rounded-[9px]
                border
                border-[#D8DDE3]
                bg-white
                px-5
                text-sm
                font-semibold
                text-[#0A1B2E]
                transition-[background-color,border-color,transform]
                duration-150
                hover:border-[#B9954F]/60
                hover:bg-[#F7F7F5]
                active:scale-[0.98]
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
            <div className="flex items-center gap-2">
              <Link
                href={dashboardPath}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-[9px]
                  bg-[#0A1B2E]
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-[background-color,transform]
                  duration-150
                  hover:bg-[#142C46]
                  active:scale-[0.98]
                  active:bg-[#081827]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#B9954F]
                  focus-visible:ring-offset-2
                "
              >
                Dashboard

                <ArrowIcon />
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

            {!isInitializing &&
              itemCount > 0 && (
                <span
                  className="
                    absolute
                    right-1
                    top-1
                    flex
                    h-[17px]
                    min-w-[17px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#B9954F]
                    px-1
                    text-[9px]
                    font-extrabold
                    leading-none
                    text-white
                  "
                >
                  {itemCount > 99
                    ? "99+"
                    : itemCount}
                </span>
              )}
          </Link>

          {/* Mobile menu */}

          <button
            type="button"
            onClick={toggleMenu}
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

      <div
        id="mobile-navigation"
        className={`
          overflow-hidden
          border-t
          border-[#E5E7EB]
          bg-white
          md:hidden
          transition-[max-height,opacity]
          duration-200
          ease-out
          ${
            isOpen
              ? "max-h-[calc(100dvh-66px)] opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          }
        `}
        aria-hidden={!isOpen}
      >
        <nav
          className="
            mx-auto
            max-h-[calc(100dvh-66px)]
            w-full
            max-w-7xl
            overflow-y-auto
            overscroll-contain
            px-4
            pb-[calc(20px+env(safe-area-inset-bottom))]
            pt-3
            sm:px-6
          "
          aria-label="Mobile navigation"
        >
          {/* ==================================================
              NAV LINKS
          =================================================== */}

          <div className="space-y-1">
            {navLinks.map((link) => {
              const active =
                isLinkActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  tabIndex={isOpen ? 0 : -1}
                  className={`
                    flex
                    min-h-[50px]
                    items-center
                    justify-between
                    rounded-[9px]
                    px-4
                    text-[15px]
                    font-semibold
                    transition-colors
                    duration-150
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]

                    ${
                      active
                        ? "bg-[#F7F7F5] text-[#0A1B2E]"
                        : "text-[#64748B] active:bg-[#F7F7F5] active:text-[#0A1B2E]"
                    }
                  `}
                >
                  <span>
                    {link.name}
                  </span>

                  {active && (
                    <span
                      className="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-[#B9954F]
                      "
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ==================================================
              MOBILE DIVIDER
          =================================================== */}

          <div className="my-4 h-px bg-[#E5E7EB]" />

          {/* ==================================================
              MOBILE AUTH
          =================================================== */}

          <div className="space-y-3">
            <Show when="signed-out">
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/sign-in"
                  onClick={closeMenu}
                  tabIndex={isOpen ? 0 : -1}
                  className="
                    flex
                    min-h-[50px]
                    items-center
                    justify-center
                    rounded-[9px]
                    border
                    border-[#D8DDE3]
                    bg-white
                    px-4
                    text-[14px]
                    font-semibold
                    text-[#0A1B2E]
                    transition-colors
                    duration-150
                    active:bg-[#F7F7F5]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]
                  "
                >
                  Login
                </Link>

                <Link
                  href="/sign-up"
                  onClick={closeMenu}
                  tabIndex={isOpen ? 0 : -1}
                  className="
                    flex
                    min-h-[50px]
                    items-center
                    justify-center
                    rounded-[9px]
                    bg-[#0A1B2E]
                    px-4
                    text-[14px]
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
                  Sign Up
                </Link>
              </div>
            </Show>

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
                  onClick={closeMenu}
                  tabIndex={isOpen ? 0 : -1}
                  className="
                    flex
                    min-h-[44px]
                    items-center
                    text-sm
                    font-semibold
                    text-[#0A1B2E]
                    transition-colors
                    duration-150
                    hover:text-[#B9954F]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#B9954F]
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
        </nav>
      </div>

      {/* ======================================================
          MOBILE MENU CSS
      ====================================================== */}

      
    </header>
  );
}