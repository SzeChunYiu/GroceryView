import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    product_reads_10k: {
      executor: 'constant-vus',
      vus: 10000,
      duration: '1m'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.001']
  }
};

export default function productReads() {
  const response = http.get(`${BASE_URL}/api/products`, {
    tags: { endpoint: 'products' }
  });

  check(response, {
    'GET /api/products returns 200': (res) => res.status === 200
  });
  sleep(1);
}
