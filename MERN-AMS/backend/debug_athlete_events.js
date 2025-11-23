/**
 * Debug script to check athlete event references
 */

import mongoose from 'mongoose';
import { Athlete } from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAthletes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Get first 5 athletes
    const athletes = await Athlete.find().limit(5).lean();

    console.log('First 5 athletes (raw):');
    athletes.forEach((a, idx) => {
      console.log(`\n${idx + 1}. ${a.name}`);
      console.log(`   event1: ${a.event1}`);
      console.log(`   event2: ${a.event2}`);
      console.log(`   relay1: ${a.relay1}`);
      console.log(`   relay2: ${a.relay2}`);
      console.log(`   mixedRelay: ${a.mixedRelay}`);
    });

    // Now query for athletes with a specific event
    const testEventId = athletes[0]?.event1;
    if (testEventId) {
      console.log(`\n\nSearching for athletes with event1 = ${testEventId}:`);
      const found = await Athlete.find({ event1: testEventId });
      console.log(`Found: ${found.length} athletes`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAthletes();
