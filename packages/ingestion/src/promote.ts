export type PromoteQueryExecutor = {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type PromoteSanityCheck = {
  description: string;
  sql: string;
  expected?: number | string | boolean;
};

export type PromoteTableInput = {
  columns: readonly string[];
  minRows?: number;
  rows: readonly Record<string, unknown>[];
  sanityChecks?: readonly PromoteSanityCheck[];
  tableName: string;
  truncateProduction?: boolean;
};

export type PromoteTableResult = {
  promotedRows: number;
  sanityChecks: Array<{ description: string; passed: boolean; value: unknown }>;
  stagingTableName: string;
  tableName: string;
};

export async function promoteRowsViaStaging(
  executor: PromoteQueryExecutor,
  input: PromoteTableInput
): Promise<PromoteTableResult> {
  if (input.columns.length === 0) throw new Error('Promote requires at least one column.');

  const tableName = identifier(input.tableName);
  const stagingTableName = identifier(`${input.tableName}_staging`);
  const columns = input.columns.map(identifier);
  const sanityResults: PromoteTableResult['sanityChecks'] = [];

  await executor.query('BEGIN');
  try {
    await executor.query(`CREATE TABLE IF NOT EXISTS ${stagingTableName} (LIKE ${tableName} INCLUDING DEFAULTS INCLUDING CONSTRAINTS)`);
    await executor.query(`TRUNCATE TABLE ${stagingTableName}`);
    await insertRows(executor, stagingTableName, input.columns, input.rows);

    const [{ count }] = await executor.query<{ count: string | number }>(`SELECT COUNT(*) AS count FROM ${stagingTableName}`);
    const stagedRows = Number(count);
    if (!Number.isFinite(stagedRows)) throw new Error(`Could not count staged rows for ${input.tableName}.`);
    if (stagedRows < (input.minRows ?? 1)) {
      throw new Error(`Refusing to promote ${input.tableName}: staged row count ${stagedRows} below minimum ${input.minRows ?? 1}.`);
    }

    for (const check of input.sanityChecks ?? []) {
      const [row] = await executor.query<Record<string, unknown>>(check.sql);
      const value = row ? Object.values(row)[0] : undefined;
      const passed = check.expected === undefined ? Boolean(value) : value === check.expected;
      sanityResults.push({ description: check.description, passed, value });
      if (!passed) throw new Error(`Refusing to promote ${input.tableName}: sanity check failed (${check.description}).`);
    }

    if (input.truncateProduction ?? true) {
      await executor.query(`TRUNCATE TABLE ${tableName}`);
    }
    await executor.query(`INSERT INTO ${tableName} (${columns.join(', ')}) SELECT ${columns.join(', ')} FROM ${stagingTableName}`);
    await executor.query('COMMIT');

    return {
      promotedRows: stagedRows,
      sanityChecks: sanityResults,
      stagingTableName: `${input.tableName}_staging`,
      tableName: input.tableName
    };
  } catch (error) {
    await executor.query('ROLLBACK');
    throw error;
  }
}

async function insertRows(
  executor: PromoteQueryExecutor,
  stagingTableName: string,
  columns: readonly string[],
  rows: readonly Record<string, unknown>[]
) {
  if (rows.length === 0) return;

  const identifiers = columns.map(identifier);
  const params: unknown[] = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      params.push(row[column] ?? null);
      return `$${params.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  await executor.query(`INSERT INTO ${stagingTableName} (${identifiers.join(', ')}) VALUES ${tuples.join(', ')}`, params);
}

function identifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?$/i.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return value.split('.').map((part) => `"${part.replace(/"/g, '""')}"`).join('.');
}
