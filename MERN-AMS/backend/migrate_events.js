import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const athleteSchema = new mongoose.Schema({
  name: String,
  gender: String,
  chestNo: String,
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  event1: mongoose.Schema.Types.ObjectId,
  event2: mongoose.Schema.Types.ObjectId,
  relay1: mongoose.Schema.Types.ObjectId,
  relay2: mongoose.Schema.Types.ObjectId,
  mixedRelay: mongoose.Schema.Types.ObjectId,
  status: String,
  remarks: String,
  registrationDate: { type: Date, default: Date.now }
}, { collection: 'athletes' });

const Athlete = mongoose.model('Athlete', athleteSchema);

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Get all athletes
    const athletes = await Athlete.find({});
    console.log(`✓ Found ${athletes.length} athletes`);

    let updated = 0;

    for (const athlete of athletes) {
      let changed = false;

      // Convert string event IDs to ObjectIds if they're valid ObjectId strings
      if (athlete.event1 && typeof athlete.event1 === 'string') {
        try {
          athlete.event1 = new mongoose.Types.ObjectId(athlete.event1);
          changed = true;
        } catch (e) {
          athlete.event1 = null;
          changed = true;
        }
      }

      if (athlete.event2 && typeof athlete.event2 === 'string') {
        try {
          athlete.event2 = new mongoose.Types.ObjectId(athlete.event2);
          changed = true;
        } catch (e) {
          athlete.event2 = null;
          changed = true;
        }
      }

      if (athlete.relay1 && typeof athlete.relay1 === 'string') {
        try {
          athlete.relay1 = new mongoose.Types.ObjectId(athlete.relay1);
          changed = true;
        } catch (e) {
          athlete.relay1 = null;
          changed = true;
        }
      }

      if (athlete.relay2 && typeof athlete.relay2 === 'string') {
        try {
          athlete.relay2 = new mongoose.Types.ObjectId(athlete.relay2);
          changed = true;
        } catch (e) {
          athlete.relay2 = null;
          changed = true;
        }
      }

      if (athlete.mixedRelay && typeof athlete.mixedRelay === 'string') {
        try {
          athlete.mixedRelay = new mongoose.Types.ObjectId(athlete.mixedRelay);
          changed = true;
        } catch (e) {
          athlete.mixedRelay = null;
          changed = true;
        }
      }

      if (changed) {
        await athlete.save();
        updated++;
        if (updated % 20 === 0) console.log(`  Updated ${updated}/${athletes.length}`);
      }
    }

    console.log(`✓ Migration complete! Updated ${updated} athletes`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration error:', error.message);
    process.exit(1);
  }
}

migrate();
