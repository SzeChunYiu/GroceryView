import { BasketActions } from './basket-actions';

type BasketRowProduct = {
  id: string;
  name: string;
};

type BasketRowProps<T extends BasketRowProduct> = {
  onAdd: (product: T) => void;
  product: T;
};

export function BasketRow<T extends BasketRowProduct>({ onAdd, product }: Readonly<BasketRowProps<T>>) {
  return (
    <li>
      <span>{product.name}</span>
      <BasketActions onAdd={() => onAdd(product)} />
    </li>
  );
}
