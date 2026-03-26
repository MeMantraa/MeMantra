/* global afterAll */

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Keep CI output readable; test files can still spy on these methods.
console.log = () => {};
console.warn = () => {};
console.error = () => {};

afterAll(async () => {
  try {
    // Close Kysely/pg resources if any test loaded the real DB module.
    // Many tests mock `../../src/db`, but this keeps CI from hanging when
    // a real pool slips through.
    const { db } = require('../src/db');
    if (db && typeof db.destroy === 'function') {
      await db.destroy();
    }
  } catch {
    // Ignore when DB module wasn't loaded/mocked in the current test context.
  }
  try {
    // Close direct pg pool users as well.
    const { pool } = require('../src/config/db.config');
    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  } catch {
    // Ignore when config module wasn't loaded/mocked.
  }
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
