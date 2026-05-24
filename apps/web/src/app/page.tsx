import { ItemCard } from '@/components/ItemCard';
import { MarketShell } from '@/components/market-shell';
import { routeMetadata } from '@/lib/seo';
import '../styles/grid.css';

const itemCards = [
  { title: 'Milk', subtitle: '1 liter dairy staple', price: '19 kr' },
  { title: 'Oats', subtitle: 'Breakfast pantry item', price: '24 kr' },
  { title: 'Apples', subtitle: 'Fruit bag', price: '29 kr' },
  { title: 'Coffee', subtitle: 'Ground roast', price: '49 kr' }
];

export function generateMetadata() {
  return routeMetadata('/');
}

export default function HomePage() {
  return (
    <>
      <MarketShell />
      <section className="item-cards-section" aria-labelledby="item-cards-heading">
        <h2 id="item-cards-heading">Item cards</h2>
        <div className="item-cards-grid">
          {itemCards.map((item) => (
            <ItemCard key={item.title} title={item.title} subtitle={item.subtitle} price={item.price} />
          ))}
        </div>
      </section>
    </>
  );
}
