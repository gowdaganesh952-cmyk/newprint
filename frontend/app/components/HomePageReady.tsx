"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import CoreSpinLoader from "./CoreSpinLoader";

// ============================================================
// TYPES
// ============================================================

interface HomePageReadyProps {
  children: ReactNode;
}

// ============================================================
// SETTINGS
// ============================================================

/*
 * Small delay after everything reports ready.
 * Significantly reduced for a snappy perception.
 */
const FINAL_PAINT_DELAY = 50;

/*
 * Loader fade duration.
 * Keep this matched with duration-300 below.
 */
const LOADER_FADE_DURATION = 300;

/*
 * Emergency fallback only.
 * Reduced from 12s to 8s to prevent long hangs on bad networks.
 */
const SAFETY_TIMEOUT = 8000;

// ============================================================
// COMPONENT
// ============================================================

export default function HomePageReady({
  children,
}: HomePageReadyProps) {
  const [pageReady, setPageReady] = useState(false);
  const [removeLoader, setRemoveLoader] = useState(false);

  const mountedRef = useRef(true);
  const readyStartedRef = useRef(false);

  // ==========================================================
  // COMPLETE PAGE LOADING
  // ==========================================================

  const completePageLoading = useCallback(() => {
    /*
     * Prevent duplicate calls from:
     * - products-ready
     * - window.load
     * - safety timeout
     */
    if (readyStartedRef.current) {
      return;
    }

    readyStartedRef.current = true;

    /*
     * Frame 1:
     * allow React state/layout updates to enter the browser.
     */
    window.requestAnimationFrame(() => {
      /*
       * Frame 2:
       * allow the browser to calculate layout.
       */
      window.requestAnimationFrame(() => {
        /*
         * Small final delay so product cards/images/layout
         * have a chance to visually settle.
         */
        window.setTimeout(() => {
          if (!mountedRef.current) {
            return;
          }

          setPageReady(true);

          /*
           * Remove loader from DOM only AFTER its
           * opacity transition has completed.
           */
          window.setTimeout(() => {
            if (!mountedRef.current) {
              return;
            }

            setRemoveLoader(true);
          }, LOADER_FADE_DURATION);
        }, FINAL_PAINT_DELAY);
      });
    });
  }, []);

  // ==========================================================
  // INITIAL PAGE READINESS
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    let productsReady = false;
    let browserReady = document.readyState === "complete";

    // ========================================================
    // CHECK IF EVERYTHING WE NEED IS READY
    // ========================================================

    const checkReady = () => {
      /*
       * We want BOTH:
       *
       * 1. Browser/document ready
       * 2. Featured Products request finished
       *
       * Only then should the homepage become interactive.
       */

      if (productsReady && browserReady) {
        completePageLoading();
      }
    };

    // ========================================================
    // FEATURED PRODUCTS READY
    // ========================================================

    const handleProductsReady = () => {
      productsReady = true;
      checkReady();
    };

    // ========================================================
    // BROWSER READY
    // ========================================================

    const handleWindowLoad = () => {
      browserReady = true;
      checkReady();
    };

    // ========================================================
    // REGISTER EVENTS
    // ========================================================

    window.addEventListener(
      "newprint:products-ready",
      handleProductsReady
    );

    /*
     * document.readyState can already be "complete"
     * when this component mounts.
     */
    if (!browserReady) {
      window.addEventListener("load", handleWindowLoad, {
        once: true,
      });
    }

    // ========================================================
    // SAFETY FALLBACK
    // ========================================================

    const safetyTimer = window.setTimeout(() => {
      /*
       * This is NOT the normal loading mechanism.
       *
       * It only prevents a broken network request or unusual
       * browser state from trapping the visitor on the loader.
       */
      completePageLoading();
    }, SAFETY_TIMEOUT);

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      mountedRef.current = false;

      window.removeEventListener(
        "newprint:products-ready",
        handleProductsReady
      );

      window.removeEventListener(
        "load",
        handleWindowLoad
      );

      window.clearTimeout(safetyTimer);
    };
  }, [completePageLoading]);

  // ==========================================================
  // LOCK PAGE WHILE LOADING
  // ==========================================================

  useEffect(() => {
    /*
     * Once the page is ready, restore normal scrolling.
     */
    if (pageReady) {
      document.documentElement.classList.remove(
        "newprint-page-loading"
      );

      document.body.classList.remove(
        "newprint-page-loading"
      );

      return;
    }

    /*
     * Save the user's current scroll position.
     *
     * Normally this will be 0 on first load, but preserving it
     * also makes refresh/navigation behavior safer.
     */
    const scrollY = window.scrollY;

    const previousBodyOverflow =
      document.body.style.overflow;

    const previousHtmlOverflow =
      document.documentElement.style.overflow;

    const previousBodyTouchAction =
      document.body.style.touchAction;

    // ========================================================
    // LOCK DESKTOP + MOBILE SCROLL
    // ========================================================

    document.documentElement.classList.add(
      "newprint-page-loading"
    );

    document.body.classList.add(
      "newprint-page-loading"
    );

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    /*
     * Prevent touch scrolling behind the loader.
     */
    document.body.style.touchAction = "none";

    // ========================================================
    // CLEANUP / UNLOCK
    // ========================================================

    return () => {
      document.documentElement.classList.remove(
        "newprint-page-loading"
      );

      document.body.classList.remove(
        "newprint-page-loading"
      );

      document.documentElement.style.overflow =
        previousHtmlOverflow;

      document.body.style.overflow =
        previousBodyOverflow;

      document.body.style.touchAction =
        previousBodyTouchAction;

      /*
       * Keep the visitor at the same position when the
       * loading overlay disappears.
       */
      window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: "auto",
      });
    };
  }, [pageReady]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* =====================================================
          ACTUAL HOMEPAGE
          
          Everything renders behind the loader so React,
          Clerk, cart state and product data can initialize
          without the visitor seeing layout changes.
      ====================================================== */}

      <div
        className={`
          relative
          min-h-[100dvh]
          w-full
          bg-white
          transition-opacity
          duration-300
          ease-out
          ${
            pageReady
              ? "opacity-100"
              : "pointer-events-none select-none opacity-0"
          }
        `}
        aria-hidden={!pageReady}
      >
        {children}
      </div>

      {/* =====================================================
          FULL SCREEN LOADER
      ====================================================== */}

      {!removeLoader && (
        <div
          className={`
            fixed
            inset-0
            z-[99999]
            flex
            h-[100dvh]
            w-full
            items-center
            justify-center
            overflow-hidden
            bg-white
            transition-opacity
            duration-300
            ease-out
            ${
              pageReady
                ? "pointer-events-none opacity-0"
                : "pointer-events-auto opacity-100"
            }
          `}
          role="status"
          aria-label="Loading New Print"
          aria-live="polite"
        >
          <CoreSpinLoader />
        </div>
      )}
    </>
  );
}