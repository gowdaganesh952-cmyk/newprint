"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import AddressModal from "../../components/account/AddressModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AddressesPage() {
  const { getToken } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (formData) => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const method = editingAddress ? "PUT" : "POST";
      const endpoint = editingAddress 
        ? `${API_URL}/api/addresses/${editingAddress._id}` 
        : `${API_URL}/api/addresses`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchAddresses();
        setIsModalOpen(false);
      } else {
        alert("Failed to save address.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/addresses/${id}/default`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error("Set default failed", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0A1B2E]">Saved Addresses</h2>
        <button 
          onClick={handleOpenAddModal}
          className="rounded-[10px] bg-[#0A1B2E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#142C46]"
        >
          + Add New
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 rounded-[12px] bg-[#E5E7EB] animate-pulse"></div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
          <p className="text-[#64748B] mb-6">No saved addresses yet.</p>
          <button 
            onClick={handleOpenAddModal}
            className="inline-block rounded-[10px] bg-[#0A1B2E] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#142C46]"
          >
            Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr._id} className="relative rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#0A1B2E] text-base">{addr.fullName}</h3>
                  {addr.isDefault && (
                    <span className="rounded-full bg-[#F7F7F5] px-3 py-1 text-xs font-semibold text-[#B9954F] border border-[#E5E7EB]">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#64748B] space-y-1">
                  <p>{addr.phone}</p>
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>{addr.city}, {addr.state} {addr.pincode}</p>
                  {addr.landmark && <p className="italic">Landmark: {addr.landmark}</p>}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                {!addr.isDefault ? (
                  <button onClick={() => handleSetDefault(addr._id)} className="text-sm font-medium text-[#0A1B2E] hover:text-[#B9954F]">
                    Set as Default
                  </button>
                ) : <div></div>}
                <div className="flex gap-4">
                  <button onClick={() => handleOpenEditModal(addr)} className="text-sm font-medium text-[#0A1B2E] hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteAddress(addr._id)} className="text-sm font-medium text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveAddress}
        address={editingAddress}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}