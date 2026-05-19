import { createGroceryViewApi } from '@groceryview/api';
export function buildMobileShell() {
    return {
        tabs: [
            { id: 'today', label: 'Today', purpose: 'Budget, deals, alerts, and recommendations' },
            { id: 'stores', label: 'Stores', purpose: 'Favorite and nearby supermarket profiles' },
            { id: 'basket', label: 'Basket', purpose: 'Weekly grocery planning and comparison' },
            { id: 'scan', label: 'Scan', purpose: 'Barcode and receipt capture' },
            { id: 'profile', label: 'Profile', purpose: 'Budget, household, privacy, and notification settings' }
        ],
        todayModules: ['weekly_budget', 'favorite_store_deals', 'watchlist_alerts', 'weekly_basket', 'recommended_actions', 'recent_price_drops', 'receipt_insights']
    };
}
export function createMobileViewModel(userId, api = createGroceryViewApi()) {
    const market = api.getMarketOverview();
    return {
        userId,
        today: {
            marketCity: market.city,
            topDeals: market.topDeals.map((deal) => ({ ticker: deal.ticker, dealScore: deal.dealScore, bestPrice: deal.bestPrice }))
        },
        stores: {
            favoriteStores: api.getFavoriteStores(userId).map((store) => ({ id: store.id, name: store.name }))
        },
        basket: {
            emptyStateAction: 'Add from deals or scan a barcode'
        },
        scan: {
            supportedModes: ['barcode', 'receipt']
        }
    };
}
export function buildScanResult(request, api = createGroceryViewApi()) {
    if (request.mode === 'receipt') {
        return {
            mode: request.mode,
            code: request.code,
            product: null,
            verdict: 'Review receipt matches before saving',
            confidenceLabel: 'medium-high after OCR review',
            equivalentProducts: [],
            actions: ['extract_receipt_items', 'review_budget_impact', 'confirm_matches']
        };
    }
    const product = api.getProduct(request.productId ?? '');
    return {
        mode: request.mode,
        code: request.code,
        product: product
            ? {
                id: product.id,
                ticker: product.ticker,
                name: product.name,
                currentBestPrice: product.currentPrices[0]?.price ?? null,
                dealScore: product.dealScore
            }
            : null,
        verdict: product?.verdict ?? 'Compare',
        confidenceLabel: product ? 'verified observed price' : 'unknown barcode',
        equivalentProducts: product ? ['same_category_equivalents', 'private_label_swaps'] : [],
        actions: product ? ['add_to_weekly_basket', 'add_to_watchlist', 'compare_stores'] : ['search_product', 'report_unknown_barcode']
    };
}
