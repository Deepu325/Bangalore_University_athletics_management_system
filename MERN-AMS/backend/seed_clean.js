/**
 * MASTER SEED SCRIPT
 * Clean and comprehensive seeding of colleges, athletes, and events
 * with proper JSON normalization and schema validation
 * 
 * Usage: node seed_clean.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import College from './models/College.js';
import Athlete from './models/Athlete.js';
import Event from './models/Event.js';
import User from './models/User.js';
import {
  normalizeColleges,
  normalizeAthletes,
  normalizeEvents
} from './utils/seedNormalizer.js';
import { attachAthletesToEvent } from './utils/attachAthletesToEvent.js';
import { sanitizeUsername } from './utils/sanitizeUsername.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
const BCRYPT_SALT = 10;

// ============ SAMPLE DATA ============

const collegesData = [
  { code: 'CLS001', name: 'Christ University', pedName: 'Dr. Rajesh Kumar', pedPhone: '9876543210' },
  { code: 'CLS002', name: 'St. Johns College', pedName: 'Dr. Ramesh Singh', pedPhone: '9876543211' },
  { code: 'CLS003', name: 'Adarsha College', pedName: 'Dr. Satish Patel', pedPhone: '9876543212' },
  { code: 'CLS004', name: 'Mount Carmel College', pedName: 'Dr. Harish PM', pedPhone: '9876543213' },
  { code: 'CLS005', name: 'Kristu Jayanti College', pedName: 'Dr. Suresh Reddy', pedPhone: '9876543214' }
];

const eventsData = [
  // Track Events
  { name: '100m', code: 'TR100', category: 'track', gender: 'Male' },
  { name: '100m', code: 'TR100F', category: 'track', gender: 'Female' },
  { name: '200m', code: 'TR200', category: 'track', gender: 'Male' },
  { name: '200m', code: 'TR200F', category: 'track', gender: 'Female' },
  { name: '400m', code: 'TR400', category: 'track', gender: 'Male' },
  { name: '400m', code: 'TR400F', category: 'track', gender: 'Female' },
  { name: '1500m', code: 'TR1500', category: 'track', gender: 'Male' },
  { name: '1500m', code: 'TR1500F', category: 'track', gender: 'Female' },
  // Relay Events
  { name: '4x100m Relay', code: 'RLY4100', category: 'relay', gender: 'Male' },
  { name: '4x100m Relay', code: 'RLY4100F', category: 'relay', gender: 'Female' },
  { name: '4x400m Relay', code: 'RLY4400', category: 'relay', gender: 'Male' },
  { name: '4x400m Relay', code: 'RLY4400F', category: 'relay', gender: 'Female' },
  // Field Events
  { name: 'Long Jump', code: 'FLD_LJ', category: 'jump', gender: 'Male' },
  { name: 'Long Jump', code: 'FLD_LJF', category: 'jump', gender: 'Female' },
  { name: 'High Jump', code: 'FLD_HJ', category: 'jump', gender: 'Male' },
  { name: 'High Jump', code: 'FLD_HJF', category: 'jump', gender: 'Female' },
  // Throw Events
  { name: 'Shot Put', code: 'THR_SP', category: 'throw', gender: 'Male' },
  { name: 'Shot Put', code: 'THR_SPF', category: 'throw', gender: 'Female' },
  { name: 'Discus Throw', code: 'THR_DT', category: 'throw', gender: 'Male' },
  { name: 'Discus Throw', code: 'THR_DTF', category: 'throw', gender: 'Female' }
];

const maleNames = ['Aarav', 'Arjun', 'Aditya', 'Vikram', 'Rohan', 'Karan', 'Nikhil', 'Rahul', 'Sanjay', 'Devendra'];
const femaleNames = ['Anjali', 'Priya', 'Neha', 'Shreya', 'Richa', 'Pooja', 'Divya', 'Swati', 'Kavya', 'Nisha'];
const lastNames = ['Sharma', 'Singh', 'Patel', 'Kumar', 'Khan', 'Gupta', 'Desai', 'Iyer', 'Nair', 'Rao'];

function getRandomName(gender) {
  const firstNames = gender === 'Male' ? maleNames : femaleNames;
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

// ============ SEEDING FUNCTIONS ============

async function seedColleges() {
  console.log('\n🏫 SEEDING COLLEGES...');
  try {
    await College.deleteMany({});
    await User.deleteMany({ role: 'ped' });

    const normalizedColleges = normalizeColleges(collegesData);
    const createdColleges = [];

    for (const collegeData of normalizedColleges) {
      const college = await College.create(collegeData);
      createdColleges.push(college);

      // Create PED user for college
      const pedUsername = sanitizeUsername(collegeData.pedName);
      const hashedPassword = await bcrypt.hash(collegeData.pedPhone, BCRYPT_SALT);

      await User.create({
        username: pedUsername,
        password: hashedPassword,
        role: 'ped',
        collegeId: college._id,
        mustChangePassword: true
      });

      console.log(`✓ Created: ${college.name} (${college.code}) - PED: ${pedUsername}`);
    }

    return createdColleges;
  } catch (err) {
    console.error('❌ College seeding failed:', err.message);
    return [];
  }
}

async function seedEvents() {
  console.log('\n🏃 SEEDING EVENTS...');
  try {
    await Event.deleteMany({});

    const normalizedEvents = normalizeEvents(eventsData);
    const createdEvents = [];

    for (const eventData of normalizedEvents) {
      const event = await Event.create(eventData);
      createdEvents.push(event);
      console.log(`✓ Created: ${event.name} (${event.gender})`);
    }

    return createdEvents;
  } catch (err) {
    console.error('❌ Event seeding failed:', err.message);
    return [];
  }
}

async function seedAthletes(colleges, events) {
  console.log('\n👥 SEEDING ATHLETES...');
  try {
    await Athlete.deleteMany({});

    let athleteCount = 0;
    const createdAthletes = [];

    // Create athletes for each college
    for (const college of colleges) {
      // 10 males + 10 females per college
      for (let i = 0; i < 10; i++) {
        // Male athlete
        const maleAthlete = await Athlete.create({
          name: getRandomName('Male'),
          gender: 'Male',
          college: college._id,
          uucms: `${college.code}M${i + 1}`,
          chestNo: `M${athleteCount + 1}`,
          status: 'PRESENT'
        });
        createdAthletes.push(maleAthlete);
        athleteCount++;

        // Female athlete
        const femaleAthlete = await Athlete.create({
          name: getRandomName('Female'),
          gender: 'Female',
          college: college._id,
          uucms: `${college.code}F${i + 1}`,
          chestNo: `F${athleteCount + 1}`,
          status: 'PRESENT'
        });
        createdAthletes.push(femaleAthlete);
        athleteCount++;
      }

      console.log(`✓ Created ${20} athletes for ${college.name}`);
    }

    console.log(`✅ Total athletes created: ${athleteCount}`);
    return createdAthletes;
  } catch (err) {
    console.error('❌ Athlete seeding failed:', err.message);
    return [];
  }
}

async function attachAthletesToEvents(events, athletes) {
  console.log('\n🔗 ATTACHING ATHLETES TO EVENTS...');
  try {
    for (const event of events) {
      // Filter athletes by gender and randomly assign some to events
      const matchingAthletes = athletes.filter(a => a.gender === event.gender);
      const selectedAthletes = matchingAthletes.slice(0, Math.min(10, matchingAthletes.length));

      // Update event with participants
      event.participants = selectedAthletes.map(a => a._id);
      await event.save();

      console.log(`✓ Attached ${selectedAthletes.length} athletes to ${event.name} (${event.gender})`);
    }

    console.log('✅ All athletes attached to events');
  } catch (err) {
    console.error('❌ Event attachment failed:', err.message);
  }
}

async function createAdminUser() {
  console.log('\n🔐 CREATING ADMIN USER...');
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('✓ Admin user already exists');
      return;
    }

    const adminPassword = await bcrypt.hash('admin123456', BCRYPT_SALT);
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      email: 'admin@bu-ams.local',
      mustChangePassword: false
    });

    console.log('✓ Admin created: username=admin, password=admin123456');
  } catch (err) {
    console.error('❌ Admin creation failed:', err.message);
  }
}

// ============ MAIN EXECUTION ============

async function main() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('  BU-AMS CLEAN SEED SCRIPT');
    console.log('='.repeat(60));

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Seed data
    const colleges = await seedColleges();
    const events = await seedEvents();
    const athletes = await seedAthletes(colleges, events);
    await attachAthletesToEvents(events, athletes);
    await createAdminUser();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nSummary:`);
    console.log(`  Colleges: ${colleges.length}`);
    console.log(`  Events: ${events.length}`);
    console.log(`  Athletes: ${athletes.length}`);
    console.log(`  Admin User: admin / admin123456\n`);

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
    process.exit(1);
  }
}

main();
