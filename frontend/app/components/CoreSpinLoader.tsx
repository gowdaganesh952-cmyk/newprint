"use client";

import { useEffect, useState } from "react";

const LOADING_STATES = [
  "Loading",
  "Preparing your experience",
  "Almost ready",
  "Just a moment",
];

export default function CoreSpinLoader() {
  const [loadingText, setLoadingText] = useState(LOADING_STATES[0]);

  useEffect(() => {
    let index = 0;

    const timer = window.setInterval(() => {
      index = (index + 1) % LOADING_STATES.length;
      setLoadingText(LOADING_STATES[index]);
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
        bg-white
        px-4
        py-8
        sm:px-6
      "
      aria-live="polite"
      aria-busy="true"
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[220px]
          w-[220px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#B9954F]/[0.035]
          blur-2xl
          sm:h-[280px]
          sm:w-[280px]
          sm:blur-3xl
          md:h-[320px]
          md:w-[320px]
        "
      />

      {/* Background ring */}
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
          md:h-[230px]
          md:w-[230px]
        "
      />

      {/* Main loader */}
      <div
        className="
          relative
          flex
          h-[88px]
          w-[88px]
          shrink-0
          items-center
          justify-center
          sm:h-[100px]
          sm:w-[100px]
          md:h-[108px]
          md:w-[108px]
        "
      >
        {/* Outer ring */}
        <div
          aria-hidden="true"
          className="
            absolute
            inset-0
            rounded-full
            border
            border-[#0A1B2E]/[0.10]
          "
        />

        {/* Slow gold ring */}
        <div
          aria-hidden="true"
          className="
            absolute
            inset-[4px]
            rounded-full
            border
            border-dashed
            border-[#B9954F]/[0.30]
            animate-newprint-loader-slow
            will-change-transform
            sm:inset-[5px]
          "
        />

        {/* Main ring */}
        <div
          aria-hidden="true"
          className="
            absolute
            inset-[9px]
            rounded-full
            border-[3px]
            border-transparent
            border-t-[#0A1B2E]
            border-r-[#B9954F]
            animate-newprint-loader-main
            will-change-transform
            sm:inset-[10px]
          "
        />

        {/* Reverse ring */}
        <div
          aria-hidden="true"
          className="
            absolute
            inset-[20px]
            rounded-full
            border-2
            border-transparent
            border-b-[#B9954F]
            border-l-[#0A1B2E]/[0.30]
            animate-newprint-loader-reverse
            will-change-transform
            sm:inset-[23px]
          "
        />

        {/* Print disc */}
        <div
          aria-hidden="true"
          className="
            relative
            flex
            h-[32px]
            w-[32px]
            items-center
            justify-center
            rounded-full
            bg-[#0A1B2E]
            shadow-[0_6px_20px_rgba(10,27,46,0.18)]
            animate-newprint-loader-disc
            will-change-transform
            sm:h-[35px]
            sm:w-[35px]
            md:h-[36px]
            md:w-[36px]
          "
        >
          {/* Inner circle */}
          <div
            className="
              h-[18px]
              w-[18px]
              rounded-full
              border
              border-[#B9954F]/[0.65]
              sm:h-[20px]
              sm:w-[20px]
              md:h-[21px]
              md:w-[21px]
            "
          />

          {/* Center dot */}
          <div
            className="
              absolute
              h-[5px]
              w-[5px]
              rounded-full
              bg-[#B9954F]
              shadow-[0_0_8px_rgba(185,149,79,0.45)]
              sm:h-[6px]
              sm:w-[6px]
            "
          />
        </div>

        {/* Orbit dot */}
        <div
          aria-hidden="true"
          className="
            absolute
            inset-0
            animate-newprint-loader-orbit
            will-change-transform
          "
        >
          <span
            className="
              absolute
              left-1/2
              top-0
              h-[5px]
              w-[5px]
              -translate-x-1/2
              rounded-full
              bg-[#B9954F]
              shadow-[0_0_8px_rgba(185,149,79,0.30)]
              sm:h-[6px]
              sm:w-[6px]
            "
          />
        </div>
      </div>

      {/* Brand */}
      <div
        className="
          relative
          mt-7
          flex
          flex-col
          items-center
          text-center
          sm:mt-8
        "
      >
        <div
          className="
            whitespace-nowrap
            text-[13px]
            font-extrabold
            uppercase
            tracking-[0.26em]
            text-[#0A1B2E]
            sm:text-[14px]
            sm:tracking-[0.30em]
            md:text-[15px]
          "
        >
          NEW <span className="text-[#B9954F]">PRINT</span>
        </div>

        {/* Loading text */}
        <div
          className="
            mt-2
            flex
            h-5
            min-w-[190px]
            items-center
            justify-center
            overflow-hidden
            sm:mt-2.5
            sm:min-w-[210px]
          "
        >
          <span
            key={loadingText}
            className="
              animate-newprint-loader-text
              whitespace-nowrap
              text-[8px]
              font-medium
              uppercase
              tracking-[0.18em]
              text-[#64748B]
              sm:text-[9px]
              sm:tracking-[0.20em]
              md:text-[10px]
            "
          >
            {loadingText}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div
        className="
          relative
          mt-5
          h-[2px]
          w-[92px]
          overflow-hidden
          rounded-full
          bg-[#0A1B2E]/[0.08]
          sm:mt-6
          sm:w-[105px]
          md:w-[110px]
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
            will-change-transform
          "
        />
      </div>

      {/* Bottom text */}
      <div
        className="
          absolute
          bottom-0
          left-0
          right-0
          flex
          justify-center
          px-4
          pb-[max(20px,env(safe-area-inset-bottom))]
          text-center
          sm:pb-[max(24px,env(safe-area-inset-bottom))]
        "
      >
        <span
          className="
            whitespace-nowrap
            text-[7px]
            font-semibold
            uppercase
            tracking-[0.14em]
            text-[#94A3B8]
            sm:text-[8px]
            sm:tracking-[0.18em]
          "
        >
          Custom printing - Made with care
        </span>
      </div>
    </div>
  );
}