/**
 * Seed Test Colleges from test_colleges.json
 * Adds the 31 colleges from test data to MongoDB
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// College schema
const collegeSchema = new mongoose.Schema({
  code: String,
  name: String,
  location: String,
  contact: String,
  createdAt: { type: Date, default: Date.now }
});

const College = mongoose.model('College', collegeSchema);

// Test colleges from test_colleges.json
const testColleges = [
  "ARUNODAYA COLLEGE",
  "ASC Degree College",
  "BGS Institute of Management",
  "Don Bosco Institute of Management Studies and Computer Applications",
  "G.F.G.C Jayanagar, Bangalore",
  "GFGC Bididi",
  "GFGC Channapatna",
  "GFGC Kodihalli Kanakapura",
  "GFGCT dasarahalli",
  "ISME",
  "Jindal College",
  "KIMSR",
  "LOYALA Degree College",
  "NMKRV COLLEGE",
  "OM SAI DEGREE COLLEGE",
  "Padmashree Institute of Management & Sciences",
  "Pinnacle College",
  "R R Institute of Management Studies- Chikkabanavara",
  "RPA COLLEGE",
  "SET Degree College",
  "SHANTINIKETAN COLLEGE",
  "ST PAULS COLLEGE",
  "Sardar Vallabai Patel First Grade College",
  "Sree Siddaganga First Grade College of Arts and Commerce. Nelamangala",
  "St. Claret College Autonomous",
  "Swamy Vivekananda Rural First Grade College Chandrapura",
  "T John College",
  "UVCE Dep. of Architecture.",
  "Universal School of Administration",
  "Universal school of adminstration",
  "Vasavi Jnana Peetha First grade College"
];

async function seedTestColleges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing colleges
    await College.deleteMany({});
    console.log('✓ Cleared existing colleges');

    // Create colleges from test data
    const colleges = [];
    testColleges.forEach((name, index) => {
      const code = `COL${String(index + 1).padStart(3, '0')}`;
      colleges.push({
        code,
        name,
        location: 'Bangalore',
        contact: `+91${String(Math.floor(Math.random() * 9000000000 + 1000000000)).slice(0, 10)}`
      });
    });

    const created = await College.insertMany(colleges);
    console.log(`✓ Created ${created.length} colleges from test data`);

    // Verify
    const collegeCount = await College.countDocuments();
    console.log(`\n✓ TEST COLLEGES SEEDING COMPLETE!`);
    console.log(`  - Colleges: ${collegeCount}`);
    console.log(`\n  Now run: node seed_events.js && node seed_data.js`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

seedTestColleges();
