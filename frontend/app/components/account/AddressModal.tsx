"use client";

import { useEffect, useState } from "react";

interface Address {
  _id?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
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

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: AddressFormData) => void | Promise<void>;
  address?: Address | null;
  isSubmitting: boolean;
}

const emptyForm: AddressFormData = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  isDefault: false,
};

export default function AddressModal({
  isOpen,
  onClose,
  onSave,
  address,
  isSubmitting,
}: AddressModalProps) {
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (address) {
      setFormData({
        fullName: address.fullName || "",
        phone: address.phone || "",
        addressLine1: address.addressLine1 || "",
        addressLine2: address.addressLine2 || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        landmark: address.landmark || "",
        isDefault: address.isDefault || false,
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [address, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!/^\d{10}$/.test(formData.phone.trim())) newErrors.phone = "Enter a valid 10-digit phone number";
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!/^\d{6}$/.test(formData.pincode.trim())) newErrors.pincode = "Enter a valid 6-digit pincode";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    await onSave(formData);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof AddressFormData]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-[600] flex items-end justify-center
        bg-[#0A1B2E]/55 p-0 backdrop-blur-[2px] touch-none
        sm:items-center sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
    >
      <div
        className="
          flex max-h-[100dvh] w-full flex-col overflow-hidden
          rounded-t-[16px] bg-white shadow-2xl
          sm:max-h-[90dvh] sm:max-w-lg sm:rounded-[16px]
        "
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] px-4 py-4 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#B9954F]">
              Address
            </p>
            <h3 id="address-modal-title" className="mt-0.5 text-lg font-extrabold text-[#0A1B2E]">
              {address ? "Edit Address" : "Add New Address"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close address dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#F7F7F5] hover:text-[#0A1B2E] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation will-change-transform active:scale-[0.95]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-width:thin] sm:px-5">
          <form id="address-form" onSubmit={handleSubmit} className="space-y-4 pb-1">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                Full Name *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="addressLine1" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                Address Line 1 *
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                autoComplete="address-line1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
              />
              {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1}</p>}
            </div>

            <div>
              <label htmlFor="addressLine2" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                Address Line 2 <span className="font-normal text-[#94A3B8]"> (Optional)</span>
              </label>
              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                autoComplete="address-line2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
              <div>
                <label htmlFor="city" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={handleChange}
                  className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
                />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="state" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                  State *
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  autoComplete="address-level1"
                  value={formData.state}
                  onChange={handleChange}
                  className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
                />
                {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
              <div>
                <label htmlFor="pincode" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                  Pincode *
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                  className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
                />
                {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>}
              </div>

              <div>
                <label htmlFor="landmark" className="mb-1.5 block text-sm font-semibold text-[#0A1B2E]">
                  Landmark <span className="font-normal text-[#94A3B8]"> (Optional)</span>
                </label>
                <input
                  id="landmark"
                  name="landmark"
                  type="text"
                  value={formData.landmark}
                  onChange={handleChange}
                  className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-base text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/15 sm:text-sm"
                />
              </div>
            </div>

            <label htmlFor="isDefault" className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#F7F7F5] px-3.5 py-2.5">
              <input
                id="isDefault"
                name="isDefault"
                type="checkbox"
                checked={formData.isDefault}
                onChange={handleChange}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#0A1B2E] focus:ring-[#B9954F]"
              />
              <span className="text-sm font-medium text-[#0A1B2E]">
                Make this my default address
              </span>
            </label>
          </form>
        </div>

        <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
          <button
            type="submit"
            form="address-form"
            disabled={isSubmitting}
            className="flex min-h-[48px] w-full items-center justify-center rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-bold text-white transition-all duration-150 hover:bg-[#142C46] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#94A3B8] touch-manipulation will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9954F] focus-visible:ring-offset-2"
          >
            {isSubmitting ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
}