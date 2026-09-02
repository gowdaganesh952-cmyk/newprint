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
 */
export function normalizePhoneNumber(rawPhone?: string): string | null {
  if (!rawPhone) return null;

  let cleaned = rawPhone.trim();
  const hasPlus = cleaned.startsWith("+");

  cleaned = cleaned.replace(/\D/g, "");

  if (!cleaned) return null;

  if (hasPlus) {
    return cleaned;
  }

  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned;
  }

  return cleaned.length >= 10 ? cleaned : null;
}

/**
 * Customer tracking page.
 */
export function getCustomerTrackingUrl(orderId: string): string {
  return `https://newprint.kundapura.in/dashboard/orders/${orderId}/track`;
}

/**
 * SHIPPED
 *
 * IMPORTANT:
 * This message intentionally uses ASCII characters only.
 * Do not add emojis or Unicode separators here until
 * the message pipeline encoding issue is fixed.
 */
export function buildShippedWhatsAppMessage(
  order: WhatsAppOrderContext
): string {
  const trackingUrl = getCustomerTrackingUrl(order._id);

  const provider =
    order.shippingProvider?.trim() || "India Post";

  const customerName =
    order.shippingAddress?.fullName?.trim() || "Customer";

  return `*ORDER SHIPPED!*

Hi ${customerName},

Great news! Your *NEW PRINT* order is officially on its way.

*Order:* #${order.orderNumber}
*Courier:* ${provider}
*Status:* Shipped

------------------------------

*TRACK YOUR ORDER*

Check your latest order status and tracking information here:

${trackingUrl}

------------------------------

*WHAT'S NEXT?*

Your package is now with the courier and making its way to you.

We will keep you updated when your order reaches the next stage.

Thank you for choosing *NEW PRINT*!

If you have any questions about your order, simply reply to this WhatsApp message and our team will help you.

- NEW PRINT`;
}

/**
 * DELIVERED
 */
export function buildDeliveredWhatsAppMessage(
  order: WhatsAppOrderContext
): string {
  const trackingUrl = getCustomerTrackingUrl(order._id);

  const customerName =
    order.shippingAddress?.fullName?.trim() || "Customer";

  return `*ORDER DELIVERED!*

Hi ${customerName},

Your *NEW PRINT* order has been delivered successfully.

*Order:* #${order.orderNumber}
*Status:* Delivered

------------------------------

*WE HOPE YOU LOVE IT!*

Your order has safely reached you.

You can view your order details anytime here:

${trackingUrl}

------------------------------

*NEED HELP?*

If there is any issue with your order, don't worry.

Just reply to this WhatsApp message and our team will be happy to help.

Thank you for supporting *NEW PRINT*!

We hope to see you again soon.

- NEW PRINT`;
}

/**
 * OUT FOR DELIVERY
 */
export function buildOutForDeliveryWhatsAppMessage(
  order: WhatsAppOrderContext
): string {
  const trackingUrl = getCustomerTrackingUrl(order._id);

  const provider =
    order.shippingProvider?.trim() || "your courier";

  const customerName =
    order.shippingAddress?.fullName?.trim() || "Customer";

  return `*OUT FOR DELIVERY!*

Hi ${customerName},

Your *NEW PRINT* order is almost at your doorstep.

*Order:* #${order.orderNumber}
*Courier:* ${provider}
*Status:* Out for Delivery

------------------------------

*EXPECTED SOON*

Your package is currently out for delivery.

Please keep your phone available in case the delivery partner needs to contact you.

------------------------------

*CHECK ORDER STATUS*

${trackingUrl}

------------------------------

Thank you for choosing *NEW PRINT*!

- NEW PRINT`;
}

/**
 * CANCELLED
 */
export function buildCancelledWhatsAppMessage(
  order: WhatsAppOrderContext
): string {
  const trackingUrl = getCustomerTrackingUrl(order._id);

  const customerName =
    order.shippingAddress?.fullName?.trim() || "Customer";

  return `*ORDER UPDATE*

Hi ${customerName},

Your *NEW PRINT* order #${order.orderNumber} has been cancelled.

*Order:* #${order.orderNumber}
*Status:* Cancelled

------------------------------

You can view your order details here:

${trackingUrl}

------------------------------

*HAVE QUESTIONS?*

If you believe this cancellation was unexpected or you need more information, simply reply to this WhatsApp message.

Our team will be happy to help.

- NEW PRINT`;
}

/**
 * Creates WhatsApp click-to-chat URL.
 */
export function buildWhatsAppUrl(
  phone: string,
  message: string
): string | null {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone) {
    return null;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}