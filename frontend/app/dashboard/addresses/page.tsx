"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import AddressModal from "../../components/account/AddressModal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

interface AddressFormData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { getToken } = useAuth();

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const fetchAddresses =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const token =
          await getToken();

        const res = await fetch(
          `${API_URL}/api/addresses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to fetch addresses"
          );
        }

        const data =
          await res.json();

        setAddresses(
          Array.isArray(
            data.addresses
          )
            ? data.addresses
            : []
        );
      } catch (error) {
        console.error(
          "Failed to fetch addresses:",
          error
        );

        setAddresses([]);
      } finally {
        setIsLoading(false);
      }
    }, [getToken]);

  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenAddModal =
    () => {
      setEditingAddress(null);
      setIsModalOpen(true);
    };

  const handleOpenEditModal = (
    address: Address
  ) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (
    formData: AddressFormData
  ) => {
    setIsSubmitting(true);

    try {
      const token =
        await getToken();

      const method = editingAddress
        ? "PUT"
        : "POST";

      const endpoint =
        editingAddress
          ? `${API_URL}/api/addresses/${editingAddress._id}`
          : `${API_URL}/api/addresses`;

      const res = await fetch(
        endpoint,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            formData
          ),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to save address"
        );
      }

      await fetchAddresses();

      setIsModalOpen(false);
      setEditingAddress(null);
    } catch (error) {
      console.error(
        "Save address error:",
        error
      );

      window.alert(
        "Failed to save address. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress =
    async (id: string) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to delete this address?"
        );

      if (!confirmed) {
        return;
      }

      setActionId(id);

      try {
        const token =
          await getToken();

        const res = await fetch(
          `${API_URL}/api/addresses/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to delete address"
          );
        }

        await fetchAddresses();
      } catch (error) {
        console.error(
          "Delete address error:",
          error
        );

        window.alert(
          "Failed to delete address. Please try again."
        );
      } finally {
        setActionId(null);
      }
    };

  const handleSetDefault =
    async (id: string) => {
      setActionId(id);

      try {
        const token =
          await getToken();

        const res = await fetch(
          `${API_URL}/api/addresses/${id}/default`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to set default address"
          );
        }

        await fetchAddresses();
      } catch (error) {
        console.error(
          "Set default address error:",
          error
        );

        window.alert(
          "Failed to update default address. Please try again."
        );
      } finally {
        setActionId(null);
      }
    };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#0A1B2E] sm:text-2xl">
            Saved Addresses
          </h2>

          <p className="mt-1 text-sm text-[#64748B]">
            Manage your delivery addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleOpenAddModal
          }
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#142C46] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2"
        >
          <span className="hidden sm:inline">
            + Add New Address
          </span>

          <span className="sm:hidden">
            + Add
          </span>
        </button>
      </div>

      {/* Loading */}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-[14px] border border-[#E5E7EB] bg-white"
            />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        /* Empty */

        <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-8 text-center shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F7F5] text-[#64748B]">
            +
          </div>

          <h3 className="mt-4 font-bold text-[#0A1B2E]">
            No saved addresses
          </h3>

          <p className="mt-1 text-sm text-[#64748B]">
            Add an address for faster
            checkout.
          </p>

          <button
            type="button"
            onClick={
              handleOpenAddModal
            }
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#0A1B2E] px-6 text-sm font-semibold text-white transition-all hover:bg-[#142C46] active:scale-[0.98]"
          >
            Add New Address
          </button>
        </div>
      ) : (
        /* Addresses */

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map(
            (address) => (
              <article
                key={address._id}
                className="flex min-w-0 flex-col rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_12px_-8px_rgba(10,27,46,0.25)] sm:p-5"
              >
                {/* Address */}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 break-words text-base font-bold text-[#0A1B2E]">
                      {address.fullName}
                    </h3>

                    {address.isDefault && (
                      <span className="shrink-0 rounded-full border border-[#B9954F]/20 bg-[#B9954F]/10 px-2.5 py-1 text-[11px] font-bold text-[#9A7839]">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-sm leading-5 text-[#64748B]">
                    <p>
                      {address.phone}
                    </p>

                    <p className="pt-1">
                      {
                        address.addressLine1
                      }
                    </p>

                    {address.addressLine2 && (
                      <p>
                        {
                          address.addressLine2
                        }
                      </p>
                    )}

                    <p>
                      {address.city},{" "}
                      {address.state}{" "}
                      {address.pincode}
                    </p>

                    {address.landmark && (
                      <p className="pt-1 text-xs italic text-[#94A3B8]">
                        Landmark:{" "}
                        {
                          address.landmark
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}

                <div className="mt-5 flex flex-col gap-3 border-t border-[#E5E7EB] pt-4">
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={
                        actionId ===
                        address._id
                      }
                      onClick={() =>
                        handleSetDefault(
                          address._id
                        )
                      }
                      className="inline-flex min-h-[42px] items-center justify-center rounded-[9px] border border-[#E5E7EB] px-4 text-sm font-semibold text-[#0A1B2E] transition-all hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionId ===
                      address._id
                        ? "Updating..."
                        : "Set as Default"}
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenEditModal(
                          address
                        )
                      }
                      className="min-h-[42px] rounded-[9px] border border-[#E5E7EB] px-3 text-sm font-semibold text-[#0A1B2E] transition-all hover:bg-[#F7F7F5] active:scale-[0.98]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionId ===
                        address._id
                      }
                      onClick={() =>
                        handleDeleteAddress(
                          address._id
                        )
                      }
                      className="min-h-[42px] rounded-[9px] border border-red-100 px-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionId ===
                      address._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      {/* Home */}

      <div>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#0A1B2E] transition-all hover:border-[#B9954F]/50 hover:bg-[#F7F7F5] active:scale-[0.98]"
        >
          ← Continue Shopping
        </Link>
      </div>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        onSave={handleSaveAddress}
        address={editingAddress}
        isSubmitting={
          isSubmitting
        }
      />
    </div>
  );
}