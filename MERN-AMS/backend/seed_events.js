/**
 * Seed Events into MongoDB
 * Creates all track, jump, throw, relay, and combined events before seeding athletes
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Event schema and model
const eventSchema = new mongoose.Schema({
  name: String,
  gender: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// Sample events
const events = [
  // TRACK EVENTS - MEN
  { name: '100 Metres', gender: 'Male', category: 'track' },
  { name: '200 Metres', gender: 'Male', category: 'track' },
  { name: '400 Metres', gender: 'Male', category: 'track' },
  { name: '800 Metres', gender: 'Male', category: 'track' },
  { name: '1500 Metres', gender: 'Male', category: 'track' },
  { name: '5000 Metres', gender: 'Male', category: 'track' },
  { name: '10,000 Metres', gender: 'Male', category: 'track' },
  { name: '110 Metres Hurdles', gender: 'Male', category: 'track' },
  { name: '400 Metres Hurdles', gender: 'Male', category: 'track' },
  { name: '20 km Walk', gender: 'Male', category: 'track' },
  { name: '3000 Metres Steeple Chase', gender: 'Male', category: 'track' },
  { name: 'Half Marathon', gender: 'Male', category: 'track' },

  // TRACK EVENTS - WOMEN
  { name: '100 Metres', gender: 'Female', category: 'track' },
  { name: '200 Metres', gender: 'Female', category: 'track' },
  { name: '400 Metres', gender: 'Female', category: 'track' },
  { name: '800 Metres', gender: 'Female', category: 'track' },
  { name: '1500 Metres', gender: 'Female', category: 'track' },
  { name: '5000 Metres', gender: 'Female', category: 'track' },
  { name: '10,000 Metres', gender: 'Female', category: 'track' },
  { name: '100 Metres Hurdles', gender: 'Female', category: 'track' },
  { name: '400 Metres Hurdles', gender: 'Female', category: 'track' },
  { name: '20 km Walk', gender: 'Female', category: 'track' },
  { name: '3000 Metres Steeple Chase', gender: 'Female', category: 'track' },
  { name: 'Half Marathon', gender: 'Female', category: 'track' },

  // JUMP EVENTS - BOTH
  { name: 'High Jump', gender: 'Male', category: 'jump' },
  { name: 'High Jump', gender: 'Female', category: 'jump' },
  { name: 'Long Jump', gender: 'Male', category: 'jump' },
  { name: 'Long Jump', gender: 'Female', category: 'jump' },
  { name: 'Pole Vault', gender: 'Male', category: 'jump' },
  { name: 'Pole Vault', gender: 'Female', category: 'jump' },
  { name: 'Triple Jump', gender: 'Male', category: 'jump' },
  { name: 'Triple Jump', gender: 'Female', category: 'jump' },

  // THROW EVENTS - BOTH
  { name: 'Discus Throw', gender: 'Male', category: 'throw' },
  { name: 'Discus Throw', gender: 'Female', category: 'throw' },
  { name: 'Hammer Throw', gender: 'Male', category: 'throw' },
  { name: 'Hammer Throw', gender: 'Female', category: 'throw' },
  { name: 'Javelin Throw', gender: 'Male', category: 'throw' },
  { name: 'Javelin Throw', gender: 'Female', category: 'throw' },
  { name: 'Shot Put', gender: 'Male', category: 'throw' },
  { name: 'Shot Put', gender: 'Female', category: 'throw' },

  // RELAY EVENTS - BOTH
  { name: '4 × 100 Metres Relay', gender: 'Male', category: 'relay' },
  { name: '4 × 100 Metres Relay', gender: 'Female', category: 'relay' },
  { name: '4 × 400 Metres Relay', gender: 'Male', category: 'relay' },
  { name: '4 × 400 Metres Relay', gender: 'Female', category: 'relay' },
  { name: '4 × 400 Metres Mixed Relay', gender: 'Mixed', category: 'relay' },

  // COMBINED EVENTS
  { name: 'Decathlon', gender: 'Male', category: 'combined' },
  { name: 'Heptathlon', gender: 'Female', category: 'combined' }
];

async function seedEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing events
    await Event.deleteMany({});
    console.log('✓ Cleared existing events');

    // Insert all events
    const created = await Event.insertMany(events);
    console.log(`✓ Created ${created.length} events`);

    // Verify
    const eventCount = await Event.countDocuments();
    console.log(`\n✓ EVENT SEEDING COMPLETE!`);
    console.log(`  - Events: ${eventCount}`);
    console.log(`\n  Now run: node seed_data.js`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

seedEvents();
