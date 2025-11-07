import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from '../types/database.types';
import dotenv from 'dotenv';

dotenv.config();

const dialect = new PostgresDialect({
  pool: new Pool({
    // host: process.env.DB_HOST,
    // port: Number.parseInt(process.env.DB_PORT || '5432'),
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,

  connectionString: process.env.DATABASE_URL, // Neon Hosted Database URL
  ssl: { rejectUnauthorized: false }, // required for Neon
  })
});

export const db = new Kysely<Database>({
  dialect,
});