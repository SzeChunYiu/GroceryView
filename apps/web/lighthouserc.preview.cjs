const previewUrl = process.env.LHCI_PREVIEW_URL || process.env.VERCEL_PREVIEW_URL;

if (!previewUrl) {
  throw new Error('Set LHCI_PREVIEW_URL or VERCEL_PREVIEW_URL to the Vercel preview deployment URL.');
}

module.exports = {
  ci: {
    collect: {
      url: [previewUrl.replace(/\/$/, '')],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless=new --no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['performance'],
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci-preview'
    }
  }
};
