/**
 * Check what's actually stored in database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkRawData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const athleteCollection = db.collection('athletes');
    
    // Get first document
    const athlete = await athleteCollection.findOne();
    console.log('Raw document from DB:');
    console.log(JSON.stringify(athlete, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRawData();
