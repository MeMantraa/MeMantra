# Docker Setup and Getting Started

This guide covers prerequisites, environment setup, starting/stopping the stack, and optional pgAdmin. It consolidates the previous root-level Docker README.

## Prerequisites

1. Install PostgreSQL
   - Download PostgreSQL from https://www.postgresql.org/download/
   - During installation:
     - Remember the password you set for the 'postgres' user
     - Default port: 5432
     - Install all offered components, including pgAdmin 4

2. Install Docker Desktop
   - Download Docker Desktop (includes Docker Compose) from https://www.docker.com/products/docker-desktop/

### Platform Notes (macOS and Windows)

- macOS (Intel and Apple Silicon): images used here (`node:22-bookworm-slim`, `postgres:17`, `dpage/pgadmin4:8`) are multi-arch and pull the right variant automatically. If you ever need to force x86 for a toolchain, you can build with `--platform linux/amd64` or run Compose with `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build`.
- Windows: Docker Desktop with the WSL2 engine is recommended. You can run all commands from PowerShell or Windows Terminal; no WSL shell is required unless you prefer it.
- Resources: for smoother DB/dev, consider 2+ CPUs and 4–6 GB RAM configured in Docker Desktop.

## Container Setup Steps

1. Configure env
   - Create your local env file:

   ```bash
   cp .env.example .env
   ```

   - Make sure these are set:
   - In `apps/backend/.env` (single source of truth used by both API and DB):
     - `DB_HOST=db` (Compose overrides this for the container)
     - `DB_PORT=5432`
     - `DB_NAME=me_mantra_db`
     - `DB_USER=postgres`
     - `DB_PASSWORD=postgres`
     - `POSTGRES_USER=postgres`
     - `POSTGRES_PASSWORD=postgres`
     - `POSTGRES_DB=me_mantra_db`

   - pgAdmin (optional):
     - `PGADMIN_DEFAULT_EMAIL=admin@example.com` (Change from default)
     - `PGADMIN_DEFAULT_PASSWORD=password` (Change from default)

2. Start the Stack

   ```bash
   docker compose up -d
   ```

   - On first run, the backend container installs only backend workspace dependencies inside Docker volumes (not on your host). The pnpm store is bind-mounted to `./.pnpm-store` to keep Docker VM usage low on macOS/Windows.
   - The Postgres container reads `POSTGRES_*` from `apps/backend/.env`. If you later change these, remove the DB volume to reinitialize: `docker compose down -v`.

3. Profiles (optional)

- pgAdmin UI: `docker compose --profile pgadmin up -d`
- Containerized tests: `docker compose --profile tests run --rm pnpm-tests`

4. (Optional) Start PGAdmin in your browser

   ```bash
   docker compose --profile pgadmin up -d
   ```

   - Server mode is enabled. Login with the credentials in `apps/backend/.env` (`PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`). If you previously ran pgAdmin in desktop mode, remove the old volume once so it re‑initializes:

     ```bash
     docker compose --profile pgadmin down -v
     docker compose --profile pgadmin up -d
     ```

   - After login, register a server with:
     - Host: `db`
     - Port: `5432`
     - Database: value of `POSTGRES_DB`
     - Username: value of `POSTGRES_USER`
     - Password: value of `POSTGRES_PASSWORD`

5. Verify everything is running:

   ```bash
   docker ps
   ```

   - You should see:
     - `postgres:17` Up (healthy) `0.0.0.0:5432->5432/tcp`
     - `dpage/pgadmin4:8` Up `0.0.0.0:5051->80/tcp` (if pgAdmin enabled)

   - If using pgAdmin, open http://localhost:5051 and follow the next steps.

6. Connecting in PGAdmin

   - Once inside pgAdmin:
     - Right-click Servers → Register → Server
     - Under General, name it “MeMantra Local”
     - Under Connection:
       - Host: `db`
       - Port: `5432`
       - Database: `me_mantra_db`
       - Username: what you set your `POSTGRES_USER` to in `.env`
       - Password: what you set your `POSTGRES_PASSWORD` to in `.env`
   - You’ll now see all tables under Databases → `me_mantra_db` → Schemas → public → Tables

7. Start/Stop/Reset

   - To stop all containers (without losing data):

   ```bash
   docker compose down
   ```

   - To start them again:

   ```bash
   docker compose up -d
   ```

   - To reset db (delete all data and rerun init.sql):

   ```bash
   docker compose down -v
   docker compose up -d
   ```

8. Reclaiming Space (safe housekeeping)

   - Remove unused images/containers/networks:

     ```bash
     docker system prune -af
     ```

   - Remove unused volumes (clears DB and node_modules volumes):

     ```bash
     docker volume prune -f
     ```

   - Clear build cache:

     ```bash
     docker builder prune -af
     ```

9. Run Tests in Container (optional)

```bash
docker compose --profile tests run --rm pnpm-tests
```

10. Quick Troubleshooting

- Postgres healthcheck fails: `docker compose logs -f db`, verify `POSTGRES_*` in `apps/backend/.env`, reset with `docker compose down -v`.
- Port collisions: change `API_PORT` or `DB_PORT` and restart.
- Stale volumes/caches: `docker compose down -v`, `docker system prune -af`, `docker volume prune -f`, `docker builder prune -af`.

## Cheatsheet

- Quick commands live in `docs/docker/cheatsheet.md`.
