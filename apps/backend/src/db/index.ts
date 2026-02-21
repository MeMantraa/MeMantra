import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
import { Database } from '../types/database.types';
import dotenv from 'dotenv';

dotenv.config();

// OID 1114 = TIMESTAMP WITHOUT TIME ZONE
// By default pg interprets these in the server's local timezone, causing
// time offsets when the server isn't UTC. Treat them as UTC so the ISO
// strings stored via toISOString() round-trip correctly.
types.setTypeParser(1114, (val: string) => val.replace(' ', 'T') + 'Z');

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }),
});

export const db = new Kysely<Database>({
  dialect,
});