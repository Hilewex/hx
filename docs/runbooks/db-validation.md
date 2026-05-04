# Local Database Persistence Validation

This runbook describes how to validate the PostgreSQL persistence layer locally.

## 1. Start Local Infrastructure
Start the PostgreSQL service using Docker Compose:
```bash
cd infra/docker
docker compose up -d
```

## 2. Environment Configuration
Ensure your `.env` or environment variables are set:
```bash
PERSISTENCE_MODE=postgres
DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db
```

## 3. Run Migrations
Apply the latest migrations to the local database:
```bash
cd packages/persistence
pnpm run migrate
```

## 4. Verify Schema
Verify that tables and indexes are created correctly:
```bash
cd packages/persistence
pnpm run verify-schema
```

## 5. Run Moderation Smoke Test
Run the moderation persistence smoke test in postgres mode:
```bash
# From project root
set PERSISTENCE_MODE=postgres
set DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db
cd services/moderation
pnpm run test:persistence
```

## 6. Cleanup
To stop the local database:
```bash
cd infra/docker
docker compose down
```
