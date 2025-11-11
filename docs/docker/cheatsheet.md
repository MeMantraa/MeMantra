# Docker Ops Cheatsheet

Handy commands for daily workflows.

## Stack lifecycle

- Up (detached): `docker compose up -d`
- Down: `docker compose down`
- Reset DB and reinit: `docker compose down -v && docker compose up -d`

## Logs and exec

- Follow logs: `docker compose logs -f backend`
- Shell into backend: `docker compose exec backend sh`
- Shell into DB: `docker compose exec db bash`

## Images and build

- Rebuild backend image: `docker compose build backend && docker compose up -d`
- List images: `docker images | head`

## Volumes and pruning

- List volumes: `docker volume ls`
- Remove dangling volumes: `docker volume prune -f`
- General cleanup (aggressive): `docker system prune -af && docker builder prune -af`

## Profiles

- Start pgAdmin: `docker compose --profile pgadmin up -d`
- Run tests in container: `docker compose --profile tests run --rm pnpm-tests`

## Database quick commands

- psql shell (POSIX): `docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"`
- psql shell (PowerShell): `docker compose exec db psql -U "$env:POSTGRES_USER" -d "$env:POSTGRES_DB"`
- Backup (POSIX): `docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > backup.sql`
- Backup (PowerShell): `docker compose exec -T db pg_dump -U "$env:POSTGRES_USER" -d "$env:POSTGRES_DB" > backup.sql`
- Restore (POSIX): `docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < backup.sql`
- Restore (PowerShell): `docker compose exec -T db psql -U "$env:POSTGRES_USER" -d "$env:POSTGRES_DB" < backup.sql`

## Shell differences (env vars)

- POSIX (bash/zsh): `docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"`
- PowerShell: `docker compose exec db psql -U "$env:POSTGRES_USER" -d "$env:POSTGRES_DB"`

## Apple Silicon tips

- Most images here are multi-arch and “just work”. If a dependency requires x86:
  - Build once: `docker buildx build --platform linux/amd64 -t memantra/tmp .`
  - Compose build: `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build`

## Quick troubleshooters

- DB healthcheck stuck: `docker compose logs -f db` then reset with `docker compose down -v`
- Port in use: change `API_PORT`/`DB_PORT` then `docker compose up -d`
- Force a clean slate: `docker compose down -v && docker system prune -af && docker volume prune -f`
