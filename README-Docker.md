## Prerequisites

1. **Install PostgreSQL**
   - Download PostgreSQL from [official website](https://www.postgresql.org/download/)
   - During installation:
     - Remember the password you set for the 'postgres' user
     - Default port: 5432
     - Install all offered components, including pgAdmin 4

2. **Install Docker Desktop**
   - Download Docker Desktop (includes Docker Compose) from [official website] (https://www.docker.com/products/docker-desktop/)

## Container Setup Steps

1. **Configure env**
   - Create your local env file:

   ```bash
   cp .env.example .env
   ```

   - Make sure these are set:
   - POSTGRES_USER=postgres (Change from default)
   - POSTGRES_PASSWORD=postgres (Change from default)
   - POSTGRES_DB=me_mantra_db (keep as is)
   - DB_PORT=5432 (keep as is)

   - pgAdmin (optional):
   - PGADMIN_DEFAULT_EMAIL=admin@example.com (Change from default)
   - PGADMIN_DEFAULT_PASSWORD=password (Change from default)

2. **Start the Stack**

   ```bash
   docker compose up -d
   ```

3. **(Optional) Start PGAdmin in your browser**
   ```bash
   docker compose --profile pgadmin up -d
   ```
4. **Verify everything is running:**

   ```bash
   docker ps
   ```

   - You Should see:
   - postgres:17 Up (healthy) 0.0.0.0:5432->5432/tcp
   - dpage/pgadmin4:8 Up 0.0.0.0:5050->80/tcp

   - If using pgAdmin, open (http://localhost:5050), and follow the next steps.

5. **Connecting in PGAdmin**
   - Once inside pgAdmin:
   - Right-click Servers → Register → Server
   - Under General, name it “MeMantra Local”
   - Under Connection:
     - Host: db
     - Port: 5432
     - Database: me_mantra_db
     - Username: what you set your POSTGRES_USER to in .env
     - Password: what you set your POSTGRES_PASSWORD to in .env
   - You’ll now see all tables under Databases → me_mantra_db → Schemas → public → Tables

6. **Stopping and starting containers**
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

7. **(NOT FUNCTIONAL YET) Run Tests inside Container**
   ```bash
   docker compose --profile tests run --rm pnpm-tests
   ```
