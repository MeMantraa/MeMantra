/**
 * ADD MANTRAS SCRIPT
 * Adds new mantras to the database with duplicate protection.
 * Run: npx tsx src/scripts/add-mantras.ts (from backend folder)
 * 
 * Prerequisites: Admin user must exist (run seed.ts first if needed)
 */

import 'dotenv/config';
import { UserModel } from '../models/user.model';
import { MantraModel } from '../models/mantra.model';
import { db } from '../db';
import mantrasData from '../data/mantras-data.json';

async function addMantras() {
  console.log('Starting mantra addition script...\n');

  try {
    // Step 1: Check for admin user
    console.log('Checking for admin user...');
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@memantra.com';
    const admin = await UserModel.findByEmail(adminEmail);

    if (!admin) {
      throw new Error(
        `Admin user not found with email: ${adminEmail}\nPlease run seed.ts first to create the admin user.`
      );
    }

    console.log(`Admin found: ${admin.username} (ID: ${admin.user_id})\n`);

    // Step 2: Process each mantra
    let addedCount = 0;
    let skippedCount = 0;

    console.log(`Processing ${mantrasData.length} mantras...\n`);

    for (let i = 0; i < mantrasData.length; i++) {
      const mantraData = mantrasData[i];
      const mantraNumber = i + 1;

      console.log(`${mantraNumber}. "${mantraData.title}"`);

      // Check if mantra already exists
      const existingMantra = await db
        .selectFrom('Mantra')
        .where('title', '=', mantraData.title)
        .selectAll()
        .executeTakeFirst();

      if (existingMantra) {
        console.log(`   Status: Already exists (ID: ${existingMantra.mantra_id})`);
        console.log(`   Skipped.\n`);
        skippedCount++;
        continue;
      }

      // Create new mantra
      const newMantra = await MantraModel.create({
        title: mantraData.title,
        key_takeaway: mantraData.key_takeaway,
        background_author: mantraData.background_author,
        background_description: mantraData.background_description,
        jamie_take: mantraData.jamie_take,
        when_where: mantraData.when_where,
        negative_thoughts: mantraData.negative_thoughts,
        cbt_principles: mantraData.cbt_principles,
        references: mantraData.references,
        created_by: admin.user_id,
        is_active: true,
      });

      console.log(`   Status: Created successfully (ID: ${newMantra.mantra_id})`);
      console.log(`   Added.\n`);
      addedCount++;
    }


    // Step 4: Verify total mantras in database
    console.log('Current mantras in database:\n');
    const allMantras = await MantraModel.findAll();
    
    allMantras.forEach((mantra, index) => {
      console.log(`  ${index + 1}. ${mantra.title}`);
    });
    
    console.log(`\nTotal: ${allMantras.length} mantras\n`);

    console.log('Mantra addition completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nScript failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  addMantras();
}

export { addMantras };

