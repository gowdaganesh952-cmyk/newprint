/* ============================================================
   NEW PRINT SHIPPING CALCULATOR
============================================================ */

/*
 * IMPORTANT
 *
 * This is the SINGLE shipping calculation used
 * by the order/payment backend.
 *
 * Frontend NEVER decides shipping.
 *
 * Product.weight is stored in grams.
 *
 * ------------------------------------------------------------
 *
 * CURRENT SHIPPING RULE
 *
 * First 500 grams       = ₹45
 *
 * Every additional
 * 500 grams             = ₹20
 *
 * Examples:
 *
 * 100g  -> ₹45
 * 300g  -> ₹45
 * 500g  -> ₹45
 * 501g  -> ₹65
 * 900g  -> ₹65
 * 1000g -> ₹65
 * 1001g -> ₹85
 *
 * ------------------------------------------------------------
 *
 * Your current screenshot:
 *
 * Product = ₹349
 * Weight <= 500g
 *
 * Shipping = ₹45
 *
 * Total = ₹394
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
    baseFee: 45,

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

export function roundMoney(
    amount
) {
    return (
        Math.round(
            Number(amount) * 100
        ) / 100
    );
}

/* ============================================================
   CALCULATE SHIPPING FROM WEIGHT
============================================================ */

export function calculateShippingFee(
    totalWeightGrams
) {
    const weight =
        Number(
            totalWeightGrams
        );

    /*
     * Empty / invalid cart.
     */
    if (
        !Number.isFinite(
            weight
        ) ||
        weight <= 0
    ) {
        return 0;
    }

    /*
     * First 500g = ₹45.
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
    if (
        remainingWeight > 0
    ) {
        const additionalSlabs =
            Math.ceil(
                remainingWeight /
                    SHIPPING_CONFIG.additionalWeightGrams
            );

        shippingFee +=
            additionalSlabs *
            SHIPPING_CONFIG.additionalFee;
    }

    return roundMoney(
        shippingFee
    );
}

/* ============================================================
   CALCULATE TOTAL CART WEIGHT
============================================================ */

/*
 * items must contain:
 *
 * productWeight
 * quantity
 *
 * Example:
 *
 * productWeight = 300
 * quantity = 2
 *
 * total = 600g
 */

export function calculateCartWeight(
    items
) {
    if (
        !Array.isArray(
            items
        )
    ) {
        return 0;
    }

    return items.reduce(
        (
            total,
            item
        ) => {
            const weight =
                Number(
                    item?.productWeight
                );

            const quantity =
                Number(
                    item?.quantity
                );

            if (
                !Number.isFinite(
                    weight
                ) ||
                weight <= 0
            ) {
                return total;
            }

            if (
                !Number.isInteger(
                    quantity
                ) ||
                quantity < 1
            ) {
                return total;
            }

            return (
                total +
                weight *
                    quantity
            );
        },
        0
    );
}

/* ============================================================
   CALCULATE CART SHIPPING
============================================================ */

export function calculateCartShipping(
    items
) {
    const totalWeight =
        calculateCartWeight(
            items
        );

    const shippingCharge =
        calculateShippingFee(
            totalWeight
        );

    return {
        totalWeight,

        shippingCharge,
    };
}