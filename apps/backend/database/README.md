# Database Setup Guide

## Shared Hosted Database (Neon PostgreSQL)

We've migrated the local database to use a shared hosted PostgreSQL (Neon) instance.

### Connection Details

Add this to your `.env` file (in the `apps/backend/` folder):

```env
DATABASE_URL=postgresql://neondb_owner:YOURPASSWORD@ep-lucky-poetry-ahqok66j-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Replace `YOURPASSWORD` with the password provided by Aman.**

### Configuration Notes

Follow the guide from `env.example` to uncomment the local DB section and update your `.env` accordingly.

### Verify Connection

To verify and test the connection (be inside your backend folder):

```bash
npx tsx src/config/db.config.ts
```

You should see: `Connected to Neon DB successfully!`

### Usage

Use the model functions inside `apps/backend/src/models` to interact with the database.

**Example:** Check `seed.ts` for how to create users, insert mantras, and validate the seeded data.


### For an Easy Interface (UI) to check the database and manage:

You can manage the Neon DB through:

- **Neon Web UI**
- **pgAdmin** (using the same connection URL)

Credentials and details will be shared privately along with the password.

---

## Local PostgreSQL Setup (Older Version)

Credentials and login details will be shared privately along with the password.
1. **Install PostgreSQL**
   - Download PostgreSQL from [official website](https://www.postgresql.org/download/)
   - During installation:
     - Remember the password you set for the 'postgres' user
     - Default port: 5432
     - Install all offered components, including pgAdmin 4

## Database Setup Steps

### Using Command Line (psql)

1. **Open Terminal/PowerShell**
   - Navigate to the project's database directory:

   ```bash
   cd backend\database
   ```

2. **Connect to PostgreSQL**

   ```bash
   psql -U postgres
   ```

   - Enter the password you set during installation when prompted
   - After entering it, you'll see a prompt like this: `postgres=# `

3. **Create the Database**

   ```sql
   CREATE DATABASE me_mantra_db;
   ```

   - Type `\q` to exit psql

4. **Initialize Database Schema - Run (inside backend/database/)**

   ```bash
   psql -U postgres -d me_mantra_db -f init.sql
   ```

   - Enter password when prompted
   - This will connect to your local PostgreSQL instance, execute sql statements, Set up all 10 tables and their relationships, and exit once done.
   - You should see multiple "CREATE TABLE" and "ALTER TABLE" messages

5. **Verify Setup**
   ```bash
   psql -U postgres -d me_mantra_db
   ```
   Then type:
   ```sql
   \dt
   ```
   You should see 10 tables:
   - Admin, Category, Collection, CollectionMantra, Like, Mantra, MantraCategory, RecommendationLog, Reminder, User
