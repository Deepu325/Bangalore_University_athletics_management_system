import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';

async function cleanAthleteData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');
    console.log('\n' + '='.repeat(70));
    console.log('ATHLETE DATA CLEANUP - REMOVING ALL ATHLETES & RESETTING EVENTS');
    console.log('='.repeat(70));

    const db = mongoose.connection.db;

    // STEP 1: Delete all athletes
    console.log('\n📋 STEP 1: Deleting all athletes...');
    const athleteCollection = db.collection('athletes');
    const athleteDeleteResult = await athleteCollection.deleteMany({});
    console.log(`✓ Deleted ${athleteDeleteResult.deletedCount} athlete records`);

    // STEP 2: Delete all colleges
    console.log('\n🏫 STEP 2: Deleting all colleges...');
    const collegeCollection = db.collection('colleges');
    const collegeDeleteResult = await collegeCollection.deleteMany({});
    console.log(`✓ Deleted ${collegeDeleteResult.deletedCount} college records`);

    // STEP 3: Clean event entries that reference athletes
    console.log('\n📊 STEP 3: Resetting event data...');
    const eventCollection = db.collection('events');
    
    const updateResult = await eventCollection.updateMany({}, {
      $set: {
        callRoom: { present: [], absent: [], disq: [] },
        round1Results: [],
        heats: [],
        heatsResults: [],
        finalResults: [],
        topSelection: { selectedCount: 0, selectedIds: [] },
        combinedPoints: [],
        participants: [],
        athletes: []
      }
    });
    
    console.log(`✓ Reset ${updateResult.modifiedCount} events`);

    // STEP 4: Delete results and team scores
    console.log('\n🏆 STEP 4: Cleaning up results and scores...');
    const resultCollection = db.collection('results');
    const resultDeleteResult = await resultCollection.deleteMany({});
    console.log(`✓ Deleted ${resultDeleteResult.deletedCount} result records`);

    const teamScoreCollection = db.collection('teamscores');
    const teamScoreDeleteResult = await teamScoreCollection.deleteMany({});
    console.log(`✓ Deleted ${teamScoreDeleteResult.deletedCount} team score records`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ATHLETE DATA CLEANUP COMPLETE');
    console.log('='.repeat(70));

    console.log('\n📊 Summary:');
    console.log(`   • Athletes deleted: ${athleteDeleteResult.deletedCount}`);
    console.log(`   • Colleges deleted: ${collegeDeleteResult.deletedCount}`);
    console.log(`   • Events reset: ${updateResult.modifiedCount}`);
    console.log(`   • Results deleted: ${resultDeleteResult.deletedCount}`);
    console.log(`   • Team scores deleted: ${teamScoreDeleteResult.deletedCount}`);

    console.log('\n📋 Database Status:');
    const collections = await db.listCollections().toArray();
    console.log(`   • Total collections: ${collections.length}`);
    collections.forEach(c => {
      console.log(`     - ${c.name}`);
    });

    console.log('\n🚀 Next Steps:');
    console.log('   1. Restart backend: npm start');
    console.log('   2. Restart frontend: npm run dev');
    console.log('   3. Go to Admin Panel → Athlete Registration');
    console.log('   4. Add colleges and athletes');
    console.log('   5. System will be fresh and ready!\n');

    await mongoose.disconnect();
    console.log('✓ MongoDB connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  - Ensure MongoDB is running on localhost:27017');
    console.error('  - Check MONGODB_URI in .env file');
    console.error('  - Verify .env file exists in backend directory\n');
    process.exit(1);
  }
}

cleanAthleteData();
