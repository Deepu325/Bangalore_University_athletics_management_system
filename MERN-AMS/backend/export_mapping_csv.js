import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const EventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model('Event', EventSchema);

async function run(){
  try{
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
    await mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology:true });
    console.log('Connected to MongoDB at', uri);

    const reportPath = 'merge_events_report.json';
    if(!fs.existsSync(reportPath)){
      console.error('merge_events_report.json not found. Did you run the merge script?');
      process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const rows = [];
    rows.push(['Old Name','Old ID','Canonical Name','Canonical ID'].join('\t'));

    for(const entry of report.merged || []){
      const oldId = entry.from;
      const oldName = entry.name || '';
      const canonicalId = entry.to;
      let canonicalName = '';
      try{
        const ev = await Event.findById(canonicalId).lean();
        canonicalName = ev?.name || '';
      }catch(err){
        canonicalName = '';
      }
      rows.push([oldName, oldId, canonicalName, canonicalId].join('\t'));
    }

    const out = rows.join('\n');
    fs.writeFileSync('event_merge_mapping.tsv', out, 'utf8');
    console.log('Wrote event_merge_mapping.tsv');

    process.exit(0);
  }catch(err){
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

run();
