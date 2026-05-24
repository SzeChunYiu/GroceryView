export type UserDataExportSection = 'profile' | 'lists' | 'alerts' | 'preferences' | 'analytics_events';

export type UserDataExportQuery = {
  section: UserDataExportSection;
  sql: string;
  values: [userId: string];
};

export type UserAccountDeletionTable =
  | 'basket_items'
  | 'weekly_baskets'
  | 'watchlist_items'
  | 'user_preferences'
  | 'favorite_stores'
  | 'app_users';

export type UserAccountDeletionQuery = {
  table: UserAccountDeletionTable;
  sql: string;
  values: [userId: string];
};

export type AdminUserListQuery = {
  sql: string;
  values: [limit: number, offset: number];
};

export type AdminUserAction = 'disable_account' | 'resend_verification';

export type AdminUserActionQuery = {
  action: AdminUserAction;
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

export function buildUserAccountDeletionQueries(userId: string): UserAccountDeletionQuery[] {
  return [
    {
      table: 'basket_items',
      sql: `delete from basket_items
             using weekly_baskets
             where basket_items.basket_id = weekly_baskets.id
               and weekly_baskets.user_id = $1`,
      values: [userId]
    },
    {
      table: 'weekly_baskets',
      sql: `delete from weekly_baskets
             where user_id = $1`,
      values: [userId]
    },
    {
      table: 'watchlist_items',
      sql: `delete from watchlist_items
             where user_id = $1`,
      values: [userId]
    },
    {
      table: 'user_preferences',
      sql: `delete from user_preferences
             where user_id = $1`,
      values: [userId]
    },
    {
      table: 'favorite_stores',
      sql: `delete from favorite_stores
             where user_id = $1`,
      values: [userId]
    },
    {
      table: 'app_users',
      sql: `delete from app_users
             where id = $1`,
      values: [userId]
    }
  ];
}

export function buildAdminUserListQuery(limit = 50, offset = 0): AdminUserListQuery {
  const parsedLimit = Number.isFinite(limit) ? Math.trunc(limit) : 50;
  const parsedOffset = Number.isFinite(offset) ? Math.trunc(offset) : 0;
  const normalizedLimit = Math.min(Math.max(parsedLimit, 1), 100);
  const normalizedOffset = Math.max(parsedOffset, 0);

  return {
    sql: `select app_users.id,
                 app_users.email,
                 app_users.created_at,
                 app_users.disabled_at,
                 app_users.verification_sent_at,
                 count(watchlist_items.id) filter (
                   where watchlist_items.target_price is not null
                      or watchlist_items.alert_deal_score_at is not null
                 )::integer as active_alert_count
            from app_users
            left join watchlist_items on watchlist_items.user_id = app_users.id
           group by app_users.id, app_users.email, app_users.created_at, app_users.disabled_at, app_users.verification_sent_at
           order by app_users.created_at desc, app_users.id
           limit $1 offset $2`,
    values: [normalizedLimit, normalizedOffset]
  };
}

export function buildDisableAdminUserQuery(userId: string): AdminUserActionQuery {
  return {
    action: 'disable_account',
    sql: `update app_users
             set disabled_at = coalesce(disabled_at, now())
           where id = $1
       returning id,
                 email,
                 created_at,
                 disabled_at,
                 verification_sent_at,
                 (
                   select count(watchlist_items.id) filter (
                     where watchlist_items.target_price is not null
                        or watchlist_items.alert_deal_score_at is not null
                   )::integer
                     from watchlist_items
                    where watchlist_items.user_id = app_users.id
                 ) as active_alert_count`,
    values: [userId]
  };
}

export function buildResendVerificationAdminUserQuery(userId: string): AdminUserActionQuery {
  return {
    action: 'resend_verification',
    sql: `update app_users
             set verification_sent_at = now()
           where id = $1
       returning id,
                 email,
                 created_at,
                 disabled_at,
                 verification_sent_at,
                 (
                   select count(watchlist_items.id) filter (
                     where watchlist_items.target_price is not null
                        or watchlist_items.alert_deal_score_at is not null
                   )::integer
                     from watchlist_items
                    where watchlist_items.user_id = app_users.id
                 ) as active_alert_count`,
    values: [userId]
  };
}
