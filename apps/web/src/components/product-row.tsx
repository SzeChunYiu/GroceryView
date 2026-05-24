'use client';

export type ProductRowProps = {
  product: {
    name: string;
    href: string;
    priceLabel: string;
  };
  quantity?: number;
  onAddToBasket?: () => void;
  onDecreaseQuantity?: () => void;
  onIncreaseQuantity?: () => void;
  onToggleFavourite?: () => void;
};

export function ProductRow({
  product,
  quantity = 1,
  onAddToBasket,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onToggleFavourite,
}: ProductRowProps) {
  return (
    <article aria-label={`${product.name} product row`} className="flex items-center gap-3 py-3">
      <a className="font-medium underline-offset-2 hover:underline" href={product.href}>
        View {product.name}
      </a>
      <span aria-label={`${product.name} price`} className="text-sm text-slate-600">
        {product.priceLabel}
      </span>
      <button aria-label={`Add ${product.name} to favourites`} onClick={onToggleFavourite} type="button">
        Favourite
      </button>
      <button aria-label={`Decrease ${product.name} quantity`} onClick={onDecreaseQuantity} type="button">
        −
      </button>
      <input
        aria-label={`${product.name} quantity`}
        className="w-16"
        min={0}
        onChange={() => undefined}
        type="number"
        value={quantity}
      />
      <button aria-label={`Increase ${product.name} quantity`} onClick={onIncreaseQuantity} type="button">
        +
      </button>
      <button aria-label={`Add ${product.name} to basket`} onClick={onAddToBasket} type="button">
        Add to basket
      </button>
    </article>
  );
}
