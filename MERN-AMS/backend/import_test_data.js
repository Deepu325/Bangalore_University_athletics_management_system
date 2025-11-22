import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bu-ams';
const TEST_DATA_DIR = process.env.TEST_DATA_DIR || 'D:/PED project/AMS-BU/test data';

// Schemas (minimal for import)
const collegeSchema = new mongoose.Schema({ code: String, name: String, location: String, contact: String, createdAt: Date });
const eventSchema = new mongoose.Schema({ name: String, gender: String, category: String, createdAt: Date });
const athleteSchema = new mongoose.Schema({ name: String, gender: String, chestNo: String, college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' }, event1: String, event2: String, rawEvents: Object, createdAt: Date });

const College = mongoose.model('CollegeImport', collegeSchema);
const Event = mongoose.model('EventImport', eventSchema);
const Athlete = mongoose.model('AthleteImport', athleteSchema);

function normalizeName(name) {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

async function readJson(fileName) {
  const p = path.join(TEST_DATA_DIR, fileName);
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  console.log('Connecting to', MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected');

  try {
    // Read test data
    const collegesRaw = await readJson('test_colleges.json');
    const eventsRaw = await readJson('test_events.json');
    const athletesRaw = await readJson('athlete_list.json');

    // Clear import collections (safe for test imports)
    await College.deleteMany({});
    await Event.deleteMany({});
    await Athlete.deleteMany({});

    // Insert colleges
    console.log(`Importing ${collegesRaw.length} colleges...`);
    const collegeDocs = [];
    for (let i = 0; i < collegesRaw.length; i++) {
      const name = String(collegesRaw[i]).trim();
      const code = `CLG${String(i+1).padStart(3,'0')}`;
      const doc = new College({ code, name, location: '', contact: '', createdAt: new Date() });
      collegeDocs.push(await doc.save());
    }
    const collegeMap = new Map(collegeDocs.map(c => [normalizeName(c.name), c]));

    // Insert events
    console.log('Importing events from categories...');
    const categories = eventsRaw.categories || {};
    const eventDocs = [];
    for (const [catKey, list] of Object.entries(categories)) {
      if (Array.isArray(list)) {
        for (const ev of list) {
          const doc = new Event({ name: String(ev).trim(), category: catKey, gender: '', createdAt: new Date() });
          eventDocs.push(await doc.save());
        }
      } else if (typeof list === 'object') {
        // combined events object with men/women
        for (const [k,v] of Object.entries(list)) {
          const gender = k.toLowerCase().includes('men') ? 'Men' : k.toLowerCase().includes('women') ? 'Women' : '';
          const doc = new Event({ name: String(v).trim(), category: catKey, gender, createdAt: new Date() });
          eventDocs.push(await doc.save());
        }
      }
    }

    // Map event names to docs (normalized)
    const eventMap = new Map(eventDocs.map(e => [normalizeName(e.name), e]));

    // Insert athletes
    console.log(`Importing ${athletesRaw.length} athletes...`);
    let created = 0;
    for (const a of athletesRaw) {
      const collegeName = a.college || a.collegeName || '';
      let collegeDoc = collegeMap.get(normalizeName(collegeName));
      if (!collegeDoc) {
        // create missing college
        collegeDoc = await new College({ code: `CLG_UNK_${Date.now()}`, name: collegeName || 'Unknown College', location: '', contact: '', createdAt: new Date() }).save();
        collegeMap.set(normalizeName(collegeDoc.name), collegeDoc);
      }

      const indiv = (a.events && a.events.individual) || a.individualEvents || [];
      const ev1raw = indiv[0] || null;
      const ev2raw = indiv[1] || null;
      const ev1 = ev1raw ? (eventMap.get(normalizeName(String(ev1raw))) ? eventMap.get(normalizeName(String(ev1raw)))._id : String(ev1raw)) : null;
      const ev2 = ev2raw ? (eventMap.get(normalizeName(String(ev2raw))) ? eventMap.get(normalizeName(String(ev2raw)))._id : String(ev2raw)) : null;

      const athleteDoc = new Athlete({
        name: a.name || a.Name || 'Unknown',
        gender: a.gender || 'Mixed',
        chestNo: a.chestNo || a.chestNumber || '',
        college: collegeDoc._id,
        event1: ev1 || null,
        event2: ev2 || null,
        rawEvents: a.events || {},
        createdAt: new Date()
      });

      await athleteDoc.save();
      created++;
    }

    console.log(`✓ Imported ${collegeDocs.length} colleges, ${eventDocs.length} events, ${created} athletes`);
    process.exit(0);
  } catch (err) {
    console.error('Import error:', err);
    process.exit(1);
  }
}

main();
