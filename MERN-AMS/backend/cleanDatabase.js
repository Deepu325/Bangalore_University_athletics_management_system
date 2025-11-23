/**
 * cleanDatabase.js
 * This script DROPS:
 * - athlete_list
 * - college_list
 *
 * Usage:
 * 1. npm install mongoose dotenv
 * 2. Create .env --> MONGO_URI=your connection string
 * 3. node cleanDatabase.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "<YOUR_MONGO_URI_HERE>";

async function cleanDB() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("Connected to MongoDB ✔️");

  const db = mongoose.connection.db;

  const collectionsToDrop = ["athlete_list", "college_list"];

  for (const col of collectionsToDrop) {
    try {
      await db.dropCollection(col);
      console.log(`Dropped collection: ${col} ✔️`);
    } catch (err) {
      console.log(`Collection "${col}" not found or already removed.`);
    }
  }

  await mongoose.disconnect();
  console.log("Database cleaned & MongoDB disconnected ✔️");
}

cleanDB().catch((err) => console.error(err));
