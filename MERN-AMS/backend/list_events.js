import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const eventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model('Event', eventSchema);

// Canonical list used for verification
const canonical = [
  '100 Metres','200 Metres','400 Metres','800 Metres','1500 Metres','5000 Metres','10,000 Metres',
  '110 Metres Hurdles','100 Metres Hurdles','400 Metres Hurdles','20 km Walk','3000 Metres Steeple Chase','Half Marathon',
  'High Jump','Long Jump','Pole Vault','Triple Jump',
  'Discus Throw','Hammer Throw','Javelin Throw','Shot Put',
  '4 × 100 Metres Relay','4 × 400 Metres Relay','4 × 400 Metres Mixed Relay',
  'Decathlon','Heptathlon'
];

function normalizeName(n){
  if(!n) return '';
  let s = n.toString().toLowerCase();
  s = s.replace(/×/g,'x');
  s = s.replace(/\u00A0/g,' ');
  s = s.replace(/[^a-z0-9 ]+/g,' ');
  s = s.replace(/metres|metre|meters|meter/ig,'m');
  s = s.replace(/\s+/g,' ').trim();
  return s;
}

async function run(){
  try{
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology:true });
    console.log('Connected to MongoDB at', uri);

    const events = await Event.find({}).lean();
    console.log(`Total events in DB: ${events.length}`);

    const byKey = new Map();
    for(const e of events){
      const key = `${normalizeName(e.name)}||${(e.gender||'').toString().toLowerCase()}`;
      if(!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(e);
    }

    const uniqueCombos = byKey.size;
    console.log(`Unique name+gender combinations: ${uniqueCombos}`);

    // Detect duplicates (groups with >1)
    const duplicates = [];
    for(const [k, list] of byKey.entries()){
      if(list.length > 1){
        duplicates.push({ key: k, count: list.length, items: list.map(x=>({ id: x._id, name: x.name, gender: x.gender })) });
      }
    }

    console.log(`Duplicate groups found: ${duplicates.length}`);
    if(duplicates.length > 0){
      console.log('Sample duplicate groups (up to 10):');
      duplicates.slice(0,10).forEach(g=>{
        console.log('---');
        console.log('Normalized key:', g.key, '| count:', g.count);
        g.items.forEach(it => console.log(`  - ${it.name} (${it.gender}) -> ${it.id}`));
      });
    }

    // Check canonical presence
    const normalizedCanonical = new Map();
    for(const c of canonical) normalizedCanonical.set(normalizeName(c), c);

    const missingCanonical = [];
    for(const [norm, canonName] of normalizedCanonical.entries()){
      // check both genders (Male & Female) existence
      const maleKey = `${norm}||male`;
      const femaleKey = `${norm}||female`;
      const hasMale = byKey.has(maleKey);
      const hasFemale = byKey.has(femaleKey);
      if(!hasMale && !hasFemale){
        missingCanonical.push({ canonical: canonName, male: hasMale, female: hasFemale });
      }
    }

    console.log(`Canonical names missing entirely (no male & no female): ${missingCanonical.length}`);
    if(missingCanonical.length > 0) missingCanonical.slice(0,20).forEach(m=> console.log(`  - ${m.canonical}`));

    // Check combined events gender correctness
    const combinedChecks = [];
    const decNorm = normalizeName('Decathlon');
    const hepNorm = normalizeName('Heptathlon');
    combinedChecks.push({ name: 'Decathlon', male: byKey.has(`${decNorm}||male`), female: byKey.has(`${decNorm}||female`) });
    combinedChecks.push({ name: 'Heptathlon', male: byKey.has(`${hepNorm}||male`), female: byKey.has(`${hepNorm}||female`) });
    console.log('Combined events presence:');
    combinedChecks.forEach(c => console.log(`  - ${c.name}: male=${c.male} female=${c.female}`));

    // Save report
    const report = {
      totalEvents: events.length,
      uniqueCombos,
      duplicateGroups: duplicates,
      missingCanonical,
      combinedChecks,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('event_verification_report.json', JSON.stringify(report, null, 2));
    console.log('Wrote event_verification_report.json');

    // Print short summary for user
    console.log('\nSummary:');
    console.log(`  - Total events: ${events.length}`);
    console.log(`  - Unique name+gender combos: ${uniqueCombos}`);
    console.log(`  - Duplicate groups: ${duplicates.length}`);
    console.log(`  - Canonical missing count: ${missingCanonical.length}`);
    console.log('Detailed report written to backend/event_verification_report.json');

    process.exit(0);
  }catch(err){
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

run();
