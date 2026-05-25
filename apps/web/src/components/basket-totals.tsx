type BasketTotalsProduct = {
  id: string;
  name: string;
};

type BasketTotalsProps<T extends BasketTotalsProduct> = {
  products: readonly T[];
};

export function BasketTotals<T extends BasketTotalsProduct>({ products }: Readonly<BasketTotalsProps<T>>) {
  return (
    <>
      <h2>Basket</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </>
  );
}
