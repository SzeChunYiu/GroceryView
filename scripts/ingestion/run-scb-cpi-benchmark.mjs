import pg from 'pg';
import { fetchScbCpiBenchmarkObservations, persistBenchmarkObservations } from '@groceryview/ingestion';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to persist SCB CPI benchmark observations.');

const pool = new pg.Pool({ connectionString });
try {
  const rows = await fetchScbCpiBenchmarkObservations({ topPeriods: Number(process.env.SCB_CPI_TOP_PERIODS ?? 1) });
  await persistBenchmarkObservations({ query: (sql, params) => pool.query(sql, params) }, rows);
  console.log(JSON.stringify({ sourceId: 'SCB_CPI', rows: rows.length, periods: [...new Set(rows.map((row) => row.period))] }));
} finally {
  await pool.end();
}
