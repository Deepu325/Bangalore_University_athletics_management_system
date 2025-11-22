import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Migration: add unique index on { name: 1, gender: 1 }
// SAFETY: This script performs checks and will abort if duplicates are detected.
// Run only after you have a DB backup. This file WILL NOT be executed automatically by me.

async function run(){
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', uri);

  const db = mongoose.connection.db;
  const collName = 'events';

  const collections = await db.listCollections({ name: collName }).toArray();
  if(collections.length === 0){
    console.error(`Collection '${collName}' does not exist. Aborting.`);
    process.exit(1);
  }

  console.log(`Collection '${collName}' found.`);

  // Normalize function (same logic as used in merge script)
  const normalize = (s) => {
    if(!s) return '';
    return s.toString().toLowerCase()
      .replace(/×/g,'x')
      .replace(/\u00A0/g,' ')
      .replace(/[^a-z0-9 ]+/g,' ')
      .replace(/metres|metre|meters|meter/ig,'m')
      .replace(/\s+/g,' ').trim();
  };

  // Detect duplicates by normalized name + gender
  const pipeline = [
    { $project: { name: 1, gender: 1 } },
    { $addFields: { normName: { $toLower: { $trim: { input: '$name' } } } } },
    { $group: { _id: { name: '$normName', gender: '$gender' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ];

  const dups = await db.collection(collName).aggregate(pipeline).toArray();
  if(dups.length > 0){
    console.error('Found duplicate groups (normalized name + gender). Aborting index creation.');
    console.error('Examples (up to 10):');
    dups.slice(0,10).forEach(d => console.error(JSON.stringify(d)));
    console.error('\nPlease resolve duplicates before creating a unique index.');
    process.exit(2);
  }

  console.log('No duplicates detected (normalized name + gender). Proceeding to create index.');

  try{
    const result = await db.collection(collName).createIndex({ name: 1, gender: 1 }, { unique: true, background: false });
    console.log('Index creation result:', result);
    console.log('Unique index created successfully on { name: 1, gender: 1 }');
  }catch(err){
    console.error('Index creation failed:', err.message || err);
    process.exit(3);
  }finally{
    await mongoose.disconnect();
    process.exit(0);
  }
}

if(require.main === module){
  console.log('This migration will create a unique index on events(name, gender).');
  console.log('IMPORTANT: Do a database backup BEFORE running this script.');
  run();
}
