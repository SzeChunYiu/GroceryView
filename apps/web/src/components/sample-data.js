export const basketItems = [
    {
        name: "Zoegas Coffee 450g",
        quantity: "2 packs",
        currentPrice: 49.9,
        usualPrice: 59.9,
        store: "Willys Odenplan",
        confidence: "Verified shelf",
    },
    {
        name: "Arla Milk 1L",
        quantity: "6 bottles",
        currentPrice: 14.9,
        usualPrice: 16.4,
        store: "ICA Kvantum Liljeholmen",
        confidence: "High confidence",
    },
    {
        name: "Butter 600g",
        quantity: "1 pack",
        currentPrice: 54.9,
        usualPrice: 52.9,
        store: "Coop Farsta",
        confidence: "Estimated",
    },
    {
        name: "Oats 1.5kg",
        quantity: "1 bag",
        currentPrice: 28.9,
        usualPrice: 33.5,
        store: "Hemkop T-Centralen",
        confidence: "Verified shelf",
    },
];
export const householdMembers = [
    { name: "Alex", role: "Owner", budgetShare: 50, dietaryTags: "vegetarian, lactose ok" },
    { name: "Mina", role: "Member", budgetShare: 35, dietaryTags: "no pork, nut alert" },
    { name: "Sam", role: "Reviewer", budgetShare: 15, dietaryTags: "school lunch" },
];
export const privacyControls = [
    { label: "Receipt images", state: "Auto-delete after review", detail: "7 day retention" },
    { label: "Location precision", state: "Store district only", detail: "Street address hidden" },
    { label: "Household sharing", state: "Line-item totals", detail: "No payment method data" },
    { label: "Price contribution", state: "Anonymous", detail: "No account identifier in exports" },
];
export const scannerQueue = [
    { item: "Coop Farsta receipt", status: "Needs review", confidence: 71, owner: "Mina" },
    { item: "Arla Milk barcode", status: "Matched", confidence: 98, owner: "Alex" },
    { item: "Loose tomatoes label", status: "Low confidence", confidence: 54, owner: "Sam" },
];
export function formatSek(value) {
    return new Intl.NumberFormat("sv-SE", {
        currency: "SEK",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: "currency",
    }).format(value);
}
