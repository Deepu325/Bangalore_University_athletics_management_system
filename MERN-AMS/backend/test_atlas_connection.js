/**
 * Test MongoDB Atlas connection
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  console.log('Testing connection to:', uri.replace(/:[^:]*@/, ':****@'));
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✓ Successfully connected to MongoDB Atlas!');
    
    // Try to get database info
    const db = mongoose.connection.db;
    const stats = await db.stats();
    console.log('Database stats:', stats.db, '- Collections:', stats.collections);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.codeName) console.error('Error code:', error.codeName);
    process.exit(1);
  }
}

testConnection();
