import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';

async function cleanupDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE CLEANUP - REMOVING ALL DUMMY/TEST DATA');
    console.log('='.repeat(60));

    // Get database instance
    const db = mongoose.connection.db;

    // Get list of all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`\nFound ${collectionNames.length} collections:\n`);

    // Collections to completely drop (test/dummy data)
    const collectionsToDelete = [
      'athletes',
      'events',
      'results',
      'teamscores',
      'logs',
      'sessions'
    ];

    // Collections to keep but clean
    const collectionsToClean = {
      'users': 'role !== "test"' // Keep only non-test users
    };

    let deletedCount = 0;
    let cleanedCount = 0;

    // Delete collections
    for (const collName of collectionsToDelete) {
      if (collectionNames.includes(collName)) {
        const collection = db.collection(collName);
        const docCount = await collection.countDocuments();
        await db.dropCollection(collName);
        console.log(`✓ Deleted '${collName}' collection (${docCount} documents removed)`);
        deletedCount++;
      }
    }

    // Clean collections (remove test/dummy data)
    for (const [collName, filter] of Object.entries(collectionsToClean)) {
      if (collectionNames.includes(collName)) {
        const collection = db.collection(collName);
        const testUsers = await collection.find({ 
          $or: [
            { username: { $in: ['test_ped', 'admin_test', 'test_user'] } },
            { role: 'test' }
          ]
        }).toArray();
        
        if (testUsers.length > 0) {
          await collection.deleteMany({ 
            $or: [
              { username: { $in: ['test_ped', 'admin_test', 'test_user'] } },
              { role: 'test' }
            ]
          });
          console.log(`✓ Cleaned '${collName}' collection (${testUsers.length} test users removed)`);
          cleanedCount++;
        } else {
          console.log(`ℹ '${collName}' collection already clean (no test users found)`);
        }
      }
    }

    // Keep empty collections that system needs
    console.log('\n' + '='.repeat(60));
    console.log('FRESH DATABASE READY FOR INITIALIZATION');
    console.log('='.repeat(60));

    const remainingCollections = await db.listCollections().toArray();
    console.log(`\nRemaining collections: ${remainingCollections.map(c => c.name).join(', ')}`);

    console.log('\n✅ DATABASE CLEANUP COMPLETE!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Admin will register as first user (Admin Registration)');
    console.log('   2. Admin creates Colleges');
    console.log('   3. Admin creates Events');
    console.log('   4. PEDs register their Athletes');
    console.log('   5. System ready for athletic meet management\n');

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

cleanupDatabase();
