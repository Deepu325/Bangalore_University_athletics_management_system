/**
 * Sync all events with their registered athletes
 * Run once after seeding or after adding new athletes
 * Usage: node sync_events_with_athletes.js
 */

import mongoose from 'mongoose';
import { Event, Athlete } from './models/index.js';
import { attachAthletesToAllEvents } from './utils/attachAthletesToEvent.js';
import dotenv from 'dotenv';

dotenv.config();

async function syncAllEvents() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Get counts before
    const eventCount = await Event.countDocuments();
    const athleteCount = await Athlete.countDocuments();
    console.log(`\n📊 Database Status:`);
    console.log(`   Events: ${eventCount}`);
    console.log(`   Athletes: ${athleteCount}`);

    // Sync all events
    console.log(`\n⏳ Syncing ${eventCount} events with athletes...`);
    const results = await attachAthletesToAllEvents();

    if (!results.success) {
      console.error('❌ Sync failed:', results.error);
      process.exit(1);
    }

    // Print results
    console.log(`\n✓ Sync Complete!`);
    console.log(`   Events processed: ${results.totalEvents}`);
    
    let totalAttached = 0;
    results.results.forEach((result, idx) => {
      if (result.success) {
        totalAttached += result.attachedCount;
        if (result.attachedCount > 0) {
          console.log(`   Event ${idx + 1}: ${result.attachedCount} athletes`);
        }
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   Total athletes attached: ${totalAttached}`);
    console.log(`   Events with athletes: ${results.results.filter(r => r.success && r.attachedCount > 0).length}`);
    console.log(`   Events with 0 athletes: ${results.results.filter(r => r.success && r.attachedCount === 0).length}`);

    // Verify
    console.log(`\n✓ Verification:`);
    const updatedEvents = await Event.find();
    const participantsPerEvent = updatedEvents.map(e => ({
      name: e.name,
      participants: e.participants?.length || 0
    }));
    
    console.log('   Top 10 events by participant count:');
    participantsPerEvent
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 10)
      .forEach(e => {
        console.log(`   - ${e.name}: ${e.participants} athletes`);
      });

    console.log(`\n✅ Sync successful!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during sync:', error.message);
    process.exit(1);
  }
}

syncAllEvents();
