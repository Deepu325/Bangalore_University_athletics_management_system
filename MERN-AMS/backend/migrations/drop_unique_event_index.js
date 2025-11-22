import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Rollback migration: drop unique index on { name: 1, gender: 1 }
// Safety: script checks for collection and index existence before dropping.

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

  const coll = db.collection(collName);
  const indexes = await coll.indexes();
  if(!indexes || indexes.length === 0){
    console.log('No indexes found on collection. Nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('Existing indexes:');
  indexes.forEach(i => console.log(` - ${i.name}: ${JSON.stringify(i.key)}`));

  // Find the index that matches { name: 1, gender: 1 }
  const target = indexes.find(i => {
    if(!i.key) return false;
    // keys may be { name: 1, gender: 1 } or reversed order; compare keys explicitly
    const keys = Object.keys(i.key).map(k => `${k}:${i.key[k]}`).sort().join(',');
    return keys === ['gender:1','name:1'].sort().join(',');
  });

  if(!target){
    // Try common generated name
    const alt = indexes.find(i => i.name === 'name_1_gender_1' || i.name === 'name_1_gender_1_');
    if(alt) target = alt;
  }

  if(!target){
    console.log('No unique index on { name: 1, gender: 1 } found. Nothing to drop.');
    await mongoose.disconnect();
    process.exit(0);
  }

  try{
    console.log(`Dropping index: ${target.name}`);
    await coll.dropIndex(target.name);
    console.log('Index dropped successfully.');
  }catch(err){
    console.error('Failed to drop index:', err.message || err);
    process.exit(2);
  }finally{
    await mongoose.disconnect();
    process.exit(0);
  }
}

if(require.main === module){
  console.log('This rollback will drop the unique index on events(name, gender) if it exists.');
  run();
}
