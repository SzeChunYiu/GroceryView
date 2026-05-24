import { detectPriceAnomalies, type PriceAnomalyInput } from '../../../lib/anomaly-detector';

const ingestPreview: PriceAnomalyInput[] = [
  {
    productId: 'milk-1l',
    productName: 'Milk 1L',
    currentPrice: 19.9,
    previousPrice: 18.9,
    recentPrices: [18.5, 18.9, 19.1, 18.7],
  },
  {
    productId: 'coffee-500g',
    productName: 'Coffee 500g',
    currentPrice: 189,
    previousPrice: 89,
    recentPrices: [82, 85, 89, 91],
  },
];

export default function AdminIngestPage() {
  const anomalies = detectPriceAnomalies(ingestPreview);

  return (
    <main>
      <h1>Ingest sanity checks</h1>
      <p>Products with extreme price swings are flagged for human verification before recommendations use them.</p>

      {anomalies.length === 0 ? (
        <p>No price anomalies detected in the latest ingest.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Current price</th>
              <th>Previous price</th>
              <th>Verification reason</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((product) => (
              <tr key={product.productId}>
                <td>{product.productName}</td>
                <td>{formatCurrency(product.currentPrice)}</td>
                <td>{formatCurrency(product.previousPrice)}</td>
                <td>{product.reasons.join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

function formatCurrency(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'n/a';
  }

  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', style: 'currency' }).format(value);
}
