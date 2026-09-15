
/* ============================================================
   NEW PRINT SHIPPING CALCULATOR
============================================================ */

/*
 * SINGLE shipping calculation used by the backend.
 *
 * Product.weight is stored in grams.
 *
 * SHIPPING RULE
 *
 * First 500 grams       = ₹15
 * Every additional
 * 500 grams             = ₹20
 *
 * MAXIMUM SHIPPING      = ₹100
 *
 * If calculated shipping goes above ₹100,
 * automatically reduce it to ₹100.
 *
 * Examples:
 *
 * 100g  -> ₹15
 * 300g  -> ₹15
 * 500g  -> ₹15
 * 501g  -> ₹35
 * 900g  -> ₹35
 * 1000g -> ₹35
 * 1001g -> ₹55
 *
 * Maximum:
 *
 * Calculated ₹115 -> ₹100
 * Calculated ₹135 -> ₹100
 * Calculated ₹500 -> ₹100
 *
 * Shipping will NEVER exceed ₹100.
 */

/* ============================================================
   SHIPPING CONFIGURATION
============================================================ */

export const SHIPPING_CONFIG = {
    /*
     * First shipping slab.
     */
    baseWeightGrams: 500,

    /*
     * First slab price.
     */
    baseFee: 15,

    /*
     * Size of every additional slab.
     */
    additionalWeightGrams: 500,

    /*
     * Price for every additional slab.
     */
    additionalFee: 20,

    /*
     * Maximum shipping charge.
     *
     * IMPORTANT:
     * Shipping can never go above ₹100.
     */
    maxShippingFee: 100,
};

/* ============================================================
   ROUND MONEY
============================================================ */

export function roundMoney(amount) {
    return (
        Math.round(
            Number(amount) * 100
        ) / 100
    );
}

/* ============================================================
   CALCULATE SHIPPING FROM WEIGHT
============================================================ */

export function calculateShippingFee(totalWeightGrams) {
    const weight = Number(totalWeightGrams);

    /*
     * Empty / invalid cart.
     */
    if (
        !Number.isFinite(weight) ||
        weight <= 0
    ) {
        return 0;
    }

    /*
     * First 500g = ₹15.
     */
    let shippingFee =
        SHIPPING_CONFIG.baseFee;

    /*
     * Weight above first 500g.
     */
    const remainingWeight =
        Math.max(
            0,
            weight -
                SHIPPING_CONFIG.baseWeightGrams
        );

    /*
     * Additional slabs.
     */
    if (remainingWeight > 0) {
        const additionalSlabs =
            Math.ceil(
                remainingWeight /
                    SHIPPING_CONFIG.additionalWeightGrams
            );

        shippingFee +=
            additionalSlabs *
            SHIPPING_CONFIG.additionalFee;
    }

    /*
     * ========================================================
     * MAXIMUM SHIPPING LIMIT
     * ========================================================
     *
     * If calculated shipping is more than ₹100,
     * reduce it to exactly ₹100.
     *
     * Any amount above ₹100 is capped.
     */
    shippingFee =
        Math.min(
            shippingFee,
            SHIPPING_CONFIG.maxShippingFee
        );

    /*
     * Return final shipping charge.
     *
     * Maximum possible return value = ₹100.
     */
    return roundMoney(shippingFee);
}

/* ============================================================
   CALCULATE TOTAL CART WEIGHT
============================================================ */

export function calculateCartWeight(items) {
    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce(
        (total, item) => {
            const weight =
                Number(
                    item?.productWeight
                );

            const quantity =
                Number(
                    item?.quantity
                );

            if (
                !Number.isFinite(weight) ||
                weight <= 0
            ) {
                return total;
            }

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return total;
            }

            return (
                total +
                weight * quantity
            );
        },
        0
    );
}

/* ============================================================
   CALCULATE CART SHIPPING
============================================================ */

export function calculateCartShipping(items) {
    const totalWeight =
        calculateCartWeight(items);

    const shippingCharge =
        calculateShippingFee(
            totalWeight
        );

    return {
        totalWeight,
        shippingCharge,
    };
}