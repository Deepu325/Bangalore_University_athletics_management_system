import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const eventSchema = new mongoose.Schema({
  name: String,
  category: String,
  gender: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

const events = [
  // Men's Track
  { name: "100m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "200m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "400m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "800m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "1500m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "110m Hurdles", gender: "Male", category: "track", status: "Upcoming" },

  // Men's Jump
  { name: "Long Jump", gender: "Male", category: "jump", status: "Upcoming" },
  { name: "High Jump", gender: "Male", category: "jump", status: "Upcoming" },
  { name: "Pole Vault", gender: "Male", category: "jump", status: "Upcoming" },

  // Men's Throw
  { name: "Shot Put", gender: "Male", category: "throw", status: "Upcoming" },
  { name: "Discus Throw", gender: "Male", category: "throw", status: "Upcoming" },
  { name: "Javelin Throw", gender: "Male", category: "throw", status: "Upcoming" },

  // Men's Relay
  { name: "4x100m Relay", gender: "Male", category: "relay", status: "Upcoming" },
  { name: "4x400m Relay", gender: "Male", category: "relay", status: "Upcoming" },

  // Women's Track
  { name: "100m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "200m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "400m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "800m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "1500m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "100m Hurdles", gender: "Female", category: "track", status: "Upcoming" },

  // Women's Jump
  { name: "Long Jump", gender: "Female", category: "jump", status: "Upcoming" },
  { name: "High Jump", gender: "Female", category: "jump", status: "Upcoming" },
  { name: "Pole Vault", gender: "Female", category: "jump", status: "Upcoming" },

  // Women's Throw
  { name: "Shot Put", gender: "Female", category: "throw", status: "Upcoming" },
  { name: "Discus Throw", gender: "Female", category: "throw", status: "Upcoming" },
  { name: "Javelin Throw", gender: "Female", category: "throw", status: "Upcoming" },

  // Women's Relay
  { name: "4x100m Relay", gender: "Female", category: "relay", status: "Upcoming" },
  { name: "4x400m Relay", gender: "Female", category: "relay", status: "Upcoming" },

  // Mixed Relay
  { name: "4x400m Mixed Relay", gender: "Female", category: "relay", status: "Upcoming" }
];

async function createEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing events
    await Event.deleteMany({});
    console.log('✓ Cleared existing events');

    // Insert events
    const result = await Event.insertMany(events);
    console.log(`✓ Created ${result.length} events`);
    
    // Show count
    const count = await Event.countDocuments();
    console.log(`✓ Total events in DB: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

createEvents();
