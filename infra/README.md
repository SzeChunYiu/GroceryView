# GroceryView local infrastructure

Use `infra/docker-compose.yml` when API, worker, and DB-schema lanes need real local services instead of mocks.

## Start core services

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis minio minio-bucket
```

This starts:

- PostgreSQL/PostGIS 18 on `localhost:5432`
- Redis 7 on `localhost:6379`
- MinIO S3-compatible storage on `localhost:9000`
- MinIO console on `localhost:9001`
- A `groceryview-raw` bucket for raw retailer payloads

## Optional pgAdmin

pgAdmin is behind the `admin` profile so it is not started by default:

```bash
docker compose -f infra/docker-compose.yml --profile admin up -d pgadmin
```

Then open `http://localhost:5050` and use the credentials from `.env.example`.

## Environment defaults

Copy the root example before running app or worker code locally:

```bash
cp .env.example .env
```

Default service URLs:

- `DATABASE_URL=postgresql://groceryview:groceryview@localhost:5432/groceryview`
- `REDIS_URL=redis://localhost:6379`
- `S3_ENDPOINT=http://localhost:9000`
- `S3_BUCKET=groceryview-raw`
- `S3_ACCESS_KEY_ID=groceryview`
- `S3_SECRET_ACCESS_KEY=groceryview-minio`

The compose file uses `postgis/postgis:18-3.6` so SQL migrations can be tested against the PostgreSQL/PostGIS baseline expected by the DB schema lane.
