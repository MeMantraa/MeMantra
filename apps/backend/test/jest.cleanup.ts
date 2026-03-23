/* global afterAll */

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
});
