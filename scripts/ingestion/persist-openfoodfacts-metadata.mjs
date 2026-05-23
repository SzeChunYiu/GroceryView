import { runOpenFoodFactsProductMetadataEnrichmentFromEnv } from '../../packages/ingestion/dist/index.js';

try {
  const result = await runOpenFoodFactsProductMetadataEnrichmentFromEnv();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== 'persisted') process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
