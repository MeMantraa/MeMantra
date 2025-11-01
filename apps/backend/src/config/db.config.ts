import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  // host: process.env.DB_HOST,
  // port: Number.parseInt(process.env.DB_PORT || '5432'),
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME,

  connectionString: process.env.DATABASE_URL, // Neon Hosted Database URL
  ssl: { rejectUnauthorized: false }, // required for Neon
});

export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the Neon hosted shared database');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

testConnection();