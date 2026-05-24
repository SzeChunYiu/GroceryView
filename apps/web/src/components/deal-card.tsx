/**
 * Renders a grocery deal summary card with the offer's title, store, pricing,
 * savings, and destination link so deal-focused views can present consistent
 * offer evidence without duplicating card markup.
 *
 * @example
 * ```tsx
 * <DealCard
 *   title="Organic bananas"
 *   storeName="ICA"
 *   priceText="19,90 kr/kg"
 *   savingsText="Save 20%"
 *   href="/products/organic-bananas"
 * />
 * ```
 *
 * | Prop | Description |
 * | --- | --- |
 * | `title` | Human-readable deal or product name shown as the card heading. |
 * | `storeName` | Retailer or store offering the deal. |
 * | `priceText` | Display-ready current price or offer price text. |
 * | `savingsText` | Optional display-ready savings, markdown, or discount text. |
 * | `href` | Destination URL for the full deal or product detail page. |
 *
 * @param props - Props for rendering the deal card.
 * @param props.title - Human-readable deal or product name shown as the card heading.
 * @param props.storeName - Retailer or store offering the deal.
 * @param props.priceText - Display-ready current price or offer price text.
 * @param props.savingsText - Optional display-ready savings, markdown, or discount text.
 * @param props.href - Destination URL for the full deal or product detail page.
 */
export interface Props {
  title: string;
  storeName: string;
  priceText: string;
  savingsText?: string;
  href: string;
}

export function DealCard({ title, storeName, priceText, savingsText, href }: Props) {
  return (
    <a className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={href}>
      <p className="text-sm font-semibold text-slate-600">{storeName}</p>
      <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-2xl font-black text-emerald-800">{priceText}</p>
      {savingsText ? <p className="mt-1 text-sm font-semibold text-slate-600">{savingsText}</p> : null}
    </a>
  );
}
