# GroceryView local infrastructure

Use `infra/docker-compose.yml` for local API, worker, and schema development against real services.

## Core services

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis object-storage object-storage-init
```

This starts PostgreSQL/PostGIS 18 on `localhost:5432`, Redis 7 on `localhost:6379`, and MinIO S3-compatible object storage on `localhost:9000` with a `groceryview-raw` bucket.

## Optional pgAdmin

```bash
docker compose -f infra/docker-compose.yml --profile admin up -d pgadmin
```

pgAdmin runs on `localhost:5050` and uses the credentials from the root `.env.example`.
