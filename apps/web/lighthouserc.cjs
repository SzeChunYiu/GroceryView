const terminalUrls = [
  'http://127.0.0.1:3000/',
  'http://127.0.0.1:3000/products',
  'http://127.0.0.1:3000/compare',
  'http://127.0.0.1:3000/data-sources'
];

module.exports = {
  ci: {
    collect: {
      url: terminalUrls,
      startServerCommand: 'npm run start -- --hostname 127.0.0.1 --port 3000',
      startServerReadyPattern: 'Ready',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless=new --no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.45 }],
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 6000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-byte-weight': ['error', { maxNumericValue: 9000000 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci'
    }
  }
};
