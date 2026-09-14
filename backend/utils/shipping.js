
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
 * Example:
 *
 * Product = ₹1
 * Weight <= 500g
 *
 * Shipping = ₹15
 * Total = ₹16
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
     *
     * FIXED: ₹45 -> ₹15
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