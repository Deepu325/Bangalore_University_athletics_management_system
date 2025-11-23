/**
 * Migration script to convert string IDs to ObjectIds
 * Run once to fix the database schema mismatch
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrateStringsToObjectIds() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Migrate Athletes
    console.log('🔄 Migrating athletes...');
    const athleteCollection = db.collection('athletes');
    const athletes = await athleteCollection.find({}).toArray();
    console.log(`   Found ${athletes.length} athletes`);

    let updatedAthletes = 0;
    for (const athlete of athletes) {
      const update = {};
      let needsUpdate = false;

      // Convert _id if string
      if (typeof athlete._id === 'string') {
        update['_id'] = new mongoose.Types.ObjectId(athlete._id);
        needsUpdate = true;
      }

      // Convert college if string
      if (athlete.college && typeof athlete.college === 'string') {
        update['college'] = new mongoose.Types.ObjectId(athlete.college);
        needsUpdate = true;
      }

      // Convert event fields if string
      if (athlete.event1 && typeof athlete.event1 === 'string') {
        update['event1'] = new mongoose.Types.ObjectId(athlete.event1);
        needsUpdate = true;
      }
      if (athlete.event2 && typeof athlete.event2 === 'string') {
        update['event2'] = new mongoose.Types.ObjectId(athlete.event2);
        needsUpdate = true;
      }
      if (athlete.relay1 && typeof athlete.relay1 === 'string') {
        update['relay1'] = new mongoose.Types.ObjectId(athlete.relay1);
        needsUpdate = true;
      }
      if (athlete.relay2 && typeof athlete.relay2 === 'string') {
        update['relay2'] = new mongoose.Types.ObjectId(athlete.relay2);
        needsUpdate = true;
      }
      if (athlete.mixedRelay && typeof athlete.mixedRelay === 'string') {
        update['mixedRelay'] = new mongoose.Types.ObjectId(athlete.mixedRelay);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await athleteCollection.updateOne({ _id: athlete._id }, { $set: update });
        updatedAthletes++;
      }
    }
    console.log(`   ✓ Updated ${updatedAthletes} athletes\n`);

    // Migrate Colleges
    console.log('🔄 Migrating colleges...');
    const collegeCollection = db.collection('colleges');
    const colleges = await collegeCollection.find({}).toArray();
    console.log(`   Found ${colleges.length} colleges`);

    let updatedColleges = 0;
    for (const college of colleges) {
      if (typeof college._id === 'string') {
        await collegeCollection.updateOne(
          { _id: college._id },
          { $set: { _id: new mongoose.Types.ObjectId(college._id) } }
        );
        updatedColleges++;
      }
    }
    console.log(`   ✓ Updated ${updatedColleges} colleges\n`);

    // Migrate Events
    console.log('🔄 Migrating events...');
    const eventCollection = db.collection('events');
    const events = await eventCollection.find({}).toArray();
    console.log(`   Found ${events.length} events`);

    let updatedEvents = 0;
    for (const event of events) {
      const update = {};
      let needsUpdate = false;

      if (typeof event._id === 'string') {
        update['_id'] = new mongoose.Types.ObjectId(event._id);
        needsUpdate = true;
      }

      // Convert participants array
      if (Array.isArray(event.participants)) {
        const convertedParticipants = event.participants.map(p => 
          typeof p === 'string' ? new mongoose.Types.ObjectId(p) : p
        );
        if (JSON.stringify(convertedParticipants) !== JSON.stringify(event.participants)) {
          update['participants'] = convertedParticipants;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await eventCollection.updateOne({ _id: event._id }, { $set: update });
        updatedEvents++;
      }
    }
    console.log(`   ✓ Updated ${updatedEvents} events\n`);

    // Verify
    console.log('✅ Migration complete!');
    console.log('\n🔍 Verification - checking first athlete:');
    const testAthlete = await athleteCollection.findOne();
    console.log(`   _id type: ${testAthlete._id.constructor.name}`);
    console.log(`   college type: ${testAthlete.college?.constructor?.name || 'undefined'}`);
    console.log(`   event1 type: ${testAthlete.event1?.constructor?.name || 'undefined'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateStringsToObjectIds();
