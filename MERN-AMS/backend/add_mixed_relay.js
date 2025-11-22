import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const eventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model('Event', eventSchema);

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

const canonicalMixed = [
  { name: '4 × 400 Metres Mixed Relay', gender: 'Mixed', category: 'relay' }
];

async function run(){
  try{
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology:true });
    console.log('Connected to MongoDB at', uri);

    const events = await Event.find({}).lean();

    for(const c of canonicalMixed){
      const norm = normalizeName(c.name);
      // Check if any event matches this normalized name with gender 'Mixed'
      const exists = events.some(e => normalizeName(e.name) === norm && (e.gender||'').toString().toLowerCase() === 'mixed');
      if(exists){
        console.log(`Exists: ${c.name} (Mixed)`);
        continue;
      }

      // If not exists, attempt to find any event with same normalized name (different gender)
      const alt = events.find(e => normalizeName(e.name) === norm);
      if(alt){
        console.log(`Found existing variant for ${c.name}: ${alt.name} (${alt.gender}). Creating Mixed copy.`);
        const doc = { name: c.name, gender: c.gender, category: c.category, status: alt.status || 'Upcoming' };
        const res = await Event.create(doc);
        console.log('Inserted Mixed event with id', res._id);
      } else {
        console.log(`No existing event with normalized name ${norm}. Creating new Mixed event.`);
        const doc = { name: c.name, gender: c.gender, category: c.category, status: 'Upcoming' };
        const res = await Event.create(doc);
        console.log('Inserted Mixed event with id', res._id);
      }
    }

    const count = await Event.countDocuments();
    console.log('Total events now:', count);
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
