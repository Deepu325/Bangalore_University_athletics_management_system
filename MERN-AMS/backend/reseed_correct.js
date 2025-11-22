ort mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './models/Event.js';
import Athlete from './models/Athlete.js';
import College from './models/College.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';

async function reseedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Fetch all existing events and athletes
    const events = await Event.find().lean();
    const colleges = await College.find().lean();
    const athletes = await Athlete.find().lean();

    console.log(`Found ${athletes.length} athletes to fix`);

    if (athletes.length === 0) {
      console.log('No athletes to fix. Exiting.');
      process.exit(0);
    }

    // Fix each athlete - convert string event IDs to ObjectIds
    let fixed = 0;
    for (const athlete of athletes) {
      const update = { $set: {} };
      let hasChanges = false;

      // Fix each event field
      const eventFields = ['event1', 'event2', 'relay1', 'relay2', 'mixedRelay'];
      
      for (const field of eventFields) {
        const currentValue = athlete[field];
        
        if (currentValue) {
          // Check if it's already an ObjectId or valid string
          if (typeof currentValue === 'string') {
            try {
              // Try to parse it as a valid ObjectId string
              const objId = new mongoose.Types.ObjectId(currentValue);
              update.$set[field] = objId;
              hasChanges = true;
            } catch (e) {
              // Not a valid ObjectId, set to null
              update.$set[field] = null;
              hasChanges = true;
            }
          }
        }
      }

      if (hasChanges) {
        await Athlete.updateOne({ _id: athlete._id }, update);
        fixed++;
      }
    }

    console.log(`✓ Fixed ${fixed} athletes - converted string event IDs to ObjectIds`);

    // Verify the fix
    const sample = await Athlete.findOne().lean();
    if (sample) {
      console.log('\nSample athlete after fix:');
      console.log(`  Name: ${sample.name}`);
      console.log(`  event1 type: ${typeof sample.event1}`);
      console.log(`  event1 value: ${sample.event1}`);
    }

    console.log('\n✓ RESEED COMPLETE!');
    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

reseedDatabase();
