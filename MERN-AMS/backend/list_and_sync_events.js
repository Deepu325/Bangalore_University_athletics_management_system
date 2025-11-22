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

// Canonical list based on user request
const requiredEvents = [];

// Track events (both genders unless specified)
const trackBoth = [
  '100 Metres','200 Metres','400 Metres','800 Metres','1500 Metres','5000 Metres','10,000 Metres',
  '400 Metres Hurdles','20 km Walk','3000 Metres Steeple Chase','4 × 100 Metres Relay','4 × 400 Metres Relay',
  '4 × 400 Metres Mixed Relay','Half Marathon'
];
trackBoth.forEach(name => {
  requiredEvents.push({ name, gender: 'Male', category: 'track' });
  requiredEvents.push({ name, gender: 'Female', category: 'track' });
});

// Hurdles specifics (already included above but ensure 100m H and 110m H exist correctly)
requiredEvents.push({ name: '100 Metres Hurdles', gender: 'Female', category: 'track' });
requiredEvents.push({ name: '110 Metres Hurdles', gender: 'Male', category: 'track' });

// Jumping events
['High Jump','Long Jump','Pole Vault','Triple Jump'].forEach(name => {
  requiredEvents.push({ name, gender: 'Male', category: 'jump' });
  requiredEvents.push({ name, gender: 'Female', category: 'jump' });
});

// Throwing events
['Discus Throw','Hammer Throw','Javelin Throw','Shot Put'].forEach(name => {
  requiredEvents.push({ name, gender: 'Male', category: 'throw' });
  requiredEvents.push({ name, gender: 'Female', category: 'throw' });
});

// Combined events
requiredEvents.push({ name: 'Decathlon', gender: 'Male', category: 'combined' });
requiredEvents.push({ name: 'Heptathlon', gender: 'Female', category: 'combined' });

// Normalize helper
function normalizeName(n){
  return n.replace(/\s+/g,' ').trim().toLowerCase();
}

async function listAndSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    const existing = await Event.find({}).lean();
    console.log(`Found ${existing.length} events in DB`);

    const existingSet = new Set(existing.map(e => `${normalizeName(e.name)}||${e.gender}`));

    const toAdd = [];
    requiredEvents.forEach(evt => {
      const key = `${normalizeName(evt.name)}||${evt.gender}`;
      if (!existingSet.has(key)) toAdd.push(evt);
    });

    if (toAdd.length === 0) {
      console.log('No missing events to add.');
    } else {
      console.log(`Adding ${toAdd.length} missing events...`);
      for (const e of toAdd) {
        try {
          const created = await Event.create({ name: e.name, gender: e.gender, category: e.category, status: 'Upcoming' });
          console.log(`✓ Added: ${created.name} (${created.gender}) - ${created.category}`);
        } catch (err) {
          console.error('✗ Failed to add', e, err.message);
        }
      }
    }

    const final = await Event.find({}).sort({ name: 1 }).lean();
    console.log('\nFinal Events List:');
    final.forEach(e => console.log(` - ${e.name} (${e.gender}) - ${e.category}`));

    // write report file
    const fs = await import('fs');
    const report = {
      initialCount: existing.length,
      added: toAdd,
      finalCount: final.length,
      finalList: final.map(e => ({ name: e.name, gender: e.gender, category: e.category }))
    };
    fs.writeFileSync('event_sync_report.json', JSON.stringify(report, null, 2), 'utf8');
    console.log('\nWrote event_sync_report.json');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

listAndSync();
