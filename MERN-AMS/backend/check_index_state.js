import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run(){
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', uri);
  const db = mongoose.connection.db;
  const collName = 'events';
  const collections = await db.listCollections({ name: collName }).toArray();
  if(collections.length === 0){
    console.error(`Collection '${collName}' does not exist.`);
    process.exit(1);
  }
  const indexes = await db.collection(collName).indexes();
  console.log('Indexes for collection', collName, ':');
  console.log(JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
