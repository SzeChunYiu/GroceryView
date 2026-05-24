# @groceryview/ingestion

`@groceryview/ingestion` is the GroceryView TypeScript package for collecting and normalizing grocery, pharmacy, fuel, store, and enrichment data from retailer/source integrations. It exposes reusable ingestion functions, connector APIs, store enumeration helpers, and unit-price utilities for other workspace packages.

## Code location

- Package manifest: `packages/ingestion/package.json`
- Source entry point: `packages/ingestion/src/index.ts`
- Source modules: `packages/ingestion/src/`
- Retailer/source connectors: `packages/ingestion/src/connectors/`
- Build output: `packages/ingestion/dist/`
- Test build output: `packages/ingestion/dist-test/`

## Local commands

Run commands from the repository root.

```sh
npm run build -w @groceryview/ingestion
npm run test -w @groceryview/ingestion
```

The package build compiles its TypeScript sources after building the `@groceryview/db`, `@groceryview/catalog`, and `@groceryview/image-cache` workspace dependencies. The test script builds those same dependencies, compiles test TypeScript with `tsconfig.test.json`, then runs Node's built-in test runner against `dist-test/__tests__/*.test.js`.

## Public modules

The package entry point re-exports these top-level public modules:

- `connectors/all-store-runner`
- `connectors/apohem`
- `connectors/citygross`
- `connectors/citygross-bulk`
- `connectors/coop`
- `connectors/fuel-stations`
- `connectors/hemkop`
- `connectors/ica`
- `connectors/ica-bulk`
- `connectors/ica-reklamblad`
- `connectors/lidl`
- `connectors/lidl-bulk`
- `connectors/mathem`
- `connectors/matpriskollen`
- `connectors/matspar`
- `connectors/okq8-fuel`
- `connectors/openfoodfacts`
- `connectors/overpass`
- `connectors/st1-fuel`
- `connectors/willys`
- `connectors/willys-bulk`
- `store-enumerator`
- `unit-price`

It also exports ingestion types and helpers from `src/index.ts`, including source confidence, retailer policy, store locator, and source-record utilities.
