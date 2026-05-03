# Module 9 Integration Notes

## Module Summary

- **Module:** `module9` (React + Vite frontend, Node/Express backend, Postgres)
- **Core DB schema reference:** `SPM_Centralized_Db.sql` (not modified by Module 9)
- **Module 9 data population file:** `module9/seed.sql`

## Environment

1. Copy env template:
   - `cp module9/.env.example module9/.env`
2. Required backend vars:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`
3. Frontend API var:
   - `VITE_API_URL` (normally `http://localhost:4000`)
4. Backend reads env strictly (no hardcoded DB credentials in source).

### DB Host Mapping

- **Using Docker Compose services:** `DB_HOST=db`
- **Running backend outside Compose against local Postgres:** `DB_HOST=localhost`

## Run (Recommended)

From `module9/`:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- DB: exposed on `localhost:5433`

## Startup / Health Check

- Verify backend health after startup:
  - `GET http://localhost:4000/health` should return `{"status":"ok", ...}`

## Docker Files Included

- `module9/docker-compose.yml`
- `module9/backend/Dockerfile`
- `module9/frontend/Dockerfile`
- `.dockerignore` files:
  - `module9/.dockerignore`
  - `module9/backend/.dockerignore`
  - `module9/frontend/.dockerignore`

## DB Write/Read Boundaries

- **Writes only to Module 9 tables:**
  - `m9_analytics_logs`
  - `m9_export_records`
  - `m9_alert_records`
  - `m9_kpi_snapshots`
- **Reads from centralized/global + m9 tables** for analytics and governance views.

## Session Tracking (Integration-Critical)

- Frontend sends usage events with `sessionId` on page views.
- Backend writes these to `m9_analytics_logs.session_id`.
- Export actions also log analytics events (`export_triggered`) and include session context when provided.

## Key API Endpoints for Integration Testing

- `GET /api/kpis/overview`
- `GET /api/analytics/freelancers`
- `GET /api/analytics/clients`
- `GET /api/analytics/skills`
- `GET /api/system/usage`
- `POST /api/system/track`
- `GET /api/governance/alerts`
- `PATCH /api/governance/alerts/:id/acknowledge`
- `GET /api/audit/log`
- `POST /api/exports/generate`
- `GET /api/exports/history`
- `GET /api/system/current-admin`
- `GET /api/system/data-sources`

## Admin Context / Identity

- Current admin identity is resolved from centralized `users` table.
- `x-admin-user-id` header is supported where relevant.

## UI / Instruction Alignment

- Top navbar preserved from sample-page pattern with branding:
  - `M9`
  - `System Governance`
- Page naming follows `G09_*`.
- Workspace index table (`SerialNo | Page Name | Function`) is present on Overview page (`G09_DashboardPage`).
- Red sticky-note marker included for cross-module linkage cue.

## Known Operational Note

- If local machine has low disk space, dependency install/build may fail with `ENOSPC`.
- Free disk space before running `npm install` / builds.
