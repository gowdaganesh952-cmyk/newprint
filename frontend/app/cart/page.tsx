"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import {
  useCart,
  PrintUnit,
} from "@/app/components/cart/CartProvider";

import Navbar from "@/app/components/Navbar";

const MAX_PRINT_IMAGES = 3;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const FALLBACK_IMAGE =
  "/images/product-placeholder.jpg";

/* ============================================================
   ICONS
============================================================ */

function CartIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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

function TrashIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function ArrowRightIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function UploadIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function CheckIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatPrice(
  value: number
): string {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function createUnitId(): string {
  return `unit_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getItemId(
  item: {
    _id?: string;
    itemKey: string;
  }
): string {
  return (
    item._id ||
    item.itemKey
  );
}

/* ============================================================
   SKELETON
============================================================ */

function CartSkeleton() {
  return (
    <div className="min-h-[100svh] bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-32 pt-[92px] sm:px-6 sm:pt-[108px] lg:px-8 lg:pb-24">
        <div className="mb-7">
          <div className="h-8 w-36 animate-pulse rounded bg-[#E5E7EB]" />

          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-[#E5E7EB]" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:col-span-8">
            {[1, 2].map(
              (number) => (
                <div
                  key={number}
                  className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 sm:p-5"
                >
                  <div className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 animate-pulse rounded-[9px] bg-[#E5E7EB] sm:h-28 sm:w-28" />

                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />

                      <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />

                      <div className="mt-5 h-9 w-32 animate-pulse rounded bg-[#E5E7EB]" />
                    </div>
                  </div>

                  <div className="mt-5 h-24 animate-pulse rounded-[9px] bg-[#E5E7EB]" />
                </div>
              )
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5">
              <div className="h-5 w-36 animate-pulse rounded bg-[#E5E7EB]" />

              <div className="mt-7 space-y-4">
                <div className="h-4 w-full animate-pulse rounded bg-[#E5E7EB]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#E5E7EB]" />
                <div className="h-px w-full bg-[#E5E7EB]" />
                <div className="h-7 w-32 animate-pulse rounded bg-[#E5E7EB]" />
                <div className="h-12 w-full animate-pulse rounded bg-[#E5E7EB]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   PRINT UNIT CARD
============================================================ */

function PrintUnitCard({
  unit,
  index,
  onUpload,
  onRemove,
  uploading,
  disabled,
}: {
  unit: PrintUnit;
  index: number;
  onUpload: (
    file: File
  ) => void;
  onRemove: (
    imageIndex: number
  ) => void;
  uploading: boolean;
  disabled: boolean;
}) {
  const inputId = `print-upload-${unit.unitId}`;

  return (
    <div
      className="
        rounded-[10px]
        border
        border-[#E5E7EB]
        bg-[#FAFAF8]
        p-3
        sm:p-4
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-[#0A1B2E] sm:text-sm">
            Product {index + 1}
          </p>

          <p className="mt-0.5 text-[10px] text-[#64748B] sm:text-xs">
            1–3 images required
          </p>
        </div>

        <span
          className={`
            shrink-0
            rounded-full
            px-2.5
            py-1
            text-[9px]
            font-extrabold
            ${
              unit.images.length > 0
                ? "bg-green-50 text-green-700"
                : "bg-[#EEEBDD] text-[#8B6E32]"
            }
          `}
        >
          {unit.images.length}/
          {MAX_PRINT_IMAGES}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {unit.images.map(
          (
            image,
            imageIndex
          ) => (
            <div
              key={`${image.publicId}-${imageIndex}`}
              className="relative aspect-square overflow-hidden rounded-[8px] border border-[#DDE2E7] bg-white"
            >
              <Image
                src={
                  image.url
                }
                alt={`Product ${
                  index + 1
                } print image ${
                  imageIndex +
                  1
                }`}
                fill
                sizes="120px"
                className="object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  onRemove(
                    imageIndex
                  )
                }
                disabled={
                  disabled
                }
                aria-label="Remove image"
                className="
                  absolute
                  right-1.5
                  top-1.5
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  bg-[#0A1B2E]/90
                  text-white
                  transition-colors
                  duration-150
                  hover:bg-red-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <XIcon />
              </button>
            </div>
          )
        )}

        {unit.images.length <
          MAX_PRINT_IMAGES && (
          <label
            htmlFor={
              inputId
            }
            className={`
              flex
              aspect-square
              cursor-pointer
              flex-col
              items-center
              justify-center
              rounded-[8px]
              border
              border-dashed
              border-[#C9D0D8]
              bg-white
              text-[#64748B]
              transition-colors
              duration-150
              hover:border-[#B9954F]
              hover:bg-[#FBFAF6]
              ${
                disabled
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            `}
          >
            {uploading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D8DDE3] border-t-[#B9954F]" />
            ) : (
              <>
                <UploadIcon />

                <span className="mt-1.5 text-[9px] font-bold">
                  Add image
                </span>
              </>
            )}

            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={
                disabled
              }
              onChange={(
                event
              ) => {
                const file =
                  event.target
                    .files?.[0];

                if (file) {
                  onUpload(
                    file
                  );
                }

                event.target.value =
                  "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CART PAGE
============================================================ */

export default function CartPage() {
  const router =
    useRouter();

  const {
    isSignedIn,
  } = useAuth();

  const {
    items,
    subtotal,
    itemCount,

    isInitializing,
    isUpdating,

    serverMessages,

    updateQuantity,
    removeFromCart,

    uploadPrintImage,
    savePrintCustomization,

    isCartPrintReady,

    clearServerMessages,
  } = useCart();

  /* ==========================================================
     CUSTOMIZATION STATE
  ========================================================== */

  const [
    editingItemId,
    setEditingItemId,
  ] = useState<
    string | null
  >(null);

  const [
    draftUnits,
    setDraftUnits,
  ] = useState<
    PrintUnit[]
  >([]);

  const [
    uploadingKey,
    setUploadingKey,
  ] = useState<
    string | null
  >(null);

  const [
    savingCustomization,
    setSavingCustomization,
  ] = useState(false);

  const [
    customizationError,
    setCustomizationError,
  ] = useState<
    string | null
  >(null);

  const [
    actionError,
    setActionError,
  ] = useState<
    string | null
  >(null);

  /* ==========================================================
     BODY LOCK WHEN MODAL IS OPEN
  ========================================================== */

  useEffect(() => {
    if (
      editingItemId
    ) {
      const previousOverflow =
        document.body
          .style.overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          previousOverflow;
      };
    }
  }, [
    editingItemId,
  ]);

  /* ==========================================================
     ESCAPE MODAL
  ========================================================== */

  useEffect(() => {
    if (
      !editingItemId
    ) {
      return;
    }

    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          if (
            !savingCustomization &&
            !uploadingKey
          ) {
            closeCustomization();
          }
        }
      };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    editingItemId,
    savingCustomization,
    uploadingKey,
  ]);

  /* ==========================================================
     START CUSTOMIZATION
  ========================================================== */

  const startCustomization =
    useCallback(
      (item: any) => {
        const itemId =
          getItemId(item);

        setActionError(
          null
        );

        setCustomizationError(
          null
        );

        const quantity =
          Math.max(
            1,
            Number(
              item.quantity
            ) || 1
          );

        const sourceUnits =
          Array.isArray(
            item.printUnits
          )
            ? item.printUnits
            : [];

        const units: PrintUnit[] =
          sourceUnits.map(
            (
              unit: PrintUnit
            ) => ({
              unitId:
                unit.unitId ||
                createUnitId(),

              images:
                Array.isArray(
                  unit.images
                )
                  ? [
                      ...unit.images,
                    ].slice(
                      0,
                      MAX_PRINT_IMAGES
                    )
                  : [],
            })
          );

        while (
          units.length <
          quantity
        ) {
          units.push({
            unitId:
              createUnitId(),

            images: [],
          });
        }

        setDraftUnits(
          units.slice(
            0,
            quantity
          )
        );

        setEditingItemId(
          itemId
        );
      },
      []
    );

  /* ==========================================================
     CLOSE CUSTOMIZATION
  ========================================================== */

  const closeCustomization =
    useCallback(() => {
      if (
        savingCustomization ||
        uploadingKey
      ) {
        return;
      }

      setEditingItemId(
        null
      );

      setDraftUnits(
        []
      );

      setCustomizationError(
        null
      );
    }, [
      savingCustomization,
      uploadingKey,
    ]);

  /* ==========================================================
     UPLOAD IMAGE
  ========================================================== */

  const handleImageUpload =
    useCallback(
      async (
        unitIndex: number,
        file: File
      ) => {
        setCustomizationError(
          null
        );

        const unit =
          draftUnits[
            unitIndex
          ];

        if (!unit) {
          return;
        }

        if (
          unit.images.length >=
          MAX_PRINT_IMAGES
        ) {
          setCustomizationError(
            "Maximum 3 images are allowed for each product."
          );

          return;
        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          setCustomizationError(
            "Please select an image file."
          );

          return;
        }

        if (
          file.size >
          MAX_UPLOAD_SIZE
        ) {
          setCustomizationError(
            "Image must be smaller than 5MB."
          );

          return;
        }

        const uploadKey =
          `${unit.unitId}-${Date.now()}`;

        try {
          setUploadingKey(
            uploadKey
          );

          const uploaded =
            await uploadPrintImage(
              file
            );

          setDraftUnits(
            (
              previousUnits
            ) =>
              previousUnits.map(
                (
                  currentUnit,
                  index
                ) => {
                  if (
                    index !==
                    unitIndex
                  ) {
                    return currentUnit;
                  }

                  if (
                    currentUnit
                      .images
                      .length >=
                    MAX_PRINT_IMAGES
                  ) {
                    return currentUnit;
                  }

                  return {
                    ...currentUnit,

                    images: [
                      ...currentUnit.images,
                      uploaded,
                    ],
                  };
                }
              )
          );
        } catch (
          error
        ) {
          console.error(
            "Print image upload error:",
            error
          );

          setCustomizationError(
            error instanceof
              Error
              ? error.message
              : "Failed to upload image."
          );
        } finally {
          setUploadingKey(
            null
          );
        }
      },
      [
        draftUnits,
        uploadPrintImage,
      ]
    );

  /* ==========================================================
     REMOVE DRAFT IMAGE
  ========================================================== */

  const removeDraftImage =
    useCallback(
      (
        unitIndex: number,
        imageIndex: number
      ) => {
        if (
          savingCustomization ||
          uploadingKey
        ) {
          return;
        }

        setDraftUnits(
          (
            previousUnits
          ) =>
            previousUnits.map(
              (
                unit,
                index
              ) => {
                if (
                  index !==
                  unitIndex
                ) {
                  return unit;
                }

                return {
                  ...unit,

                  images:
                    unit.images.filter(
                      (
                        _image,
                        currentIndex
                      ) =>
                        currentIndex !==
                        imageIndex
                    ),
                };
              }
            )
        );

        setCustomizationError(
          null
        );
      },
      [
        savingCustomization,
        uploadingKey,
      ]
    );

  /* ==========================================================
     SAVE CUSTOMIZATION
  ========================================================== */

  const handleSaveCustomization =
    useCallback(
      async () => {
        setCustomizationError(
          null
        );

        if (
          !editingItemId
        ) {
          return;
        }

        const currentItem =
          items.find(
            (item) =>
              getItemId(
                item
              ) ===
              editingItemId
          );

        if (!currentItem) {
          setCustomizationError(
            "Cart item not found."
          );

          return;
        }

        const quantity =
          Math.max(
            1,
            Number(
              currentItem.quantity
            ) || 1
          );

        if (
          draftUnits.length !==
          quantity
        ) {
          setCustomizationError(
            `This product has ${quantity} physical ${
              quantity ===
              1
                ? "product"
                : "products"
            }.`
          );

          return;
        }

        const incompleteIndex =
          draftUnits.findIndex(
            (unit) =>
              unit.images.length <
              1
          );

        if (
          incompleteIndex !==
          -1
        ) {
          setCustomizationError(
            `Product ${
              incompleteIndex +
              1
            } requires at least 1 image.`
          );

          return;
        }

        const tooManyIndex =
          draftUnits.findIndex(
            (unit) =>
              unit.images.length >
              MAX_PRINT_IMAGES
          );

        if (
          tooManyIndex !==
          -1
        ) {
          setCustomizationError(
            `Product ${
              tooManyIndex +
              1
            } has more than 3 images.`
          );

          return;
        }

        try {
          setSavingCustomization(
            true
          );

          await savePrintCustomization(
            editingItemId,
            draftUnits
          );

          setEditingItemId(
            null
          );

          setDraftUnits(
            []
          );

          setCustomizationError(
            null
          );
        } catch (
          error
        ) {
          console.error(
            "Save print customization error:",
            error
          );

          setCustomizationError(
            error instanceof
              Error
              ? error.message
              : "Failed to save print images."
          );
        } finally {
          setSavingCustomization(
            false
          );
        }
      },
      [
        editingItemId,
        items,
        draftUnits,
        savePrintCustomization,
      ]
    );

  /* ==========================================================
     CHECKOUT
  ========================================================== */

  const handleCheckoutClick =
    useCallback(() => {
      if (
        !isCartPrintReady ||
        isUpdating
      ) {
        return;
      }

      if (isSignedIn) {
        router.push(
          "/checkout"
        );
      } else {
        router.push(
          "/sign-in?redirect_url=/checkout"
        );
      }
    }, [
      isCartPrintReady,
      isUpdating,
      isSignedIn,
      router,
    ]);

  /* ==========================================================
     UPDATE QUANTITY
  ========================================================== */

  const changeQuantity =
    useCallback(
      async (
        itemId: string,
        currentQuantity: number,
        nextQuantity: number
      ) => {
        if (
          nextQuantity <
            1 ||
          nextQuantity ===
            currentQuantity ||
          isUpdating
        ) {
          return;
        }

        setActionError(
          null
        );

        try {
          await updateQuantity(
            itemId,
            nextQuantity
          );
        } catch (
          error
        ) {
          console.error(
            "Quantity update error:",
            error
          );

          setActionError(
            error instanceof
              Error
              ? error.message
              : "Unable to update quantity."
          );
        }
      },
      [
        updateQuantity,
        isUpdating,
      ]
    );

  /* ==========================================================
     REMOVE
  ========================================================== */

  const handleRemove =
    useCallback(
      async (
        itemId: string
      ) => {
        if (
          isUpdating
        ) {
          return;
        }

        setActionError(
          null
        );

        try {
          await removeFromCart(
            itemId
          );
        } catch (
          error
        ) {
          console.error(
            "Remove cart item error:",
            error
          );

          setActionError(
            error instanceof
              Error
              ? error.message
              : "Unable to remove item."
          );
        }
      },
      [
        removeFromCart,
        isUpdating,
      ]
    );

  /* ==========================================================
     SUMMARY DATA
  ========================================================== */

  const totalPhysicalProducts =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            Math.max(
              0,
              Number(
                item.quantity
              ) || 0
            ),
          0
        ),
      [items]
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    isInitializing
  ) {
    return (
      <CartSkeleton />
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[#F7F7F5]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-36 pt-[88px] sm:px-6 sm:pb-28 sm:pt-[104px] lg:px-8 lg:pb-24">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="mb-6 sm:mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-[2px] w-7 bg-[#B9954F]" />

            <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#B9954F] sm:text-[10px]">
              Your Selection
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-[29px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#0A1B2E] sm:text-4xl">
                Cart
              </h1>

              <p className="mt-2 text-[12px] font-medium text-[#64748B] sm:text-sm">
                {itemCount}{" "}
                {itemCount ===
                1
                  ? "item"
                  : "items"}{" "}
                ·{" "}
                {
                  totalPhysicalProducts
                }{" "}
                physical{" "}
                {totalPhysicalProducts ===
                1
                  ? "product"
                  : "products"}
              </p>
            </div>

            {items.length >
              0 && (
              <Link
                href="/products"
                className="
                  inline-flex
                  min-h-10
                  w-fit
                  items-center
                  gap-2
                  rounded-[8px]
                  border
                  border-[#DDE2E7]
                  bg-white
                  px-4
                  text-xs
                  font-bold
                  text-[#0A1B2E]
                  transition-colors
                  duration-150
                  hover:border-[#B9954F]
                  hover:bg-[#FBFAF6]
                "
              >
                Continue Shopping
              </Link>
            )}
          </div>
        </header>

        {/* ==================================================
            SERVER MESSAGES
        ================================================== */}

        {serverMessages.length >
          0 && (
          <div className="relative mb-5 rounded-[10px] border border-[#E6D6A9] bg-[#FBF7E9] px-4 py-3.5 pr-12 sm:mb-6">
            <button
              type="button"
              onClick={
                clearServerMessages
              }
              aria-label="Close cart updates"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#8B6E32] transition-colors duration-150 hover:bg-[#EEEBDD]"
            >
              <XIcon />
            </button>

            <p className="text-xs font-extrabold text-[#8B6E32]">
              Cart Updates
            </p>

            <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-[#8B6E32] sm:text-xs">
              {serverMessages.map(
                (
                  message,
                  index
                ) => (
                  <li
                    key={`${message}-${index}`}
                    className="list-inside list-disc"
                  >
                    {message}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        {/* ==================================================
            ACTION ERROR
        ================================================== */}

        {actionError && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-semibold leading-5 text-red-600">
              {actionError}
            </p>

            <button
              type="button"
              onClick={() =>
                setActionError(
                  null
                )
              }
              className="shrink-0 text-red-500"
              aria-label="Close error"
            >
              <XIcon />
            </button>
          </div>
        )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {items.length ===
        0 ? (
          <section className="flex min-h-[55vh] flex-col items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-16 text-center sm:min-h-[60vh] sm:px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F2E8] text-[#B9954F] sm:h-20 sm:w-20">
              <CartIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>

            <h2 className="mt-5 text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-[#64748B] sm:text-sm">
              Looks like you haven't
              added anything yet.
              Explore our collection
              and find something for
              your next print project.
            </p>

            <Link
              href="/products"
              className="
                mt-7
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-2
                rounded-[9px]
                bg-[#0A1B2E]
                px-6
                text-sm
                font-extrabold
                text-white
                transition-colors
                duration-150
                hover:bg-[#142C46]
              "
            >
              Browse Products
              <ArrowRightIcon />
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">

            {/* =================================================
                CART ITEMS
            ================================================= */}

            <section className="min-w-0 space-y-4 lg:col-span-8">
              {items.map(
                (item) => {
                  const itemId =
                    getItemId(
                      item
                    );

                  const options =
                    Object.entries(
                      item.selections ||
                        {}
                    ).filter(
                      ([
                        key,
                        value,
                      ]) =>
                        key &&
                        value
                    );

                  const readyUnits =
                    item.printUnits.filter(
                      (
                        unit
                      ) =>
                        unit.images
                          .length >=
                        1
                    ).length;

                  const ready =
                    item.printUnits.length ===
                      item.quantity &&
                    item.printUnits.every(
                      (
                        unit
                      ) =>
                        unit.images
                          .length >=
                        1
                    );

                  const isEditing =
                    editingItemId ===
                    itemId;

                  return (
                    <article
                      key={itemId}
                      className="
                        overflow-hidden
                        rounded-[12px]
                        border
                        border-[#E5E7EB]
                        bg-white
                      "
                    >
                      {/* =======================================
                          PRODUCT HEADER
                      ======================================= */}

                      <div className="p-4 sm:p-5">
                        <div className="flex gap-3.5 sm:gap-5">

                          {/* PRODUCT IMAGE */}

                          <Link
                            href={`/products/${encodeURIComponent(
                              item.productId
                            )}`}
                            className="
                              relative
                              h-[86px]
                              w-[86px]
                              shrink-0
                              overflow-hidden
                              rounded-[9px]
                              border
                              border-[#E5E7EB]
                              bg-[#F5F4F0]
                              sm:h-[112px]
                              sm:w-[112px]
                            "
                          >
                            <Image
                              src={
                                item.image ||
                                FALLBACK_IMAGE
                              }
                              alt={
                                item.name
                              }
                              fill
                              sizes="
                                (max-width: 639px) 86px,
                                112px
                              "
                              className="object-cover transition-transform duration-200 md:hover:scale-[1.02]"
                            />
                          </Link>

                          {/* PRODUCT INFO */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#B9954F] sm:text-[9px]">
                                  Product
                                </p>

                                <Link
                                  href={`/products/${encodeURIComponent(
                                    item.productId
                                  )}`}
                                  className="
                                    line-clamp-2
                                    text-[14px]
                                    font-extrabold
                                    leading-5
                                    text-[#0A1B2E]
                                    transition-colors
                                    duration-150
                                    hover:text-[#B9954F]
                                    sm:text-base
                                  "
                                >
                                  {
                                    item.name
                                  }
                                </Link>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemove(
                                    itemId
                                  )
                                }
                                disabled={
                                  isUpdating
                                }
                                aria-label={`Remove ${item.name}`}
                                className="
                                  flex
                                  h-9
                                  w-9
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  text-[#94A3B8]
                                  transition-colors
                                  duration-150
                                  hover:bg-red-50
                                  hover:text-red-600
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                  sm:hidden
                                "
                              >
                                <TrashIcon />
                              </button>
                            </div>

                            {/* OPTIONS */}

                            {options.length >
                              0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {options.map(
                                  ([
                                    key,
                                    value,
                                  ]) => (
                                    <span
                                      key={`${key}-${value}`}
                                      className="max-w-full rounded-[5px] bg-[#F5F5F2] px-2 py-1 text-[9px] font-semibold text-[#64748B]"
                                    >
                                      <span className="text-[#94A3B8]">
                                        {
                                          key
                                        }
                                        :
                                      </span>{" "}
                                      {
                                        value
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            )}

                            {/* PRICE */}

                            <p className="mt-3 text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                              {formatPrice(
                                item.price
                              )}
                            </p>
                          </div>
                        </div>

                        {/* =====================================
                            QUANTITY + REMOVE
                        ===================================== */}

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EEF0F2] pt-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                              Quantity
                            </p>

                            <div className="mt-1.5 flex h-10 items-center overflow-hidden rounded-[8px] border border-[#DDE2E7] bg-white">
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(
                                    itemId,
                                    item.quantity,
                                    item.quantity -
                                      1
                                  )
                                }
                                disabled={
                                  isUpdating ||
                                  item.quantity <=
                                    1
                                }
                                aria-label="Decrease quantity"
                                className="
                                  flex
                                  h-10
                                  w-10
                                  items-center
                                  justify-center
                                  text-[#0A1B2E]
                                  transition-colors
                                  duration-150
                                  hover:bg-[#F7F7F5]
                                  disabled:cursor-not-allowed
                                  disabled:opacity-30
                                "
                              >
                                <MinusIcon />
                              </button>

                              <span className="flex h-10 min-w-[40px] items-center justify-center border-x border-[#DDE2E7] text-xs font-extrabold text-[#0A1B2E]">
                                {
                                  item.quantity
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(
                                    itemId,
                                    item.quantity,
                                    item.quantity +
                                      1
                                  )
                                }
                                disabled={
                                  isUpdating
                                }
                                aria-label="Increase quantity"
                                className="
                                  flex
                                  h-10
                                  w-10
                                  items-center
                                  justify-center
                                  text-[#0A1B2E]
                                  transition-colors
                                  duration-150
                                  hover:bg-[#F7F7F5]
                                  disabled:cursor-not-allowed
                                  disabled:opacity-30
                                "
                              >
                                <PlusIcon />
                              </button>
                            </div>
                          </div>

                          <div className="hidden sm:block">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemove(
                                  itemId
                                )
                              }
                              disabled={
                                isUpdating
                              }
                              className="
                                inline-flex
                                min-h-9
                                items-center
                                gap-1.5
                                rounded-[7px]
                                px-3
                                text-xs
                                font-semibold
                                text-[#64748B]
                                transition-colors
                                duration-150
                                hover:bg-red-50
                                hover:text-red-600
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                              "
                            >
                              <TrashIcon />
                              Remove
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                              Item Total
                            </p>

                            <p className="mt-1 text-sm font-extrabold text-[#0A1B2E] sm:text-base">
                              {formatPrice(
                                Number(
                                  item.price
                                ) *
                                  Number(
                                    item.quantity
                                  )
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* =======================================
                          PRINT IMAGES
                      ======================================= */}

                      <div className="border-t border-[#E5E7EB] bg-[#FAFAF8] p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-extrabold text-[#0A1B2E]">
                                Print Images
                              </h3>

                              <span
                                className={`
                                  rounded-full
                                  px-2.5
                                  py-1
                                  text-[9px]
                                  font-extrabold
                                  ${
                                    ready
                                      ? "bg-green-50 text-green-700"
                                      : "bg-[#F5F2E8] text-[#8B6E32]"
                                  }
                                `}
                              >
                                {
                                  readyUnits
                                }
                                /
                                {
                                  item.quantity
                                }{" "}
                                ready
                              </span>
                            </div>

                            <p className="mt-1 text-[10px] leading-5 text-[#64748B] sm:text-xs">
                              Each physical
                              product needs
                              1–3 print images.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              startCustomization(
                                item
                              )
                            }
                            disabled={
                              isUpdating
                            }
                            className="
                              inline-flex
                              min-h-10
                              w-full
                              items-center
                              justify-center
                              rounded-[8px]
                              bg-[#0A1B2E]
                              px-4
                              text-xs
                              font-extrabold
                              text-white
                              transition-colors
                              duration-150
                              hover:bg-[#142C46]
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                              sm:w-auto
                            "
                          >
                            {ready
                              ? "Edit Images"
                              : "Add Images"}
                          </button>
                        </div>

                        {/* SMALL PREVIEWS */}

                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                          {item.printUnits.map(
                            (
                              unit,
                              index
                            ) => (
                              <div
                                key={
                                  unit.unitId
                                }
                                className={`
                                  relative
                                  h-[58px]
                                  w-[58px]
                                  shrink-0
                                  overflow-hidden
                                  rounded-[8px]
                                  border
                                  bg-white
                                  sm:h-[64px]
                                  sm:w-[64px]
                                  ${
                                    unit.images
                                      .length >
                                    0
                                      ? "border-green-200"
                                      : "border-[#E6D6A9]"
                                  }
                                `}
                              >
                                {unit.images
                                  .length >
                                0 ? (
                                  <>
                                    <Image
                                      src={
                                        unit
                                          .images[0]
                                          .url
                                      }
                                      alt={`Product ${
                                        index +
                                        1
                                      } print preview`}
                                      fill
                                      sizes="64px"
                                      className="object-cover"
                                    />

                                    <span className="absolute bottom-1 left-1 rounded-[4px] bg-[#0A1B2E]/85 px-1.5 py-0.5 text-[8px] font-bold text-white">
                                      {
                                        unit
                                          .images
                                          .length
                                      }
                                    </span>
                                  </>
                                ) : (
                                  <div className="flex h-full w-full flex-col items-center justify-center text-[#B9954F]">
                                    <UploadIcon />

                                    <span className="mt-0.5 text-[7px] font-bold">
                                      Product{" "}
                                      {
                                        index +
                                        1
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>

            {/* =================================================
                ORDER SUMMARY
            ================================================= */}

            <aside className="hidden lg:sticky lg:top-[104px] lg:col-span-4 lg:block">
              <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
                    Order
                  </p>

                  <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
                    Summary
                  </h2>
                </div>

                <div className="p-5">
                  {/* PRINT STATUS */}

                  {isCartPrintReady ? (
                    <div className="flex items-start gap-2.5 rounded-[9px] border border-green-200 bg-green-50 p-3">
                      <span className="mt-0.5 text-green-700">
                        <CheckIcon />
                      </span>

                      <div>
                        <p className="text-xs font-extrabold text-green-700">
                          Print images complete
                        </p>

                        <p className="mt-0.5 text-[10px] leading-4 text-green-600">
                          All physical
                          products are
                          ready for
                          checkout.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[9px] border border-[#E6D6A9] bg-[#FBF7E9] p-3">
                      <p className="text-xs font-extrabold text-[#8B6E32]">
                        Print images required
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-[#8B6E32]">
                        Add at least one
                        image for every
                        physical product
                        before checkout.
                      </p>
                    </div>
                  )}

                  {/* PRICE BREAKDOWN */}

                  <div className="mt-6 space-y-3.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#64748B]">
                        Items
                      </span>

                      <span className="font-bold text-[#0A1B2E]">
                        {itemCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#64748B]">
                        Subtotal
                      </span>

                      <span className="font-bold text-[#0A1B2E]">
                        {formatPrice(
                          subtotal
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#64748B]">
                        Delivery
                      </span>

                      <span className="text-right text-xs font-semibold text-[#0A1B2E]">
                        Calculated at
                        checkout
                      </span>
                    </div>
                  </div>

                  {/* TOTAL */}

                  <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#E5E7EB] pt-5">
                    <span className="text-sm font-extrabold text-[#0A1B2E]">
                      Total
                    </span>

                    <span className="text-2xl font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
                      {formatPrice(
                        subtotal
                      )}
                    </span>
                  </div>

                  {/* CHECKOUT */}

                  <button
                    type="button"
                    onClick={
                      handleCheckoutClick
                    }
                    disabled={
                      isUpdating ||
                      !isCartPrintReady
                    }
                    className="
                      mt-6
                      flex
                      h-13
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-[9px]
                      bg-[#0A1B2E]
                      px-5
                      text-sm
                      font-extrabold
                      text-white
                      transition-colors
                      duration-150
                      hover:bg-[#142C46]
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    Proceed to Checkout
                    <ArrowRightIcon />
                  </button>

                  {!isCartPrintReady && (
                    <p className="mt-3 text-center text-[10px] leading-4 text-[#8B6E32]">
                      Complete print images
                      before checkout.
                    </p>
                  )}

                  <p className="mt-4 text-center text-[10px] leading-4 text-[#94A3B8]">
                    Taxes and delivery are
                    calculated at checkout.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* ========================================================
          MOBILE CHECKOUT BAR
      ======================================================== */}

      {items.length >
        0 && (
        <div
          className="
            fixed
            inset-x-0
            bottom-0
            z-40
            border-t
            border-[#E5E7EB]
            bg-white
            px-3
            pb-[calc(0.75rem+env(safe-area-inset-bottom))]
            pt-3
            shadow-[0_-8px_28px_rgba(10,27,46,0.08)]
            lg:hidden
          "
        >
          <div className="mx-auto flex w-full max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                Total ·{" "}
                {itemCount}{" "}
                {itemCount ===
                1
                  ? "item"
                  : "items"}
              </p>

              <p className="mt-0.5 text-lg font-extrabold tracking-[-0.02em] text-[#0A1B2E]">
                {formatPrice(
                  subtotal
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleCheckoutClick
              }
              disabled={
                isUpdating ||
                !isCartPrintReady
              }
              className="
                flex
                h-12
                min-w-[145px]
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-[9px]
                bg-[#0A1B2E]
                px-4
                text-xs
                font-extrabold
                text-white
                transition-colors
                duration-150
                active:bg-[#081827]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Checkout
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PRINT CUSTOMIZATION MODAL
      ======================================================== */}

      {editingItemId && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-end
            justify-center
            bg-[#0A1B2E]/50
            px-0
            sm:items-center
            sm:px-4
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-customization-title"
        >
          <div
            className="
              flex
              max-h-[92svh]
              w-full
              flex-col
              overflow-hidden
              rounded-t-[16px]
              bg-white
              shadow-[0_-10px_50px_rgba(10,27,46,0.18)]
              sm:max-h-[88svh]
              sm:max-w-2xl
              sm:rounded-[14px]
            "
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E5E7EB] px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#B9954F]">
                  Custom Printing
                </p>

                <h2
                  id="print-customization-title"
                  className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-xl"
                >
                  Add Print Images
                </h2>

                <p className="mt-1 text-[10px] leading-5 text-[#64748B] sm:text-xs">
                  Add 1–3 images for
                  each physical product.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCustomization
                }
                disabled={
                  savingCustomization ||
                  Boolean(
                    uploadingKey
                  )
                }
                aria-label="Close print customization"
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-[#64748B]
                  transition-colors
                  duration-150
                  hover:bg-[#F7F7F5]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <XIcon />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
              {customizationError && (
                <div className="mb-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-3">
                  <p className="text-xs font-semibold leading-5 text-red-600">
                    {
                      customizationError
                    }
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {draftUnits.map(
                  (
                    unit,
                    index
                  ) => (
                    <PrintUnitCard
                      key={
                        unit.unitId
                      }
                      unit={unit}
                      index={
                        index
                      }
                      onUpload={(
                        file
                      ) =>
                        handleImageUpload(
                          index,
                          file
                        )
                      }
                      onRemove={(
                        imageIndex
                      ) =>
                        removeDraftImage(
                          index,
                          imageIndex
                        )
                      }
                      uploading={
                        Boolean(
                          uploadingKey?.startsWith(
                            unit.unitId
                          )
                        )
                      }
                      disabled={
                        savingCustomization ||
                        Boolean(
                          uploadingKey
                        )
                      }
                    />
                  )
                )}
              </div>

              {/* INFO */}

              <div className="mt-4 rounded-[9px] border border-[#E6D6A9] bg-[#FBF7E9] p-3.5">
                <p className="text-[10px] font-bold leading-5 text-[#8B6E32] sm:text-xs">
                  Supported images should
                  be clear and suitable
                  for printing. Maximum
                  5MB per image.
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#E5E7EB] bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-5 sm:py-4 sm:pb-4">
              <button
                type="button"
                onClick={
                  closeCustomization
                }
                disabled={
                  savingCustomization ||
                  Boolean(
                    uploadingKey
                  )
                }
                className="
                  min-h-11
                  w-full
                  rounded-[9px]
                  border
                  border-[#DDE2E7]
                  bg-white
                  px-5
                  text-sm
                  font-bold
                  text-[#64748B]
                  transition-colors
                  duration-150
                  hover:bg-[#F7F7F5]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSaveCustomization
                }
                disabled={
                  savingCustomization ||
                  Boolean(
                    uploadingKey
                  )
                }
                className="
                  inline-flex
                  min-h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[9px]
                  bg-[#0A1B2E]
                  px-6
                  text-sm
                  font-extrabold
                  text-white
                  transition-colors
                  duration-150
                  hover:bg-[#142C46]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                {savingCustomization ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Save Images
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BACKDROP CLICK */}

          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 -z-10 cursor-default"
            onClick={
              closeCustomization
            }
          />
        </div>
      )}
    </div>
  );
}