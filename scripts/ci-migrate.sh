#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for the Prisma migration CI gate." >&2
  exit 1
fi

npx prisma migrate deploy --preview-feature --schema prisma/schema.prisma
