export type UserDataExportSection = 'profile' | 'lists' | 'alerts' | 'preferences' | 'analytics_events';

export type UserDataExportQuery = {
  section: UserDataExportSection;
  sql: string;
  values: [userId: string];
};

export function buildUserDataExportQueries(userId: string): UserDataExportQuery[] {
  return [
    {
      section: 'profile',
      sql: `select id,
                   email,
                   created_at,
                   updated_at
              from app_users
             where id = $1`,
      values: [userId]
    },
    {
      section: 'lists',
      sql: `select weekly_baskets.id as basket_id,
                   weekly_baskets.week_start,
                   basket_items.product_id,
                   basket_items.quantity,
                   basket_items.created_at
              from weekly_baskets
              join basket_items on basket_items.basket_id = weekly_baskets.id
             where weekly_baskets.user_id = $1
             order by weekly_baskets.week_start desc, basket_items.id`,
      values: [userId]
    },
    {
      section: 'alerts',
      sql: `select product_id,
                   target_price,
                   alert_deal_score_at,
                   favorite_stores_only,
                   allowed_price_types,
                   created_at
              from watchlist_items
             where user_id = $1
             order by id`,
      values: [userId]
    },
    {
      section: 'preferences',
      sql: `select weekly_budget,
                   monthly_budget,
                   updated_at
              from user_preferences
             where user_id = $1`,
      values: [userId]
    },
    {
      section: 'analytics_events',
      sql: `select $1::text as user_id
             where false`,
      values: [userId]
    }
  ];
}
