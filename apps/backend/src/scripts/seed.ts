/**
 * DATABASE SEED SCRIPT
 * Populates the database with initial mantra data.
 * Run: npx tsx src/scripts/seed.ts (from backend folder)
 */

import 'dotenv/config';
import { UserModel } from '../models/user.model';
import { MantraModel } from '../models/mantra.model';
import { db } from '../db';

async function seedDatabase() {
  console.log('Starting database seed to populate...\n');

  try {
    // Check and create admin user
    console.log('Checking for existing admin...');
    let admin = await UserModel.findByEmail('admin@memantra.com');
    
    if (admin) {
      console.log('Admin already exists, using existing admin');
      console.log(`Admin ID: ${admin.user_id}\n`);
    } else {
      console.log('Creating admin user...');
      admin = await UserModel.create({
        username: 'admin',
        email: 'admin@memantra.com',
        password: 'AdminPassword123!',
      });
      console.log(`Admin created with ID: ${admin.user_id}`);

      // Create Admin entry in Admin table
      await db
        .insertInto('Admin')
        .values({
          admin_id: admin.user_id,
          role: 'super_admin',
        })
        .execute();
      console.log('Admin role assigned\n');
    }

    // Check and create mantra
    console.log('Checking for existing mantra...');
    const existingMantra = await db
      .selectFrom('Mantra')
      .where('title', '=', 'Pressure Is a Privilege')
      .where('background_author', '=', 'Billy Jean King')
      .selectAll()
      .executeTakeFirst();

    let mantra1;
    
    if (existingMantra) {
      console.log('Mantra "Pressure Is a Privilege" already exists, skipping creation');
      console.log(`Existing Mantra ID: ${existingMantra.mantra_id}\n`);
      mantra1 = existingMantra;
    } else {
      console.log('Creating mantra...');
      
      mantra1 = await MantraModel.create({
        title: 'Pressure Is a Privilege',
        
        key_takeaway: 'Tip on how to use: when you\'re spiralling or feeling tense, say it to yourself "Pressure is a privilege" and then smile to remind yourself to enjoy the fact that you got the opportunity.',
        
        background_author: 'Billy Jean King',
        
        background_description: 'Pressure means you\'re in a meaningful, high-stakes moment. It\'s proof that you\'ve earned the opportunity to strive for excellence. Pressure is not a negative burden but a positive sign that you are in a situation where your actions matter and you are trusted to make a difference.',
        
        jamie_take: 'At face value, pressure sucks! Your hands shake, your heart races, your mind fogs. You think: "I hate this, I just want it to be over." But if you take a step back and dissect the feeling, you realize pressure is also proof that you\'re in a moment that matters… a chance to achieve something you value. From that perspective, the mindset shifts to: "Wow, I\'m lucky to be here. Win or lose, success or failure, how many times will I get this chance? How many people are handed the basketball in the dying seconds of the game to take the last shot? Lucky me!" That mindset shifts you away from obsessing about success or failure and into the present moment… the only place you can actually perform. It steadies your nerves, sharpens your focus, and gives you the best chance of delivering. That\'s why the last thing every player sees before walking onto the US Open\'s biggest court are those words: Pressure is a Privilege. And while most of us will never get the opportunity to play under the stadium lights, we do earn our own big moments: giving a presentation at work, serving to stay in the match at a local tennis tournament, stepping onto stage at a community talent show. These moments… you created them. You signed up. You practiced. You faced your fears and managed to show up. The pressure you feel is a sign you created this opportunity. So embrace it. Pressure means you\'re living, growing, and daring to challenge yourself. It means you\'re in the game.',
        
        when_where: 'Work & Career: presentation, job interview or leading a team. Sports & Performance: serving in a tennis match, stepping on stage or running a race. Education & Learning: taking an exam, participating in a debate. Personal Milestones: wedding toast, sharing a story. Everyday moments that matter: standing up for your values, having a tough conversation.',
        
        negative_thoughts: 'I can\'t handle this pressure. I hate this. I just want it to be over. I\'m not good enough for this. If I mess up, it\'ll be a disaster. Everyone is watching and judging me. Why me? I wish someone else had to do this.',
        
        cbt_principles: 'This mantra is a cognitive reframe that reduces anxiety, builds resilience, and helps you align with your values in the moment. Cognitive Reframing (Reappraisal): Instead of interpreting pressure as a threat ("This is awful, I just want it over"), you reframe it as a privilege ("This means I\'ve earned a meaningful opportunity"). Effect: Reduces anxiety, increases motivation, and shifts focus toward growth. Exposure and Tolerance of Discomfort: Avoiding uncomfortable situations reinforces fear. Facing them builds tolerance and confidence. By viewing pressure as valuable, you\'re less likely to avoid it. Each exposure helps you build resilience and perform better under stress. Present-Moment Focus (Mindfulness within CBT): Anxiety often comes from focusing on what might go wrong or replaying past failures. Staying present reduces overwhelm. The mantra anchors you to the here and now. Values-Based Action: Aligning actions with your values (what matters to you) gives meaning to discomfort. The stress you feel is directly tied to something you care about — performing well, achieving, showing up. Recognizing this turns pressure into a sign of alignment with your goals. Growth Mindset and Self-Efficacy: Believing that challenges are opportunities for learning builds confidence and persistence. By treating pressure as proof of opportunity, you strengthen your sense of competence and readiness to grow.',
        
        references: 'Reappraising Stress Arousal Improves Performance and Reduces Stress in Humans Authors: Jamieson, M., et al. (2010). Cognitive Behavioral Therapy for Adult Anxiety Disorders: A Meta-Analysis of Randomized Placebo-Controlled Trials. Effects of Mindfulness on Psychological Health: A Review of Empirical Studies Authors: Keng, S.L., et al. (2011). Acceptance and Commitment Therapy: Model, Processes, and Outcomes Authors: Hayes, S.C., et al. (2006). Mindsets: A View From Two Eras Author: Dweck, C.S. (2019).',
        
        created_by: admin.user_id,
        is_active: true,
      });
      
      console.log(`Mantra created: "${mantra1.title}" (ID: ${mantra1.mantra_id})\n`);
    }

    // Verify data using model functions
    console.log('Verifying seeded data...\n');

    // Test 1: Search by title
    console.log('1. Testing search function with keyword "pressure"...');
    const searchResults = await MantraModel.search('pressure');
    
    if (searchResults.length > 0) {
      console.log(`   Found ${searchResults.length} mantra(s)`);
      console.log(`   Title: ${searchResults[0].title}`);
      console.log(`   Author: ${searchResults[0].background_author}`);
    } else {
      console.log('   No results found');
    }
    console.log('');

    // Test 2: Retrieve by ID
    console.log('2. Testing findById function...');
    const retrievedMantra = await MantraModel.findById(mantra1.mantra_id);
    if (retrievedMantra) {
      console.log(`   Successfully retrieved mantra ID ${retrievedMantra.mantra_id}`);
      console.log(`   Title: ${retrievedMantra.title}`);
      console.log(`   Active status: ${retrievedMantra.is_active}`);
    } else {
      console.log('   Failed to retrieve mantra');
    }
    console.log('');

    // Test 3: Get all mantras
    console.log('3. Testing findAll function...');
    const allMantras = await MantraModel.findAll();
    console.log(`   Total mantras in database: ${allMantras.length}`);
    allMantras.forEach((mantra, index) => {
      console.log(`   ${index + 1}. ${mantra.title}`);
    });
    console.log('');

    // Test 4: Database counts
    console.log('4. Database record counts...');
    const totalUsers = await db
      .selectFrom('User')
      .select((eb) => eb.fn.count('user_id').as('count'))
      .executeTakeFirst();
    const totalMantras = await db
      .selectFrom('Mantra')
      .select((eb) => eb.fn.count('mantra_id').as('count'))
      .executeTakeFirst();

    console.log(`   Users: ${totalUsers?.count}`);
    console.log(`   Mantras: ${totalMantras?.count}\n`);

    console.log('Database seeding completed successfully.\n');
    console.log('Admin credentials:');
    console.log('  Email: admin@memantra.com');
    console.log('  Password: AdminPassword123!\n');

    process.exit(0);

  } catch (error) {
    console.error('\nSeed failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

