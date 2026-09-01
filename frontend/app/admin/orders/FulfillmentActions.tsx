// path: frontend/components/admin/orders/FulfillmentActions.tsx
import { Dispatch, SetStateAction, FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FulfillmentActionsProps {
  orderId: string;
  orderStatus: string;
  consignmentNumber: string;
  setConsignmentNumber: Dispatch<SetStateAction<string>>;
  trackingUrl: string;
  setTrackingUrl: Dispatch<SetStateAction<string>>;
  shippingNotes: string;
  setShippingNotes: Dispatch<SetStateAction<string>>;
  shippedAt?: string;
  deliveredAt?: string;
  isUpdating: boolean;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  onRefresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export default function FulfillmentActions({
  orderId,
  orderStatus,
  consignmentNumber,
  setConsignmentNumber,
  trackingUrl,
  setTrackingUrl,
  shippingNotes,
  setShippingNotes,
  shippedAt,
  deliveredAt,
  isUpdating,
  setIsUpdating,
  onRefresh,
  getToken,
}: FulfillmentActionsProps) {
  
  const handleMarkShipped = async (e: FormEvent) => {
    e.preventDefault();
    if (!consignmentNumber.trim()) {
      window.alert("Please provide an India Post consignment number.");
      return;
    }

    try {
      setIsUpdating(true);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/orders/admin/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          status: "Shipped",
          consignmentNumber: consignmentNumber.trim(),
          trackingUrl: trackingUrl.trim() || `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`,
          shippingNotes: shippingNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update shipment");

      await onRefresh();
      window.alert("Order marked as Shipped via India Post successfully.");
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : "Failed to update shipping.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!window.confirm("Are you sure this order has been delivered to the customer?")) return;

    try {
      setIsUpdating(true);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/orders/admin/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          status: "Delivered",
          shippingNotes: shippingNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to mark delivered");

      await onRefresh();
      window.alert("Order marked as Delivered successfully.");
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#B9954F]">
        Fulfillment Actions
      </p>
      <h2 className="mt-1 text-base font-extrabold text-[#0A1B2E]">
        India Post Shipping
      </h2>

      {orderStatus === "Confirmed" && (
        <form onSubmit={handleMarkShipped} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0A1B2E]">Consignment Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. ED123456789IN"
              value={consignmentNumber}
              onChange={(e) => setConsignmentNumber(e.target.value)}
              className="mt-1 h-10 w-full rounded-[8px] border border-[#E5E7EB] px-3 text-sm uppercase text-[#0A1B2E] outline-none focus:border-[#B9954F]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0A1B2E]">Tracking URL (Optional)</label>
            <input
              type="url"
              placeholder="https://www.indiapost.gov.in/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              className="mt-1 h-10 w-full rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#0A1B2E] outline-none focus:border-[#B9954F]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0A1B2E]">Shipping Notes (Internal)</label>
            <textarea
              rows={2}
              placeholder="Packed in standard bubble mailer..."
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
              className="mt-1 w-full rounded-[8px] border border-[#E5E7EB] p-2.5 text-sm text-[#0A1B2E] outline-none focus:border-[#B9954F]"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#0A1B2E] px-4 text-sm font-bold text-white transition-all hover:bg-[#142C46] active:scale-[0.98] disabled:opacity-50"
          >
            {isUpdating ? "Saving Shipment..." : "Mark as Shipped"}
          </button>
        </form>
      )}

      {orderStatus === "Shipped" && (
        <div className="mt-4 space-y-4">
          <div className="rounded-[8px] border border-blue-200 bg-blue-50/50 p-4 text-xs leading-5 text-blue-900">
            <p className="font-bold text-base mb-1 text-blue-950">Currently in Transit</p>
            <p>Consignment: <strong>{consignmentNumber}</strong></p>
            {shippedAt && <p>Shipped on: {new Date(shippedAt).toLocaleDateString("en-IN")}</p>}
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-bold text-[#B9954F] underline">
                Track with India Post →
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={handleMarkDelivered}
            disabled={isUpdating}
            className="flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-emerald-700 px-4 text-sm font-bold text-white transition-all hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Mark as Delivered ✓"}
          </button>
        </div>
      )}

      {orderStatus === "Delivered" && (
        <div className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50/40 p-4 text-xs text-emerald-800 leading-5">
          <p className="font-bold text-emerald-900 mb-1">Delivered Successfully</p>
          {deliveredAt && <p>Delivered on: {new Date(deliveredAt).toLocaleDateString("en-IN")}</p>}
          {consignmentNumber && <p>India Post: {consignmentNumber}</p>}
        </div>
      )}

      {orderStatus === "Not Completed" && (
        <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-800 leading-5">
          <p className="font-bold text-amber-900 mb-1">Payment Not Completed</p>
          <p>Shipping cannot proceed until the customer finishes payment.</p>
        </div>
      )}
    </section>
  );
}