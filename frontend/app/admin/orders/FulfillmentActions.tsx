// path: frontend/components/admin/orders/FulfillmentActions.tsx
import { Dispatch, SetStateAction, FormEvent } from "react";
import { 
  buildShippedWhatsAppMessage, 
  buildDeliveredWhatsAppMessage, 
  buildWhatsAppUrl, 
  normalizePhoneNumber 
} from "@/app/lib/whatsapp";

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
  orderNumber?: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
  };
  shippingProvider?: string;
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
  orderNumber = "",
  shippingAddress,
  shippingProvider = "India Post",
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

  // WhatsApp helper click handler
  const handleOpenWhatsApp = (type: "shipped" | "delivered") => {
    if (!shippingAddress?.phone) return;

    const orderContext = {
      _id: orderId,
      orderNumber,
      shippingAddress,
      shippingProvider,
    };

    const message = type === "shipped" 
      ? buildShippedWhatsAppMessage(orderContext)
      : buildDeliveredWhatsAppMessage(orderContext);

    const whatsappUrl = buildWhatsAppUrl(shippingAddress.phone, message);
    if (!whatsappUrl) {
      window.alert("Invalid customer phone number format for WhatsApp.");
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const hasValidPhone = Boolean(normalizePhoneNumber(shippingAddress?.phone));

  return (
    <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B9954F]">Operations & Logistics</span>
          <h2 className="text-base font-extrabold text-[#0A1B2E] mt-0.5">India Post Fulfillment</h2>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A1B2E] text-white">
          <svg className="h-4 w-4 text-[#B9954F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
      </div>

      {orderStatus === "Confirmed" && (
        <form onSubmit={handleMarkShipped} className="mt-5 space-y-4">
          <div className="rounded-[10px] bg-[#F7F7F5] border border-[#E5E7EB] p-3 text-xs text-[#64748B]">
            <p className="font-bold text-[#0A1B2E] mb-0.5">Ready to Dispatch</p>
            Enter the India Post consignment tracking number below to notify the customer and transition the order to Shipped.
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#0A1B2E] mb-1.5">Consignment Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. ED123456789IN"
              value={consignmentNumber}
              onChange={(e) => setConsignmentNumber(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-xs font-mono uppercase font-bold text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/10 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#0A1B2E] mb-1.5">Tracking URL (Optional)</label>
            <input
              type="url"
              placeholder="https://www.indiapost.gov.in/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-xs font-medium text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/10 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#0A1B2E] mb-1.5">Internal Shipping Notes</label>
            <textarea
              rows={2}
              placeholder="Packed in standard bubble mailer..."
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-white p-3 text-xs font-medium text-[#0A1B2E] outline-none transition-all focus:border-[#B9954F] focus:ring-2 focus:ring-[#B9954F]/10 shadow-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex min-h-[46px] w-full items-center justify-center rounded-[10px] bg-[#0A1B2E] px-4 text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:bg-[#142C46] active:scale-[0.98] disabled:opacity-50 shadow-md shadow-[#0A1B2E]/10"
          >
            {isUpdating ? "Processing Shipment..." : "Mark as Shipped →"}
          </button>
        </form>
      )}

      {orderStatus === "Shipped" && (
        <div className="mt-5 space-y-5">
          <div className="rounded-[12px] border border-blue-200 bg-blue-50/70 p-4 text-xs leading-relaxed text-blue-950">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              <p className="font-extrabold text-sm text-blue-900">In Transit with {shippingProvider}</p>
            </div>
            <p className="font-mono text-xs mb-1">Consignment: <strong className="text-blue-950">{consignmentNumber}</strong></p>
            {shippedAt && <p className="text-blue-800 text-[11px]">Shipped on: {new Date(shippedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>}
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-bold text-[#0A1B2E] bg-white/80 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-white transition">
                <span>Track Shipment</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}
          </div>

          {/* WhatsApp Customer Update Section */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F7F7F5] p-4 space-y-3">
            <div>
              <p className="text-xs font-extrabold text-[#0A1B2E]">Customer Update</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Let the customer know their order is on the way.</p>
            </div>

            {hasValidPhone ? (
              <button
                type="button"
                onClick={() => handleOpenWhatsApp("shipped")}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#25D366] px-4 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-[#20ba5a] active:scale-[0.98]"
              >
                <span>WhatsApp Customer</span>
                <span className="text-sm">→</span>
              </button>
            ) : (
              <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                <p className="font-bold">WhatsApp unavailable</p>
                <p className="mt-0.5">No valid customer phone number is available for this order.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleMarkDelivered}
            disabled={isUpdating}
            className="flex min-h-[46px] w-full items-center justify-center rounded-[10px] bg-emerald-700 px-4 text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-emerald-700/10"
          >
            {isUpdating ? "Updating Status..." : "Mark as Delivered ✓"}
          </button>
        </div>
      )}

      {orderStatus === "Delivered" && (
        <div className="mt-5 space-y-5">
          <div className="rounded-[12px] border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 leading-relaxed">
            <div className="flex items-center gap-2 mb-1.5 font-extrabold text-sm text-emerald-950">
              <span>✓</span>
              <p>Delivered Successfully</p>
            </div>
            {deliveredAt && <p className="text-emerald-800">Delivered on: {new Date(deliveredAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>}
            {consignmentNumber && <p className="font-mono mt-1 text-[11px]">Consignment: {consignmentNumber}</p>}
          </div>

          {/* WhatsApp Customer Update Section for Delivered */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F7F7F5] p-4 space-y-3">
            <div>
              <p className="text-xs font-extrabold text-[#0A1B2E]">Customer Update</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Send the customer a delivery confirmation.</p>
            </div>

            {hasValidPhone ? (
              <button
                type="button"
                onClick={() => handleOpenWhatsApp("delivered")}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#25D366] px-4 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-[#20ba5a] active:scale-[0.98]"
              >
                <span>WhatsApp Customer</span>
                <span className="text-sm">→</span>
              </button>
            ) : (
              <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                <p className="font-bold">WhatsApp unavailable</p>
                <p className="mt-0.5">No valid customer phone number is available for this order.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {orderStatus === "Not Completed" && (
        <div className="mt-5 rounded-[12px] border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
          <div className="flex items-center gap-2 mb-1 font-extrabold text-amber-950">
            <span>⚠</span>
            <p>Payment Pending / Not Completed</p>
          </div>
          <p className="text-amber-800">Fulfillment actions are disabled until the customer completes payment verification.</p>
        </div>
      )}

      {orderStatus === "Cancelled" && (
        <div className="mt-5 rounded-[12px] border border-red-200 bg-red-50/70 p-4 text-xs text-red-900 leading-relaxed">
          <div className="flex items-center gap-2 mb-1 font-extrabold text-red-950">
            <span>✕</span>
            <p>Order Cancelled</p>
          </div>
          <p className="text-red-800">This order has been cancelled. No fulfillment actions can be performed.</p>
        </div>
      )}
    </section>
  );
}
