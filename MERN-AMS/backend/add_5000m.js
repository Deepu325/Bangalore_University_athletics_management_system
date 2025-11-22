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

const newEvents = [
  { name: "5000m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "5000m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "3000m Steeplechase", gender: "Male", category: "track", status: "Upcoming" },
  { name: "3000m Steeplechase", gender: "Female", category: "track", status: "Upcoming" }
];

async function addEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Check for duplicates and add only missing events
    const added = [];
    for (const evt of newEvents) {
      const exists = await Event.findOne({ name: evt.name, gender: evt.gender });
      if (!exists) {
        const result = await Event.create(evt);
        added.push(result);
        console.log(`✓ Added: ${evt.name} (${evt.gender})`);
      } else {
        console.log(`⚠ Already exists: ${evt.name} (${evt.gender})`);
      }
    }

    // Show all events
    const allEvents = await Event.find().sort({ name: 1 });
    console.log(`\n✓ Total events in DB: ${allEvents.length}`);
    console.log('\nAll Events:');
    allEvents.forEach(e => {
      console.log(`  - ${e.name} (${e.gender}) - ${e.category}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addEvents();
