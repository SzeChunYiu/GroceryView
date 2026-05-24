export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type NearestStoreQueryInput = GeoPoint & {
  radiusKm: number;
  chain?: string;
};

export type NearestStoreRow = {
  store_id: string;
  store_slug: string;
  store_name: string;
  chain_slug: string;
  chain_name: string;
  address_line1: string | null;
  city: string;
  latitude: string | number;
  longitude: string | number;
  distance_km: string | number;
};

export type NearestStore = {
  id: string;
  slug: string;
  name: string;
  chain: {
    slug: string;
    name: string;
  };
  addressLine1: string | null;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

export type NearestStoreQuery = {
  sql: string;
  values: [number, number, number, string | null];
};

export type NearestStoreQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

const earthRadiusKm = 6371;

export function haversineDistanceKm(origin: GeoPoint, destination: GeoPoint): number {
  const deltaLat = degreesToRadians(destination.latitude - origin.latitude);
  const deltaLng = degreesToRadians(destination.longitude - origin.longitude);
  const originLat = degreesToRadians(origin.latitude);
  const destinationLat = degreesToRadians(destination.latitude);
  const halfChordLength =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(halfChordLength));
}

export function buildNearestStoresQuery(input: NearestStoreQueryInput): NearestStoreQuery {
  return {
    sql: `with store_locations as (
            select stores.id::text as store_id,
                   stores.slug as store_slug,
                   stores.name as store_name,
                   chains.slug as chain_slug,
                   chains.name as chain_name,
                   stores.address_line1,
                   stores.city,
                   ST_Y(stores.position::geometry)::double precision as latitude,
                   ST_X(stores.position::geometry)::double precision as longitude
              from stores
              join chains on chains.id = stores.chain_id
             where stores.position is not null
               and ($4::text is null or chains.slug = $4::text or chains.id::text = $4::text)
          ),
          ranked as (
            select store_locations.*,
                   (
                     2 * ${earthRadiusKm} * asin(sqrt(
                       power(sin(radians((store_locations.latitude - $1::double precision) / 2)), 2) +
                       cos(radians($1::double precision)) *
                       cos(radians(store_locations.latitude)) *
                       power(sin(radians((store_locations.longitude - $2::double precision) / 2)), 2)
                     ))
                   )::double precision as distance_km
              from store_locations
          )
          select store_id,
                 store_slug,
                 store_name,
                 chain_slug,
                 chain_name,
                 address_line1,
                 city,
                 latitude,
                 longitude,
                 distance_km
            from ranked
           where distance_km <= $3::double precision
           order by distance_km asc, store_name asc
           limit 50`,
    values: [input.latitude, input.longitude, input.radiusKm, normalizeChain(input.chain)]
  };
}

export async function getNearestStores(
  latitude: number,
  longitude: number,
  radiusKm: number,
  chain?: string,
  executor?: NearestStoreQueryExecutor
): Promise<NearestStore[]> {
  if (!executor) {
    throw new Error('A query executor is required to read nearest stores.');
  }

  const query = buildNearestStoresQuery({ latitude, longitude, radiusKm, chain });
  const rows = await executor.query<NearestStoreRow>(query.sql, query.values);
  return rows.map(mapNearestStoreRow).sort((left, right) => left.distanceKm - right.distanceKm || left.name.localeCompare(right.name));
}

export function mapNearestStoreRow(row: NearestStoreRow): NearestStore {
  return {
    id: row.store_id,
    slug: row.store_slug,
    name: row.store_name,
    chain: {
      slug: row.chain_slug,
      name: row.chain_name
    },
    addressLine1: row.address_line1,
    city: row.city,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    distanceKm: Number(row.distance_km)
  };
}

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function normalizeChain(chain: string | undefined): string | null {
  const normalized = chain?.trim();
  return normalized ? normalized : null;
}
