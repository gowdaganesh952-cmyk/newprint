/* ============================================================
   NEW PRINT SHIPPING CALCULATOR
============================================================ */

/*
 * SINGLE SOURCE OF TRUTH FOR SHIPPING
 *
 * Shipping is calculated ONLY from the total physical
 * product weight.
 *
 * BUSINESS RULE:
 *
 * ₹15 per 100 grams
 * = ₹0.15 per gram
 *
 * The final shipping amount is rounded to the nearest
 * whole rupee ONCE.
 *
 * Examples:
 *
 * 1g    -> ₹0.15 -> ₹0
 * 10g   -> ₹1.50 -> ₹2
 * 20g   -> ₹3.00 -> ₹3
 * 50g   -> ₹7.50 -> ₹8
 * 100g  -> ₹15.00 -> ₹15
 * 101g  -> ₹15.15 -> ₹15
 * 105g  -> ₹15.75 -> ₹16
 * 110g  -> ₹16.50 -> ₹17
 * 150g  -> ₹22.50 -> ₹23
 * 200g  -> ₹30.00 -> ₹30
 * 500g  -> ₹75.00 -> ₹75
 * 1000g -> ₹150.00 -> ₹150
 *
 *
 * IMPORTANT:
 *
 * We DO NOT use:
 *
 * Math.ceil(weight / 100) * 15
 *
 * because that would make:
 *
 * 101g -> ₹30
 *
 * which is NOT the intended pricing.
 *
 * Instead:
 *
 * weight × ₹0.15
 *
 * and round the final amount once.
 *
 *
 * FRONTEND NEVER DECIDES SHIPPING.
 *
 * This utility is used by backend cart/order logic.
 */

/* ============================================================
   SHIPPING CONFIGURATION
============================================================ */

export const SHIPPING_CONFIG = {
    /*
     * Shipping rate.
     *
     * ₹15 for every 100 grams.
     */
    ratePer100Grams: 15,

    /*
     * Weight unit used by the rate.
     */
    weightUnitGrams: 100,

    /*
     * Derived rate per gram.
     *
     * ₹15 / 100g = ₹0.15/g
     */
    ratePerGram: 15 / 100,
};

/* ============================================================
   ROUND MONEY
============================================================ */

/*
 * Used for normal currency calculations where decimal
 * precision may matter.
 *
 * Shipping itself is rounded to a whole rupee by
 * calculateShippingFee().
 */

export function roundMoney(amount) {
    const number =
        Number(amount);

    if (
        !Number.isFinite(
            number
        )
    ) {
        return 0;
    }

    return (
        Math.round(
            number * 100
        ) / 100
    );
}

/* ============================================================
   ROUND SHIPPING
============================================================ */

/*
 * Shipping is charged as a whole rupee.
 *
 * IMPORTANT:
 *
 * The calculation is performed first.
 * Rounding happens only once at the end.
 */

export function roundShipping(
    amount
) {
    const number =
        Number(amount);

    if (
        !Number.isFinite(
            number
        ) ||
        number <= 0
    ) {
        return 0;
    }

    return Math.round(
        number
    );
}

/* ============================================================
   CALCULATE SHIPPING FROM TOTAL WEIGHT
============================================================ */

/*
 * @param totalWeightGrams
 *
 * Total physical product weight in grams.
 *
 * Example:
 *
 * 300g -> 300 × 0.15 = ₹45
 *
 * 150g -> 150 × 0.15 = ₹22.50 -> ₹23
 */

export function calculateShippingFee(
    totalWeightGrams
) {
    const weight =
        Number(
            totalWeightGrams
        );

    /*
     * Empty / invalid / non-positive weight.
     *
     * This function returns 0 for invalid weight because
     * the function itself is also used for empty carts.
     *
     * Product-level validation MUST happen before this
     * function when building a real order.
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
     * ₹0.15 per gram.
     */
    const exactShipping =
        weight *
        SHIPPING_CONFIG.ratePerGram;

    /*
     * Round the FINAL shipping amount once.
     */
    return roundShipping(
        exactShipping
    );
}

/* ============================================================
   CALCULATE TOTAL CART WEIGHT
============================================================ */

/*
 * items must contain:
 *
 * {
 *   productWeight: number,
 *   quantity: number
 * }
 *
 * Example:
 *
 * Product A:
 *   weight = 300g
 *   quantity = 2
 *
 * Product B:
 *   weight = 150g
 *   quantity = 1
 *
 * Total:
 *
 * 300 × 2 + 150 × 1
 * = 750g
 *
 * Shipping:
 *
 * 750 × ₹0.15
 * = ₹112.50
 * = ₹113
 */

/* ============================================================
   VALIDATE SHIPPING ITEM
============================================================ */

export function validateShippingItem(
    item
) {
    const weight =
        Number(
            item?.productWeight
        );

    const quantity =
        Number(
            item?.quantity
        );

    /*
     * Product weight must be a real positive number.
     *
     * DO NOT silently replace invalid weight with 100g.
     */
    if (
        !Number.isFinite(
            weight
        ) ||
        weight <= 0
    ) {
        return {
            valid: false,

            message:
                "Product weight is missing or invalid.",
        };
    }

    /*
     * Quantity must be an integer >= 1.
     */
    if (
        !Number.isInteger(
            quantity
        ) ||
        quantity < 1
    ) {
        return {
            valid: false,

            message:
                "Product quantity is invalid.",
        };
    }

    return {
        valid: true,
    };
}

/* ============================================================
   CALCULATE CART WEIGHT
============================================================ */

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
            const validation =
                validateShippingItem(
                    item
                );

            /*
             * Invalid items are ignored here.
             *
             * IMPORTANT:
             *
             * Checkout/order code should validate every
             * product weight BEFORE calling this function.
             *
             * This behavior keeps the utility safe for
             * empty/summary calculations.
             */
            if (
                !validation.valid
            ) {
                return total;
            }

            const weight =
                Number(
                    item.productWeight
                );

            const quantity =
                Number(
                    item.quantity
                );

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

/*
 * Returns:
 *
 * {
 *   totalWeight,
 *   shippingCharge
 * }
 *
 * Example:
 *
 * [
 *   {
 *     productWeight: 300,
 *     quantity: 2
 *   }
 * ]
 *
 * totalWeight:
 *   600g
 *
 * shipping:
 *   600 × 0.15
 *   = ₹90
 */

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

/* ============================================================
   VALIDATE ALL SHIPPING ITEMS
============================================================ */

/*
 * Use this BEFORE creating a payment/order.
 *
 * Unlike calculateCartWeight(), this function does NOT
 * silently ignore invalid products.
 *
 * Every item must have:
 *
 * - valid positive weight
 * - valid integer quantity
 */

export function validateCartShippingItems(
    items
) {
    if (
        !Array.isArray(
            items
        )
    ) {
        return {
            valid: false,

            message:
                "Invalid shipping items.",
        };
    }

    for (
        let index = 0;
        index < items.length;
        index++
    ) {
        const validation =
            validateShippingItem(
                items[index]
            );

        if (
            !validation.valid
        ) {
            return {
                valid: false,

                message:
                    `Invalid shipping information for cart item ${
                        index + 1
                    }.`,
            };
        }
    }

    return {
        valid: true,
    };
}