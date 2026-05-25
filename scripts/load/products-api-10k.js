import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const productQuery = __ENV.PRODUCT_QUERY || 'milk';
const requestDuration = __ENV.DURATION || '5m';
const virtualUsers = Number.parseInt(__ENV.VUS || '10000', 10);
const thinkTimeSeconds = Number.parseFloat(__ENV.THINK_TIME_SECONDS || '1');

export const options = {
  scenarios: {
    products_api_reads_10k: {
      executor: 'constant-vus',
      vus: virtualUsers,
      duration: requestDuration,
      gracefulStop: '30s',
      tags: { endpoint: 'products' }
    }
  },
  thresholds: {
    'http_req_duration{endpoint:products}': ['p(95)<800'],
    'http_req_failed{endpoint:products}': ['rate<0.001'],
    'checks{endpoint:products}': ['rate>0.999']
  }
};

export default function productsApiRead() {
  const url = `${baseUrl}/api/products?q=${encodeURIComponent(productQuery)}`;
  const response = http.get(url, {
    tags: { endpoint: 'products' },
    timeout: '10s'
  });

  check(
    response,
    {
      'products API returns HTTP 200': (res) => res.status === 200,
      'products API returns JSON': (res) => (res.headers['Content-Type'] || '').includes('application/json'),
      'products API payload has results array': (res) => {
        try {
          const payload = res.json();
          return Array.isArray(payload.results);
        } catch (_error) {
          return false;
        }
      }
    },
    { endpoint: 'products' }
  );

  if (thinkTimeSeconds > 0) sleep(thinkTimeSeconds);
}
