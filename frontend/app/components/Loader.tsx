"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLoader } from "./LoaderProvider";

const NAVY = "#0A1B2E";
const GOLD = "#B9954F";

export default function Loader() {
  const { isLoading, markAnimationReady } = useLoader();
  const shouldReduceMotion = useReducedMotion();

  const reduced = shouldReduceMotion === true;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex min-h-screen w-full items-center justify-center overflow-hidden bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduced ? 0.2 : 0.4,
            ease: "easeOut",
          }}
          aria-label="Loading New Print"
          role="status"
        >
          <motion.div
            className="flex w-full flex-col items-center justify-center px-6"
            initial={{ scale: reduced ? 1 : 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: reduced ? 0.2 : 0.45,
              ease: "easeOut",
            }}
          >
            {/* =========================================================
                NP MONOGRAM
                SVG-based so it stays sharp at every screen size.
               ========================================================= */}
            <div
              className="
                relative
                w-[190px]
                sm:w-[220px]
                md:w-[270px]
                lg:w-[300px]
              "
              style={{ aspectRatio: "1 / 0.82" }}
            >
              <svg
                viewBox="0 0 300 245"
                className="h-full w-full overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* =====================================================
                    NAVY N — OUTLINE
                   ===================================================== */}
                <motion.path
                  d="
                    M42 34
                    L78 34
                    L166 142
                    L166 194
                    L130 194
                    L42 87
                    Z

                    M42 87
                    L42 194
                    L78 194
                    L78 130
                    Z
                  "
                  fill="none"
                  stroke={NAVY}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: reduced ? 0 : 0.9,
                    ease: "easeInOut",
                  }}
                />

                {/* =====================================================
                    NAVY N — FILL
                   ===================================================== */}
                <motion.path
                  d="
                    M42 34
                    L78 34
                    L166 142
                    L166 194
                    L130 194
                    L42 87
                    Z

                    M42 87
                    L42 194
                    L78 194
                    L78 130
                    Z
                  "
                  fill={NAVY}
                  stroke="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: reduced ? 0 : 0.85,
                    duration: reduced ? 0 : 0.45,
                    ease: "easeOut",
                  }}
                />

                {/* =====================================================
                    GOLD P — OUTLINE
                   ===================================================== */}
                <motion.path
                  d="
                    M174 34
                    C207 34 239 38 254 55
                    C269 72 269 101 254 118
                    C240 134 214 138 184 138
                    L184 194
                    L151 194
                    L151 34
                    Z

                    M184 57
                    L184 115
                    L208 115
                    C225 115 237 106 237 86
                    C237 67 225 57 208 57
                    Z
                  "
                  fill="none"
                  stroke={GOLD}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                  }}
                  transition={{
                    delay: reduced ? 0 : 0.25,
                    duration: reduced ? 0 : 0.9,
                    ease: "easeInOut",
                  }}
                />

                {/* =====================================================
                    GOLD P — FILL
                   ===================================================== */}
                <motion.path
                  d="
                    M174 34
                    C207 34 239 38 254 55
                    C269 72 269 101 254 118
                    C240 134 214 138 184 138
                    L184 194
                    L151 194
                    L151 34
                    Z

                    M184 57
                    L184 115
                    L208 115
                    C225 115 237 106 237 86
                    C237 67 225 57 208 57
                    Z
                  "
                  fill={GOLD}
                  stroke="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: reduced ? 0 : 1.05,
                    duration: reduced ? 0 : 0.4,
                    ease: "easeOut",
                  }}
                />

                {/* =====================================================
                    SUBTLE PRINT PRESS HIGHLIGHT
                   ===================================================== */}
                {!reduced && (
                  <motion.rect
                    x="30"
                    y="28"
                    width="240"
                    height="175"
                    rx="8"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    opacity="0"
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: [0, 0.35, 0],
                    }}
                    transition={{
                      delay: 1.05,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                  />
                )}
              </svg>
            </div>

            {/* =========================================================
                NEW PRINT TEXT
               ========================================================= */}
            <div
              className="
                mt-5
                flex
                items-center
                gap-[0.45rem]
                text-[1.15rem]
                font-extrabold
                uppercase
                leading-none
                tracking-[0.14em]
                sm:mt-6
                sm:gap-2
                sm:text-2xl
                sm:tracking-[0.2em]
                md:text-3xl
              "
            >
              <motion.span
                className="text-[#0A1B2E]"
                initial={{
                  y: reduced ? 0 : 18,
                  opacity: reduced ? 1 : 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                transition={{
                  delay: reduced ? 0 : 1.15,
                  duration: reduced ? 0.15 : 0.4,
                  ease: "easeOut",
                }}
              >
                NEW
              </motion.span>

              <motion.span
                className="text-[#B9954F]"
                initial={{
                  y: reduced ? 0 : 18,
                  opacity: reduced ? 1 : 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                transition={{
                  delay: reduced ? 0 : 1.25,
                  duration: reduced ? 0.15 : 0.4,
                  ease: "easeOut",
                }}
              >
                PRINT
              </motion.span>
            </div>

            {/* =========================================================
                Tell provider that the visual animation is complete.
               ========================================================= */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: reduced ? 0.2 : 1.7,
                duration: 0.1,
              }}
              onAnimationComplete={markAnimationReady}
              className="pointer-events-none absolute h-px w-px opacity-0"
              aria-hidden="true"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}