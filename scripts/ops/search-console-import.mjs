import { existsSync, readFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
const schema = ['date', 'page', 'query', 'clicks', 'impressions', 'ctr', 'position'];
let rows = [];
if (inputArg) {
  const path = inputArg.slice('--input='.length);
  if (!existsSync(path)) throw new Error(`Search Console input file not found: ${path}`);
  rows = JSON.parse(readFileSync(path, 'utf8'));
}
const report = {
  status: 'ok',
  mode: inputArg ? 'file-import' : 'dry-run',
  credentialsRequired: false,
  schema,
  growthMetrics: ['organic landing page sessions', 'impressions', 'CTR', 'average position', 'indexed page count', 'organic search → product click', 'organic search → fuel click', 'organic search → pharmacy click'],
  importedRows: rows.length
};
console.log(JSON.stringify(report, null, 2));
if (!args.has('--dry-run') && !inputArg) process.exit(0);
