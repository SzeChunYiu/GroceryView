export type HiddenPreferencesRecord = {
  hiddenProductIds: string[];
  hiddenStoreIds: string[];
};

export type UserPreferenceQuery = {
  sql: string;
  values: unknown[];
};

export function buildGetHiddenPreferencesQuery(userId: string): UserPreferenceQuery {
  return {
    sql: `select
            coalesce(hidden_product_ids, array[]::text[]) as hidden_product_ids,
            coalesce(hidden_store_ids, array[]::text[]) as hidden_store_ids
          from user_preferences
          where user_id = $1`,
    values: [userId]
  };
}

export function buildUpsertHiddenPreferencesQuery(userId: string, preferences: HiddenPreferencesRecord): UserPreferenceQuery {
  return {
    sql: `insert into user_preferences(user_id, weekly_budget, monthly_budget, hidden_product_ids, hidden_store_ids)
          values ($1, 0, 0, $2, $3)
          on conflict (user_id) do update set
            hidden_product_ids = excluded.hidden_product_ids,
            hidden_store_ids = excluded.hidden_store_ids,
            updated_at = now()`,
    values: [userId, preferences.hiddenProductIds, preferences.hiddenStoreIds]
  };
}
