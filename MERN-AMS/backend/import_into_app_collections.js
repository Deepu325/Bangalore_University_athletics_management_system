import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bu-ams';
const TEST_DATA_DIR = process.env.TEST_DATA_DIR || 'D:/PED project/AMS-BU/test data';

import College from './models/College.js';
import Event from './models/Event.js';
import Athlete from './models/Athlete.js';

function normalize(s){ return (s||'').toString().trim().toLowerCase().replace(/\s+/g,' '); }

async function readJson(name){ return JSON.parse(await fs.readFile(path.join(TEST_DATA_DIR,name),'utf8')); }

function mapCategory(key){
  const k = key.toLowerCase();
  if (k.includes('track')) return 'track';
  if (k.includes('jump') || k.includes('jumping')) return 'jump';
  if (k.includes('throw')) return 'throw';
  if (k.includes('relay')) return 'relay';
  if (k.includes('combined')) return 'combined';
  return 'track';
}

function mapGenderTag(tag){
  const t = (tag||'').toString().toLowerCase();
  if (t.includes('men') || t === 'male' || t === 'm') return 'Male';
  if (t.includes('women') || t === 'female' || t === 'f') return 'Female';
  return 'Male';
}

async function main(){
  console.log('Connecting to', MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true });
  console.log('Connected');

  // Read test data
  const collegesList = await readJson('test_colleges.json');
  const eventsRaw = await readJson('test_events.json');
  const athletesList = await readJson('athlete_list.json');

  // WARNING: This will clear existing app collections. Proceeding to replace data so frontend shows test data.
  console.log('Clearing existing collections: colleges, events, athletes');
  await College.deleteMany({});
  await Event.deleteMany({});
  await Athlete.deleteMany({});

  // Insert colleges
  console.log('Importing colleges...');
  const collegeDocs = [];
  for (let i=0;i<collegesList.length;i++){
    const name = String(collegesList[i]).trim();
    const code = `CLG${String(i+1).padStart(3,'0')}`;
    const pedName = `PED ${code}`;
    const pedPhone = String(9000000000 + i).slice(0,10);
    const c = new College({ code, name, pedName, pedPhone });
    collegeDocs.push(await c.save());
  }
  const collegeMap = new Map(collegeDocs.map(c=>[normalize(c.name), c]));

  // Insert events
  console.log('Importing events...');
  const events = [];
  const categories = eventsRaw.categories || {};
  for (const [k,v] of Object.entries(categories)){
    if (Array.isArray(v)){
      for (const ev of v){
        // create both Male and Female variant to allow athlete mapping
        const name = String(ev).trim();
        const cat = mapCategory(k);
        const e1 = new Event({ name, category: cat, gender: 'Male' });
        const e2 = new Event({ name, category: cat, gender: 'Female' });
        events.push(await e1.save());
        events.push(await e2.save());
      }
    } else if (typeof v === 'object'){
      for (const [gname, ename] of Object.entries(v)){
        const gender = mapGenderTag(gname);
        const name = String(ename).trim();
        const cat = mapCategory(k);
        const e = new Event({ name, category: cat, gender });
        events.push(await e.save());
      }
    }
  }
  const eventMap = new Map(events.map(e=>[normalize(e.name)+'|'+e.gender.toLowerCase(), e]));

  // Insert athletes
  console.log('Importing athletes...');
  let count=0;
  for (const a of athletesList){
    const collegeName = a.college || '';
    const cdoc = collegeMap.get(normalize(collegeName));
    if (!cdoc) continue; // skip if college not found

    let gender = 'Male';
    if ((a.gender||'').toString().toLowerCase().startsWith('w') || (a.gender||'').toString().toLowerCase().includes('women')) gender='Female';

    const indiv = (a.events && a.events.individual) || [];
    const ev1raw = indiv[0] || null;
    const ev2raw = indiv[1] || null;

    const lookup = (raw, gender) => {
      if (!raw) return null;
      const key = normalize(String(raw))+'|'+gender.toLowerCase();
      if (eventMap.has(key)) return eventMap.get(key)._id;
      // try without gender
      for (const [k,v] of eventMap.entries()){
        if (k.startsWith(normalize(String(raw))+'|')) return v._id;
      }
      return null;
    };

    const ev1 = lookup(ev1raw, gender);
    const ev2 = lookup(ev2raw, gender);

    const athlete = new Athlete({
      name: a.name || 'Unknown',
      uucms: a.uucms || '',
      college: cdoc._id,
      gender: gender,
      chestNo: a.chestNo || '',
      event1: ev1,
      event2: ev2
    });
    await athlete.save();
    count++;
  }

  console.log(`✓ Imported ${collegeDocs.length} colleges, ${events.length} events, ${count} athletes into app collections`);
  process.exit(0);
}

main().catch(err=>{ console.error(err); process.exit(1); });
