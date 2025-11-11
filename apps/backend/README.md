# MeMantra Backend

---

## Local Setup

```bash
cd apps/backend
cp .env.example .env          # fill in DB + OAuth + JWT secrets
pnpm install                  # install dependencies (from repo root only once)
```

**Environment file:** `apps/backend/.env`. Root-level scripts and Docker compose reuse it.

**Database connectivity:** ensure `DATABASE_URL` (Neon) or discrete `DB_*` variables (local) are correct before running the server.

---

## Running the Server

```bash
pnpm dev          # ts-node + nodemon (restarts on changes)
pnpm build        # emit JS into dist/
pnpm start        # run dist build with NODE_ENV inherited
pnpm start:prod   # production mode (NODE_ENV=production)
```

The API listens on `PORT` (default `3000`). In Docker Compose it is mapped to host port `4000`. Validate via:

```bash
curl http://localhost:3000/health
```

You should receive `{ "status": "healthy", ... }`.

---

## Scripts Reference

| Command                       | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `pnpm dev`                    | Start the dev server with `nodemon`.               |
| `pnpm build`                  | Compile TypeScript (uses `tsconfig.json`).         |
| `pnpm start`                  | Run compiled build from `dist/`.                   |
| `pnpm start:prod`             | Run with `NODE_ENV=production`.                    |
| `pnpm test`                   | Execute Jest unit/integration tests with coverage. |
| `pnpm test:watch`             | Watch mode for tests.                              |
| `pnpm lint` / `pnpm lint:fix` | ESLint across `src/**/*.ts`.                       |
| `pnpm typecheck`              | TS type checking without emit.                     |
| `pnpm db:generate-types`      | Run `kysely-codegen` using `DATABASE_URL`.         |

Run all commands from the repo root with workspace filtering if you prefer: `pnpm --filter backend dev`.

---

## Database Guide

1. **Choose a target:**
   - **Hosted:** Use the shared Neon connection string (preferred). Paste into `DATABASE_URL`.
   - **Local:** Install PostgreSQL, create `me_mantra_db`, and execute `database/init.sql`.
   - **Docker:** Run `docker compose up -d` from repo root to start `db` + `backend`.

2. **Initialize / reset:**

   ```bash
   psql -U postgres -d me_mantra_db -f database/init.sql
   # or use Neon’s SQL editor to run the script
   ```

3. **Generate Kysely types whenever the schema changes:**

   ```bash
   pnpm --filter backend db:generate-types
   ```

4. **Inspect data:**
   - Connect with `psql`, pgAdmin (`docker compose --profile pgadmin up -d`), or the Neon web UI.
   - Example query:
     ```sql
     select mantra_id, title, is_active from "Mantra" order by created_at desc limit 5;
     ```

For a deeper walkthrough (including shared credentials, hosted DB tips, and pgAdmin screenshots) read `apps/backend/database/README.md`.

---

## Project Layout

```
apps/backend
├─ src
│  ├─ app.ts                # Express wiring (helmet, cors, rate limiting, logging, error handler)
│  ├─ index.ts              # Server bootstrap
│  ├─ routes/*.routes.ts    # Resource routers
│  ├─ controllers/*.ts      # Request handlers (auth, mantras, categories, collections, likes, reminders, recommendations)
│  ├─ models/*.model.ts     # Kysely data access
│  ├─ middleware/           # auth middleware, logger, validation helper
│  ├─ validators/           # Zod schemas for payloads/query params
│  ├─ db/                   # Kysely configuration & connection pooling
│  └─ utils/jwt.utils.ts    # JWT helpers
├─ docs/
│  ├─ API_ENDPOINTS.md      # REST reference
│  └─ KYSELY_GUIDE.md       # Tips for writing queries
├─ database/                # SQL schema + setup guide
└─ test/                    # Jest unit & integration suites
```
