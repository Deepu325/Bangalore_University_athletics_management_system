# 🎬 Quick Event Setup for Seeding

## One-Line Event Creation

If your Event collection is empty, run this in MongoDB to create all required events quickly.

### Via MongoDB Shell

```bash
mongosh
# or: mongo
```

Then paste:

```javascript
use buams

db.events.insertMany([
  // Men's Track
  { name: "100m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "200m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "400m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "800m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "1500m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "110m Hurdles", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },

  // Men's Jump
  { name: "Long Jump", gender: "Male", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "High Jump", gender: "Male", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "Pole Vault", gender: "Male", category: "jump", status: "Upcoming", createdAt: new Date() },

  // Men's Throw
  { name: "Shot Put", gender: "Male", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Discus Throw", gender: "Male", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Javelin Throw", gender: "Male", category: "throw", status: "Upcoming", createdAt: new Date() },

  // Men's Relay
  { name: "4x100m Relay", gender: "Male", category: "relay", status: "Upcoming", createdAt: new Date() },
  { name: "4x400m Relay", gender: "Male", category: "relay", status: "Upcoming", createdAt: new Date() },

  // Women's Track
  { name: "100m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "200m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "400m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "800m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "1500m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "100m Hurdles", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },

  // Women's Jump
  { name: "Long Jump", gender: "Female", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "High Jump", gender: "Female", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "Pole Vault", gender: "Female", category: "jump", status: "Upcoming", createdAt: new Date() },

  // Women's Throw
  { name: "Shot Put", gender: "Female", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Discus Throw", gender: "Female", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Javelin Throw", gender: "Female", category: "throw", status: "Upcoming", createdAt: new Date() },

  // Women's Relay
  { name: "4x100m Relay", gender: "Female", category: "relay", status: "Upcoming", createdAt: new Date() },
  { name: "4x400m Relay", gender: "Female", category: "relay", status: "Upcoming", createdAt: new Date() },

  // Mixed Relay
  { name: "4x400m Mixed Relay", gender: "Female", category: "relay", status: "Upcoming", createdAt: new Date() }
])
```

Expected output:
```javascript
{
  acknowledged: true,
  insertedIds: [
    ObjectId("..."),
    ObjectId("..."),
    // ... 27 more ObjectIds ...
  ]
}
```

Verify:
```javascript
db.events.countDocuments()  // Should be 29
db.events.find({}).pretty() // Show all events
```

---

## Via Node.js Script

If you prefer to create events programmatically:

Save as `backend/create_events.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['track', 'field', 'jump', 'throw', 'relay', 'combined'] },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed'], default: 'Upcoming' },
  date: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/buams';

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
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const inserted = await Event.insertMany(events);
    console.log(`✓ Created ${inserted.length} events`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createEvents();
```

Run it:
```bash
node create_events.js
```

---

## Verification

After creating events, verify:

```javascript
// In mongosh
use buams
db.events.countDocuments()  // Should be 29

db.events.find({ gender: "Male" }).count()    // Should be 14
db.events.find({ gender: "Female" }).count()  // Should be 15

db.events.find({ category: "track" }).count()  // Should be 12
db.events.find({ category: "jump" }).count()   // Should be 6
db.events.find({ category: "throw" }).count()  // Should be 6
db.events.find({ category: "relay" }).count()  // Should be 5
```

All events ready? Now run:

```bash
node seed_realistic_with_real_event_ids.js
```

---

## Quick Checklist

- [ ] MongoDB running
- [ ] `buams` database created
- [ ] 29 events inserted
- [ ] `.env` file configured with MONGO_URI
- [ ] Dependencies installed: `npm install mongoose bcryptjs dotenv`
- [ ] Ready to run seeding script

✅ When all checked, run: `node seed_realistic_with_real_event_ids.js`
