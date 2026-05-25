import { ACTIVE_PRODUCTS_PREDICATE } from './items.js';

export type CategoryTreeQuery = {
  sql: string;
  values: [];
};

export type CategoryTreeRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  item_count: number | string;
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  itemCount: number;
};

export function buildCategoryTreeQuery(): CategoryTreeQuery {
  return {
    sql: `with nodes as (
            select depth,
                   products.category_path[1:depth] as path_parts,
                   products.category_path[depth] as name,
                   products.id as product_id
              from products
              cross join lateral generate_subscripts(products.category_path, 1) as category_depth(depth)
             where coalesce(array_length(products.category_path, 1), 0) > 0
               and ${ACTIVE_PRODUCTS_PREDICATE}
          ),
          normalized as (
            select depth,
                   name,
                   product_id,
                   array(
                     select trim(both '-' from regexp_replace(
                       translate(lower(trim(part)), 'åäöéèü', 'aaoeeu'),
                       '[^[:alnum:]]+',
                       '-',
                       'g'
                     ))
                       from unnest(path_parts) as part
                   ) as path_slugs
              from nodes
             where name is not null and trim(name) <> ''
          ),
          category_rows as (
            select depth,
                   array_to_string(path_slugs, '/') as id,
                   name,
                   path_slugs[array_length(path_slugs, 1)] as slug,
                   case
                     when depth = 1 then null
                     else array_to_string(path_slugs[1:(depth - 1)], '/')
                   end as parent_id,
                   product_id
              from normalized
             where coalesce(array_length(path_slugs, 1), 0) > 0
          )
          select id,
                 name,
                 slug,
                 parent_id,
                 count(distinct product_id)::int as item_count
            from category_rows
           group by depth, id, name, slug, parent_id
           order by depth, parent_id nulls first, name`,
    values: []
  };
}

export function mapCategoryTreeRow(row: CategoryTreeRow): CategoryTreeNode {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    itemCount: Number(row.item_count)
  };
}
