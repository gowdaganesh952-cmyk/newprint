"use client";

import { useEffect, useState } from "react";

interface HomePageReadyProps {
  children: React.ReactNode;
}

export default function HomePageReady({
  children,
}: HomePageReadyProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const markReady = () => {
      if (!mounted) return;

      /*
       * Give the browser one extra paint cycle.
       * This prevents the loader from disappearing
       * before the homepage has visually settled.
       */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mounted) {
            setIsReady(true);
          }
        });
      });
    };

    /*
     * FeaturedProducts dispatches this event after
     * its API request has completed.
     */
    const handleProductsReady = () => {
      markReady();
    };

    window.addEventListener(
      "newprint:products-ready",
      handleProductsReady
    );

    /*
     * If the browser has already loaded everything,
     * don't wait for window.load.
     */
    if (document.readyState === "complete") {
      const fallbackTimer = window.setTimeout(() => {
        markReady();
      }, 250);

      return () => {
        mounted = false;
        window.clearTimeout(fallbackTimer);

        window.removeEventListener(
          "newprint:products-ready",
          handleProductsReady
        );
      };
    }

    /*
     * Normal browser loading path.
     */
    const handleWindowLoad = () => {
      const timer = window.setTimeout(() => {
        markReady();
      }, 400);

      window.addEventListener(
        "newprint:products-ready",
        handleProductsReady
      );

      return timer;
    };

    window.addEventListener("load", handleWindowLoad, {
      once: true,
    });

    /*
     * Safety fallback.
     * The loader should NEVER get stuck forever if
     * an API or image behaves unexpectedly.
     */
    const safetyTimer = window.setTimeout(() => {
      markReady();
    }, 5000);

    return () => {
      mounted = false;

      window.removeEventListener(
        "load",
        handleWindowLoad
      );

      window.removeEventListener(
        "newprint:products-ready",
        handleProductsReady
      );

      window.clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <>
      {/* =====================================================
          HOME CONTENT
      ====================================================== */}

      <div
        className={`
          min-h-screen
          w-full
          transition-opacity
          duration-500
          ease-out
          ${
            isReady
              ? "opacity-100"
              : "opacity-100"
          }
        `}
      >
        {children}
      </div>

      {/* =====================================================
          INITIAL PAGE LOADER
      ====================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-[99999]
          flex
          min-h-[100dvh]
          w-full
          items-center
          justify-center
          bg-white
          transition-all
          duration-500
          ease-out
          ${
            isReady
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }
        `}
        aria-hidden={isReady}
      >
        <CorePageLoader />
      </div>
    </>
  );
}

/* ============================================================
   PAGE LOADER
============================================================ */

function CorePageLoader() {
  return (
    <div className="flex w-full flex-col items-center justify-center px-5">
      {/* Loader */}
      <div className="relative flex h-[92px] w-[92px] items-center justify-center sm:h-[104px] sm:w-[104px]">
        {/* Soft glow */}
        <div className="absolute inset-[14px] rounded-full bg-black/[0.035] blur-xl" />

        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-black/[0.08]" />

        {/* Dashed ring */}
        <div className="absolute inset-[5px] rounded-full border border-dashed border-black/[0.10] animate-newprint-spin-slow" />

        {/* Main ring */}
        <div className="absolute inset-[10px] rounded-full border-[3px] border-transparent border-t-black border-r-black/20 animate-newprint-spin" />

        {/* Reverse ring */}
        <div className="absolute inset-[22px] rounded-full border-2 border-transparent border-b-black/60 border-l-black/20 animate-newprint-spin-reverse" />

        {/* Print disc */}
        <div className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black shadow-[0_5px_20px_rgba(0,0,0,0.18)] animate-newprint-disc">
          <div className="h-[20px] w-[20px] rounded-full border border-white/30" />

          <div className="absolute h-[6px] w-[6px] rounded-full bg-white" />
        </div>

        {/* Orbiting dot */}
        <div className="absolute inset-0 animate-newprint-orbit">
          <span className="absolute left-1/2 top-[1px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>

      {/* Brand */}
      <div className="mt-7 text-center">
        <div className="text-[13px] font-extrabold uppercase tracking-[0.28em] text-black">
          New Print
        </div>

        <div className="mt-2 h-5 overflow-hidden">
          <span className="animate-newprint-text text-[10px] font-medium uppercase tracking-[0.18em] text-black/45">
            Preparing your experience
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-5 h-[2px] w-[90px] overflow-hidden rounded-full bg-black/[0.08]">
        <div className="h-full w-[36%] rounded-full bg-black animate-newprint-progress" />
      </div>

      <style jsx>{`
        .animate-newprint-spin-slow {
          animation: newprintSpin 14s linear infinite;
        }

        .animate-newprint-spin {
          animation: newprintSpin 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-newprint-spin-reverse {
          animation: newprintSpinReverse 1.25s linear infinite;
        }

        .animate-newprint-disc {
          animation: newprintSpin 3s linear infinite;
        }

        .animate-newprint-orbit {
          animation: newprintSpin 2.8s linear infinite;
        }

        .animate-newprint-text {
          animation: newprintText 0.6s ease-out;
        }

        .animate-newprint-progress {
          animation: newprintProgress 1.6s ease-in-out infinite;
        }

        @keyframes newprintSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes newprintSpinReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes newprintText {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes newprintProgress {
          0% {
            transform: translateX(-160%);
          }

          50% {
            transform: translateX(180%);
          }

          100% {
            transform: translateX(360%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-newprint-spin-slow,
          .animate-newprint-spin,
          .animate-newprint-spin-reverse,
          .animate-newprint-disc,
          .animate-newprint-orbit,
          .animate-newprint-text,
          .animate-newprint-progress {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}