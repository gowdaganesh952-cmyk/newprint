"use client";

import { useMemo } from "react";

// ============================================================
// CONFIGURATION
// ============================================================

const WHATSAPP_NUMBER = "917406925565";

// ============================================================
// WHATSAPP ICON
// ============================================================

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className="h-[27px] w-[27px] sm:h-[29px] sm:w-[29px] md:h-[31px] md:w-[31px]"
      aria-hidden="true"
    >
      <path d="M16.01 3C8.83 3 3 8.82 3 16c0 2.29.6 4.53 1.73 6.5L3 29l6.66-1.69A12.95 12.95 0 0 0 16 29c7.18 0 13-5.82 13-13S23.19 3 16.01 3Zm0 23.6c-2.04 0-4.04-.55-5.8-1.6l-.42-.25-3.95 1 1.05-3.84-.27-.44A10.6 10.6 0 1 1 16.01 26.6Zm5.82-7.94c-.32-.16-1.88-.93-2.17-1.04-.29-.11-.5-.16-.71.16-.21.31-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.57-1.87-1.75-2.18-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.11-.21.05-.39-.03-.55-.08-.16-.71-1.72-.97-2.36-.26-.63-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.64s1.13 3.06 1.29 3.27c.16.21 2.22 3.39 5.38 4.76.75.32 1.33.51 1.78.65.75.24 1.43.2 1.97.12.6-.09 1.88-.77 2.14-1.51.26-.74.26-1.37.18-1.51-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function WhatsAppButton() {
  const whatsappUrl = useMemo(() => {
    const message = encodeURIComponent(
      "Hi New Print, I have an enquiry."
    );

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }, []);

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with New Print on WhatsApp"
      className="
        fixed
        z-[9999]

        right-[14px]
        bottom-[calc(14px+env(safe-area-inset-bottom))]

        flex
        h-[52px]
        w-[52px]
        items-center
        justify-center

        rounded-full

        bg-[#25D366]
        text-white

        shadow-[0_5px_18px_rgba(10,27,46,0.22)]

        transition-[transform,box-shadow]
        duration-200
        ease-out

        hover:scale-105
        hover:shadow-[0_8px_24px_rgba(10,27,46,0.28)]

        active:scale-95

        touch-manipulation
        select-none

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#B9954F]
        focus-visible:ring-offset-2

        sm:right-[18px]
        sm:bottom-[calc(18px+env(safe-area-inset-bottom))]
        sm:h-[56px]
        sm:w-[56px]

        md:right-[22px]
        md:bottom-[calc(22px+env(safe-area-inset-bottom))]
        md:h-[58px]
        md:w-[58px]
      "
    >
      <WhatsAppIcon />

      {/* Small New Print gold accent */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-[1px]
          -top-[1px]
          h-[9px]
          w-[9px]
          rounded-full
          border-2
          border-white
          bg-[#B9954F]
        "
      />
    </a>
  );
}