## Prerequisites

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
   -  After entering it, you'll see a prompt like this: ```postgres=# ```

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