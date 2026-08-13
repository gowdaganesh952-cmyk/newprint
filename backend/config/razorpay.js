import Razorpay from "razorpay";

/* ============================================================
   RAZORPAY CONFIGURATION
============================================================ */

const keyId =
  process.env.RAZORPAY_KEY_ID;

const keySecret =
  process.env.RAZORPAY_KEY_SECRET;

/* ============================================================
   ENV VALIDATION
============================================================ */

if (!keyId) {
  console.warn(
    "WARNING: RAZORPAY_KEY_ID is not configured."
  );
}

if (!keySecret) {
  console.warn(
    "WARNING: RAZORPAY_KEY_SECRET is not configured."
  );
}

/* ============================================================
   RAZORPAY INSTANCE
============================================================ */

const razorpay =
  new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

export default razorpay;