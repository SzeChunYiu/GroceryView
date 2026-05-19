const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
export function calculateDealScore(input) {
    const currentCityStrength = 100 - clamp(input.currentCityPercentile, 0, 100);
    const promoHistoryStrength = 100 - clamp(input.knownPromoHistoryPercentile, 0, 100);
    const equivalentStrength = 100 - clamp(input.equivalentUnitPricePercentile, 0, 100);
    const discountStrength = clamp(input.discountDepthPercent, 0, 100);
    const confidenceStrength = clamp(input.sourceConfidence, 0, 1) * 100;
    // Sponsored placement is intentionally ignored: ads must never affect deal score.
    void input.sponsoredPlacement;
    return Math.round(currentCityStrength * 0.4 +
        promoHistoryStrength * 0.25 +
        equivalentStrength * 0.2 +
        discountStrength * 0.1 +
        confidenceStrength * 0.05);
}
export function scoreBand(score) {
    const normalized = clamp(score, 0, 100);
    if (normalized >= 90)
        return { label: 'Excellent deal', verdict: 'Buy now' };
    if (normalized >= 75)
        return { label: 'Good deal', verdict: 'Buy' };
    if (normalized >= 60)
        return { label: 'Fair deal', verdict: 'Compare' };
    if (normalized >= 40)
        return { label: 'Normal price', verdict: 'Normal' };
    return { label: 'Not a real deal', verdict: 'Wait' };
}
export function compareBasketStrategies(input) {
    const favoriteSet = new Set(input.favoriteStoreIds);
    const missingProductIds = [];
    const assignments = [];
    const storeTotals = new Map();
    for (const item of input.items) {
        const eligiblePrices = item.prices.filter((price) => favoriteSet.has(price.storeId));
        if (eligiblePrices.length === 0) {
            missingProductIds.push(item.productId);
            continue;
        }
        for (const price of eligiblePrices) {
            const current = storeTotals.get(price.storeId) ?? {
                storeId: price.storeId,
                storeName: price.storeName,
                total: 0,
                itemCount: 0
            };
            current.total = roundMoney(current.total + price.price * item.quantity);
            current.itemCount += 1;
            storeTotals.set(price.storeId, current);
        }
        const cheapest = eligiblePrices.reduce((best, candidate) => candidate.price < best.price ? candidate : best);
        assignments.push({
            productId: item.productId,
            storeId: cheapest.storeId,
            storeName: cheapest.storeName,
            quantity: item.quantity,
            unitPrice: cheapest.price,
            lineTotal: roundMoney(cheapest.price * item.quantity)
        });
    }
    return {
        cheapestByProduct: {
            total: roundMoney(assignments.reduce((sum, item) => sum + item.lineTotal, 0)),
            assignments
        },
        singleStoreOptions: [...storeTotals.values()].sort((a, b) => a.total - b.total),
        missingProductIds
    };
}
export function calculateFixedBasketIndex(input) {
    if (input.components.length === 0) {
        throw new Error('At least one component is required to calculate an index.');
    }
    const base = input.components.reduce((sum, component) => sum + component.baseUnitPrice * component.weight, 0);
    const current = input.components.reduce((sum, component) => sum + component.currentUnitPrice * component.weight, 0);
    if (base <= 0)
        throw new Error('Base basket value must be positive.');
    const value = roundMoney((current / base) * 100);
    return {
        id: input.id,
        label: input.label,
        baseDate: input.baseDate,
        currentDate: input.currentDate,
        value,
        movementPercent: roundMoney(value - 100),
        confidence: input.components.length >= 5 ? 'high' : input.components.length >= 2 ? 'medium' : 'low',
        components: input.components
    };
}
