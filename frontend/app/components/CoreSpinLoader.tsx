"use client";

import { useEffect, useState } from "react";

const loadingStates = [
  "Loading",
  "Preparing your experience",
  "Almost ready",
  "Just a moment",
];

export default function CoreSpinLoader() {
  const [loadingText, setLoadingText] = useState(
    loadingStates[0]
  );

  useEffect(() => {
    let index = 0;

    const timer = window.setInterval(() => {
      index = (index + 1) % loadingStates.length;

      setLoadingText(loadingStates[index]);
    }, 1400);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div
      className="
        relative
        flex
        min-h-[100dvh]
        w-full
        flex-col
        items-center
        justify-center
        overflow-hidden
        bg-[#FFFFFF]
        px-5
      "
      aria-live="polite"
      aria-busy="true"
    >
      {/* =====================================================
          SUBTLE BACKGROUND DETAIL
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[260px]
          w-[260px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#B9954F]/[0.035]
          blur-3xl
          sm:h-[320px]
          sm:w-[320px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[170px]
          w-[170px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          border
          border-[#B9954F]/[0.08]
          sm:h-[210px]
          sm:w-[210px]
        "
      />

      {/* =====================================================
          MAIN LOADER
      ====================================================== */}

      <div
        className="
          relative
          flex
          h-[96px]
          w-[96px]
          items-center
          justify-center
          sm:h-[108px]
          sm:w-[108px]
        "
      >
        {/* Outer navy ring */}

        <div
          className="
            absolute
            inset-0
            rounded-full
            border
            border-[#0A1B2E]/[0.10]
          "
        />

        {/* Slow gold dashed ring */}

        <div
          className="
            absolute
            inset-[5px]
            rounded-full
            border
            border-dashed
            border-[#B9954F]/[0.30]
            animate-newprint-loader-slow
          "
        />

        {/* Main navy + gold ring */}

        <div
          className="
            absolute
            inset-[10px]
            rounded-full
            border-[3px]
            border-transparent
            border-t-[#0A1B2E]
            border-r-[#B9954F]
            animate-newprint-loader-main
          "
        />

        {/* Inner gold reverse ring */}

        <div
          className="
            absolute
            inset-[23px]
            rounded-full
            border-2
            border-transparent
            border-b-[#B9954F]
            border-l-[#0A1B2E]/[0.30]
            animate-newprint-loader-reverse
          "
        />

        {/* ===================================================
            PRINT DISC
        ==================================================== */}

        <div
          className="
            relative
            flex
            h-[36px]
            w-[36px]
            items-center
            justify-center
            rounded-full
            bg-[#0A1B2E]
            shadow-[0_6px_22px_rgba(10,27,46,0.20)]
            animate-newprint-loader-disc
          "
        >
          {/* Gold inner print ring */}

          <div
            className="
              h-[21px]
              w-[21px]
              rounded-full
              border
              border-[#B9954F]/[0.65]
            "
          />

          {/* Center */}

          <div
            className="
              absolute
              h-[6px]
              w-[6px]
              rounded-full
              bg-[#B9954F]
              shadow-[0_0_8px_rgba(185,149,79,0.45)]
            "
          />
        </div>

        {/* ===================================================
            ORBIT DOT
        ==================================================== */}

        <div
          className="
            absolute
            inset-0
            animate-newprint-loader-orbit
          "
        >
          <span
            className="
              absolute
              left-1/2
              top-0
              h-[6px]
              w-[6px]
              -translate-x-1/2
              rounded-full
              bg-[#B9954F]
              shadow-[0_0_8px_rgba(185,149,79,0.30)]
            "
          />
        </div>
      </div>

      {/* =====================================================
          BRAND
      ====================================================== */}

      <div className="relative mt-8 text-center">
        <div
          className="
            text-[14px]
            font-extrabold
            uppercase
            tracking-[0.30em]
            text-[#0A1B2E]
            sm:text-[15px]
          "
        >
          NEW{" "}
          <span className="text-[#B9954F]">
            PRINT
          </span>
        </div>

        <div className="mt-2.5 flex h-5 items-center justify-center overflow-hidden">
          <span
            key={loadingText}
            className="
              animate-newprint-loader-text
              text-[9px]
              font-medium
              uppercase
              tracking-[0.20em]
              text-[#64748B]
              sm:text-[10px]
            "
          >
            {loadingText}
          </span>
        </div>
      </div>

      {/* =====================================================
          PROGRESS
      ====================================================== */}

      <div
        className="
          relative
          mt-6
          h-[2px]
          w-[100px]
          overflow-hidden
          rounded-full
          bg-[#0A1B2E]/[0.08]
          sm:w-[110px]
        "
        aria-hidden="true"
      >
        <div
          className="
            h-full
            w-[35%]
            rounded-full
            bg-[#B9954F]
            shadow-[0_0_8px_rgba(185,149,79,0.25)]
            animate-newprint-loader-progress
          "
        />
      </div>

      {/* =====================================================
          BOTTOM MICRO TEXT
      ====================================================== */}

      <div
        className="
          absolute
          bottom-[calc(24px+env(safe-area-inset-bottom))]
          left-0
          right-0
          text-center
        "
      >
        <span
          className="
            text-[8px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-[#94A3B8]
          "
        >
          Custom printing • Made with care
        </span>
      </div>

      {/* =====================================================
          ANIMATIONS
      ====================================================== */}

      <style jsx>{`
        .animate-newprint-loader-slow {
          animation: newprintLoaderSpin 12s linear infinite;
        }

        .animate-newprint-loader-main {
          animation: newprintLoaderSpin 1.8s
            cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-newprint-loader-reverse {
          animation: newprintLoaderSpinReverse 1.25s
            linear infinite;
        }

        .animate-newprint-loader-disc {
          animation: newprintLoaderSpin 3.5s linear infinite;
        }

        .animate-newprint-loader-orbit {
          animation: newprintLoaderSpin 2.7s linear infinite;
        }

        .animate-newprint-loader-text {
          animation: newprintLoaderText 0.45s ease-out;
        }

        .animate-newprint-loader-progress {
          animation: newprintLoaderProgress 1.6s
            ease-in-out infinite;
        }

        @keyframes newprintLoaderSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes newprintLoaderSpinReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes newprintLoaderText {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes newprintLoaderProgress {
          0% {
            transform: translateX(-160%);
          }

          50% {
            transform: translateX(190%);
          }

          100% {
            transform: translateX(370%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-newprint-loader-slow,
          .animate-newprint-loader-main,
          .animate-newprint-loader-reverse,
          .animate-newprint-loader-disc,
          .animate-newprint-loader-orbit,
          .animate-newprint-loader-text,
          .animate-newprint-loader-progress {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}