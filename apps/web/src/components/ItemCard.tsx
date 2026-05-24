export type ItemCardProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly price: string;
};

export function ItemCard({ title, subtitle, price }: ItemCardProps) {
  return (
    <article className="item-card">
      <p className="item-card__eyebrow">Grocery item</p>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <strong>{price}</strong>
    </article>
  );
}
