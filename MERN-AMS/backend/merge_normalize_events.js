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

const athleteSchema = new mongoose.Schema({}, { strict: false });
const Athlete = mongoose.model('Athlete', athleteSchema);

const resultSchema = new mongoose.Schema({}, { strict: false });
const Result = mongoose.model('Result', resultSchema);

// Canonical list (user-provided)
const canonical = {
  track: [
    '100 Metres', '200 Metres', '400 Metres', '800 Metres', '1500 Metres', '5000 Metres', '10,000 Metres',
    '400 Metres Hurdles', '20 km Walk', '3000 Metres Steeple Chase', '4 × 100 Metres Relay', '4 × 400 Metres Relay',
    '4 × 400 Metres Mixed Relay', 'Half Marathon', '100 Metres Hurdles', '110 Metres Hurdles'
  ],
  jump: ['High Jump', 'Long Jump', 'Pole Vault', 'Triple Jump'],
  throw: ['Discus Throw', 'Hammer Throw', 'Javelin Throw', 'Shot Put'],
  combined: ['Decathlon', 'Heptathlon']
};

function normalizeKey(name){
  if(!name) return '';
  let s = name.toLowerCase();
  // Normalize common symbols
  s = s.replace(/×/g,'x');
  s = s.replace(/\u00A0/g,' ');
  s = s.replace(/[^a-z0-9 ]+/g,' ');
  s = s.replace(/metre(s)?/g,'m');
  s = s.replace(/metre/gi,'m');
  s = s.replace(/meter(s)?/g,'m');
  s = s.replace(/meters?/g,'m');
  s = s.replace(/\s+/g,' ').trim();
  // compress spaces
  s = s.replace(/\s/g,'');
  return s;
}

function buildCanonicalMap(){
  const map = new Map();
  Object.keys(canonical).forEach(cat => {
    canonical[cat].forEach(name => {
      const key = normalizeKey(name);
      map.set(key, { name, category: cat });
      // Also add a few variants: with/without "relay" suffix removed, with 'm' expansion
      const alt = key.replace(/metres|metre/g,'m');
      if(!map.has(alt)) map.set(alt, { name, category: cat });
      const alt2 = key.replace(/ /g,'');
      if(!map.has(alt2)) map.set(alt2, { name, category: cat });
    });
  });
  return map;
}

async function run(){
  try{
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams', { useNewUrlParser:true, useUnifiedTopology:true });
    console.log('Connected');

    const canonMap = buildCanonicalMap();

    const events = await Event.find({}).lean();
    console.log('Loaded', events.length, 'events');

    // Group by canonical key + gender
    const groups = new Map();
    for(const e of events){
      const key = normalizeKey(e.name);
      let canon = canonMap.get(key);
      if(!canon){
        // try replacements: numbers + m -> metres
        const try1 = key.replace(/(\d+)m(?![a-z])/g,'$1m');
        canon = canonMap.get(try1);
      }
      const canonName = canon ? canon.name : e.name;
      const groupKey = `${canonName}||${e.gender}`;
      if(!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(e);
    }

    const merged = [];
    for(const [groupKey, list] of groups.entries()){
      if(list.length <= 1) continue;
      // Choose primary: prefer one with exact canonical name (case-insensitive)
      const [canonName, gender] = groupKey.split('||');
      let primary = list.find(x => x.name.toLowerCase() === canonName.toLowerCase());
      if(!primary) {
        // choose earliest createdAt
        primary = list.reduce((a,b)=> (new Date(a.createdAt || 0) < new Date(b.createdAt || 0) ? a : b));
      }
      const duplicates = list.filter(x => x._id.toString() !== primary._id.toString());
      console.log(`Merging ${duplicates.length} duplicates into primary ${primary.name} (${primary._id})`);

      // Update references in Result and Athlete
      for(const dup of duplicates){
        try{
          await Result.updateMany({ event: dup._id }, { $set: { event: primary._id } });
          await Athlete.updateMany({ event1: dup._id }, { $set: { event1: primary._id } });
          await Athlete.updateMany({ event2: dup._id }, { $set: { event2: primary._id } });
          await Athlete.updateMany({ relay1: dup._id }, { $set: { relay1: primary._id } });
          await Athlete.updateMany({ relay2: dup._id }, { $set: { relay2: primary._id } });
          await Athlete.updateMany({ mixedRelay: dup._id }, { $set: { mixedRelay: primary._id } });
          await Event.updateMany({ _id: dup._id }, { $set: { mergedInto: primary._id } });
          // delete duplicate
          await Event.deleteOne({ _id: dup._id });
          merged.push({ from: dup._id, to: primary._id, name: dup.name });
          console.log(`  -> Merged ${dup.name} (${dup._id}) into ${primary._id}`);
        }catch(err){
          console.error('Error merging', dup._id, err.message);
        }
      }
      // Ensure primary has canonical name
      if(primary.name !== canonName){
        await Event.updateOne({ _id: primary._id }, { $set: { name: canonName } });
        console.log(`  -> Renamed primary ${primary._id} -> ${canonName}`);
      }
    }

    console.log('Merge complete. Writing report.');
    const fs = await import('fs');
    fs.writeFileSync('merge_events_report.json', JSON.stringify({ merged }, null, 2));
    console.log('Wrote merge_events_report.json');
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
}

run();
