/**
 * Test MongoDB Atlas connection
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔗 Testing MongoDB Atlas Connection...\n');
    console.log(`Connection URI: ${process.env.MONGODB_URI.substring(0, 50)}...`);
    
    const startTime = Date.now();
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    const connectTime = Date.now() - startTime;
    console.log(`\n✅ Successfully connected to MongoDB Atlas!`);
    console.log(`⏱️  Connection time: ${connectTime}ms`);
    
    // Check connection state
    const state = mongoose.connection.readyState;
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    console.log(`📊 Connection state: ${stateMap[state]} (${state})`);
    
    // Get admin stats
    const admin = mongoose.connection.getClient().db('admin');
    const serverStatus = await admin.command({ serverStatus: 1 });
    console.log(`\n🖥️  Server Info:`);
    console.log(`   Version: ${serverStatus.version}`);
    console.log(`   Uptime: ${serverStatus.uptime}s`);
    console.log(`   Connections: ${serverStatus.connections.current}`);
    
    // List databases
    const databases = await admin.admin().listDatabases();
    console.log(`\n📦 Available Databases:`);
    databases.databases.forEach(db => {
      console.log(`   - ${db.name}`);
    });
    
    // Check our database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Collections in current database:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Count documents
    console.log(`\n📊 Document Counts:`);
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count}`);
    }
    
    console.log(`\n✅ All checks passed!`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Connection failed:`, error.message);
    console.error(`\nError details:`);
    console.error(error);
    process.exit(1);
  }
}

testConnection();
