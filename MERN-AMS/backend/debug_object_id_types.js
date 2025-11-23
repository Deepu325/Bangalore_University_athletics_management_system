/**
 * Debug script to check ObjectId types
 */

import mongoose from 'mongoose';
import { Athlete } from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTypes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Get first athlete
    const athlete = await Athlete.findOne();
    console.log('First athlete:');
    console.log(`  name: ${athlete.name}`);
    console.log(`  event1 value: ${athlete.event1}`);
    console.log(`  event1 type: ${typeof athlete.event1}`);
    console.log(`  event1 constructor: ${athlete.event1?.constructor?.name}`);
    console.log(`  event1 toString(): ${athlete.event1?.toString()}`);
    
    // Try finding with ObjectId
    const eventId = athlete.event1;
    console.log(`\nQuery 1 - Using eventId directly:`);
    const result1 = await Athlete.find({ event1: eventId });
    console.log(`  Result: ${result1.length} athletes`);
    
    console.log(`\nQuery 2 - Using toString():`);
    const result2 = await Athlete.find({ event1: eventId.toString() });
    console.log(`  Result: ${result2.length} athletes`);
    
    console.log(`\nQuery 3 - Using new ObjectId():`);
    const result3 = await Athlete.find({ event1: new mongoose.Types.ObjectId(eventId) });
    console.log(`  Result: ${result3.length} athletes`);

    // Check raw database
    console.log(`\nQuery 4 - Check raw find on collection:`);
    const collection = mongoose.connection.collection('athletes');
    const raw = await collection.findOne({ event1: new mongoose.Types.ObjectId(eventId) });
    console.log(`  Result: ${raw ? 'Found' : 'Not found'}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkTypes();
