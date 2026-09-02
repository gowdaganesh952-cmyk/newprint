// path: frontend/lib/whatsapp.ts

export interface WhatsAppOrderContext {
  _id: string;
  orderNumber: string;
  shippingAddress: {
    fullName: string;
    phone: string;
  };
  shippingProvider?: string;
}

/**
 * Safely normalizes customer phone numbers for WhatsApp wa.me links.
 * Handles 10-digit Indian numbers, numbers with +91, and international formats.
 */
export function normalizePhoneNumber(rawPhone?: string): string | null {
  if (!rawPhone) return null;
  
  // Remove all non-digit characters except leading plus
  let cleaned = rawPhone.trim();
  const hasPlus = cleaned.startsWith("+");
  cleaned = cleaned.replace(/\D/g, "");

  if (!cleaned) return null;

  // If it already has country code included or is international
  if (hasPlus) {
    return cleaned;
  }

  // If it's a 10-digit Indian mobile number
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  // If it's 12 digits starting with 91
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned;
  }

  // Default fallback for other valid lengths
  return cleaned.length >= 10 ? cleaned : null;
}

/**
 * Generates the correct customer-facing tracking URL using the order MongoDB _id.
 */
export function getCustomerTrackingUrl(orderId: string): string {
  return `https://newprint.kundapura.in/dashboard/orders/${orderId}/track`;
}

/**
 * Builds the professional, pre-filled WhatsApp message for Shipped orders.
 */
export function buildShippedWhatsAppMessage(order: WhatsAppOrderContext): string {
  const trackingUrl = getCustomerTrackingUrl(order._id);
  const provider = order.shippingProvider || "India Post";
  const customerName = order.shippingAddress?.fullName?.trim() || "Customer";

  return `Hi ${customerName} 👋

Great news! Your NEW PRINT order #${order.orderNumber} has been shipped. 📦

Your package is now on its way via ${provider}.

Track your order here:
${trackingUrl}

Thank you for choosing NEW PRINT! ❤️`;
}

/**
 * Builds the professional, pre-filled WhatsApp message for Delivered orders.
 */
export function buildDeliveredWhatsAppMessage(order: WhatsAppOrderContext): string {
  const trackingUrl = getCustomerTrackingUrl(order._id);
  const customerName = order.shippingAddress?.fullName?.trim() || "Customer";

  return `Hi ${customerName} 👋

Your NEW PRINT order #${order.orderNumber} has been delivered successfully. 🎉

We hope you love your order!

You can view your order here:
${trackingUrl}

Thank you for choosing NEW PRINT. ❤️`;
}

/**
 * Creates a safe, properly URL-encoded click-to-chat WhatsApp link.
 */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return null;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}