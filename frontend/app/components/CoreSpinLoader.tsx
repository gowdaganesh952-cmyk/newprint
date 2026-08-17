"use client";

import { useEffect, useState } from "react";

const loadingStates = [
  "Loading",
  "Preparing your experience",
  "Almost ready",
  "Just a moment",
];

export default function CoreSpinLoader() {
  const [loadingText, setLoadingText] = useState("Loading");

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
      className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-white px-4 py-10"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-black/10" />

        <div className="absolute inset-1 rounded-full border border-dashed border-black/10 animate-spin-slow" />

        <div className="absolute inset-3 rounded-full border-[3px] border-transparent border-t-black border-r-black/20 animate-spin-main" />

        <div className="absolute inset-6 rounded-full border-2 border-transparent border-b-black/60 border-l-black/20 animate-spin-reverse" />

        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black shadow-lg animate-spin-disc">
          <div className="h-5 w-5 rounded-full border border-white/30" />

          <div className="absolute h-1.5 w-1.5 rounded-full bg-white" />
        </div>

        <div className="absolute inset-0 animate-spin-orbit">
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>

      <div className="mt-7 text-center">
        <div className="text-[13px] font-extrabold uppercase tracking-[0.28em] text-black">
          New Print
        </div>

        <div className="mt-2 flex h-5 items-center justify-center">
          <span
            key={loadingText}
            className="animate-loader-text text-[10px] font-medium uppercase tracking-[0.18em] text-black/45"
          >
            {loadingText}
          </span>
        </div>
      </div>

      <div className="mt-5 h-[2px] w-[90px] overflow-hidden rounded-full bg-black/10">
        <div className="h-full w-[35%] rounded-full bg-black animate-loader-progress" />
      </div>

      <style jsx>{`
        .animate-spin-slow {
          animation: spin 14s linear infinite;
        }

        .animate-spin-main {
          animation: spin 1.8s linear infinite;
        }

        .animate-spin-reverse {
          animation: spinReverse 1.25s linear infinite;
        }

        .animate-spin-disc {
          animation: spin 3s linear infinite;
        }

        .animate-spin-orbit {
          animation: spin 2.8s linear infinite;
        }

        .animate-loader-text {
          animation: loaderText 0.45s ease-out;
        }

        .animate-loader-progress {
          animation: loaderProgress 1.6s ease-in-out infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes loaderText {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loaderProgress {
          0% {
            transform: translateX(-150%);
          }

          50% {
            transform: translateX(180%);
          }

          100% {
            transform: translateX(350%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-spin-slow,
          .animate-spin-main,
          .animate-spin-reverse,
          .animate-spin-disc,
          .animate-spin-orbit,
          .animate-loader-text,
          .animate-loader-progress {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}