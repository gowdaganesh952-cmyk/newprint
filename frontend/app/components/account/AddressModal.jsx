"use client";

import { useState, useEffect } from "react";

export default function AddressModal({ isOpen, onClose, onSave, address, isSubmitting }) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    isDefault: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
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
        isDefault: address.isDefault || false
      });
    } else {
      setFormData({
        fullName: "", phone: "", addressLine1: "", addressLine2: "", 
        city: "", state: "", pincode: "", landmark: "", isDefault: false
      });
    }
    setErrors({});
  }, [address, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    let newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) newErrors.phone = "Valid 10-digit phone number is required";
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) newErrors.pincode = "Valid 6-digit pincode is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 transition-opacity">
      <div className="w-full max-w-lg rounded-t-[14px] sm:rounded-[14px] bg-white shadow-xl max-h-[90vh] flex flex-col">
        
        <div className="flex items-center justify-between border-b border-[#E5E7EB] p-5 shrink-0">
          <h3 className="text-lg font-bold text-[#0A1B2E]">
            {address ? "Edit Address" : "Add New Address"}
          </h3>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:text-[#0A1B2E] transition-colors rounded-full hover:bg-[#F7F7F5]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          <form id="address-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-[#0A1B2E] mb-1">Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A1B2E] mb-1">Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A1B2E] mb-1">Address Line 1 *</label>
              <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
              {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A1B2E] mb-1">Address Line 2 (Optional)</label>
              <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0A1B2E] mb-1">City *</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0A1B2E] mb-1">State *</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
                {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0A1B2E] mb-1">Pincode *</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} maxLength="6" className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
                {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0A1B2E] mb-1">Landmark (Optional)</label>
                <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="w-full rounded-[10px] border border-[#E5E7EB] h-11 px-3 text-sm focus:border-[#B9954F] focus:outline-none focus:ring-1 focus:ring-[#B9954F] transition-all" />
              </div>
            </div>

            <div className="pt-2 flex items-center">
              <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="h-4 w-4 rounded border-[#E5E7EB] text-[#0A1B2E] focus:ring-[#B9954F]" />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-[#0A1B2E]">
                Make this my default address
              </label>
            </div>
            
          </form>
        </div>

        <div className="border-t border-[#E5E7EB] p-5 shrink-0 bg-[#F7F7F5] sm:rounded-b-[14px]">
          <button 
            type="submit" 
            form="address-form" 
            disabled={isSubmitting}
            className="w-full rounded-[10px] bg-[#0A1B2E] h-12 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#142C46] disabled:bg-[#64748B] flex items-center justify-center"
          >
            {isSubmitting ? "Saving..." : "Save Address"}
          </button>
        </div>

      </div>
    </div>
  );
}