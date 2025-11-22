/**
 * seed_realistic_with_real_event_ids.js
 *
 * - Inserts 100 colleges + 100 PED users + 600 athletes into MongoDB
 * - Links athletes to REAL Event._id values found in the Event collection
 * - Enforces:
 *    * chestNo global starting at 1001
 *    * max 2 athletes per event per college
 *    * max 1 relay team per relay event per college
 *    * mixed relay exactly 2M + 2F
 *
 * IMPORTANT: This is CommonJS (requires) compatible with the script runner.
 * Your models use ES6 export, so we convert them here.
 *
 * Usage:
 * 1) Put this file in backend root
 * 2) npm i mongoose bcryptjs dotenv
 * 3) Ensure Event collection is populated with your events
 * 4) MONGO_URI set in .env or hardcoded below
 * 5) node seed_realistic_with_real_event_ids.js
 *
 * WARNING: This script PERFORMS DB WRITES. BACK UP your DB if needed.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/buams";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// ========================================
// MODEL DEFINITIONS (CommonJS)
// ========================================

const collegeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  pedName: {
    type: String,
    required: true,
    trim: true
  },
  pedPhone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{6,15}$/, 'PED phone must be numeric (6-15 digits)']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

collegeSchema.index({ code: 1 }, { unique: true });
collegeSchema.index({ name: 1 }, { unique: true });

const College = mongoose.model('College', collegeSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'ped', 'official'],
    required: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true, unique: true });

const User = mongoose.model('User', userSchema);

// Athlete Schema
const athleteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  uucms: {
    type: String
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  chestNo: {
    type: String
  },
  event1: {
    type: String
  },
  event2: {
    type: String
  },
  relay1: {
    type: String
  },
  relay2: {
    type: String
  },
  mixedRelay: {
    type: String
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'],
    default: 'PRESENT'
  },
  remarks: {
    type: String
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['track', 'field', 'jump', 'throw', 'relay', 'combined']
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete'
  }],
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    default: 'Upcoming'
  },
  date: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);

// ========================================
// DATA GENERATION
// ========================================

const maleFirst = ["Rohit","Arjun","Manoj","Sidharth","Vikram","Karthik","Deepu","Ramesh","Suresh","Naveen","Rahul","Amit","Kunal","Pradeep","Anand","Kiran","Abhishek","Rajan","Rakesh","Aditya","Vijay","Harish","Praveen","Gautam","Sahil"];
const femaleFirst = ["Sanjana","Kavya","Pooja","Ananya","Divya","Priya","Sowmya","Lakshmi","Nithya","Anjali","Meera","Sneha","Keerthi","Asha","Harini","Nisha","Maya","Kavitha","Bindu","Archana","Shreya","Ritika","Isha","Nandini"];
const lastNames = ["Kumar","Reddy","Shetty","Sharma","Patil","Singh","Nair","Gupta","Das","Bhat","Chowdary","Naik","Iyer","Rao","Prasad","Murthy","Desai","Varma","Joshi","Menon"];

const collegeNames = [
  "Soundarya Institute of Technology",
  "Sree Vidyanikethan College",
  "Srinivas College Bangalore",
  "Bangalore City College",
  "Soundarya Degree College",
  "Simpson Institute of Science",
  "Sri Krishna Institute of Science",
  "Government First Grade College, Bangalore",
  "Vijaya College Bangalore",
  "NMKRV College",
  "MES College Bangalore",
  "St. Joseph's College of Commerce",
  "Ramaiah Institute of Technology",
  "Brindavan College of Arts & Science",
  "BMS College",
  "PES College Bangalore",
  "Acharya Institute of Technology",
  "Jain University College",
  "Reva University College",
  "Dayananda Sagar College",
  "MVJ College Bangalore",
  "KLE Society College",
  "NITTE College Bangalore",
  "Yenepoya College",
  "Jyothi Nivas College",
  "Oxford College Bangalore",
  "Christ College Bangalore",
  "St. Claret College",
  "Government Women's College",
  "GFGC Kengeri",
  "GFGC Jayanagar",
  "GFGC Rajajinagar",
  "Government College Hebbal",
  "Seshadripuram College",
  "VVN College of Engineering",
  "Krishna Rajendra College",
  "Siddaganga Institute",
  "RV College of Engineering",
  "Maharani's College",
  "Indian Academy Degree College",
  "National College Bangalore",
  "Surana College Bangalore",
  "Kuvempu College",
  "St. Aloysius College",
  "Bhavan's College Bangalore",
  "Dayananda Sagar College Arts",
  "City College Bangalore",
  "Sheshadripuram First Grade College",
  "Government Arts College",
  "St. Mary's College Bangalore",
  "Bharatiya Vidya Bhavan College",
  "Karnataka College Bangalore",
  "Sahyadri College Bangalore",
  "Basaveshwar College",
  "Sai College of Arts & Science",
  "Sri Venkateshwara College Bangalore",
  "Srinidhi College Bangalore",
  "RNS Institute of Technology",
  "Janapriya College",
  "Hindu College Bangalore",
  "Acharya Pre University College",
  "Sri Chaitanya College",
  "City Central College",
  "Vivekananda First Grade",
  "Lakshmi College",
  "Bharathi Women's College",
  "National PU College",
  "Modern Science College",
  "Prestige College of Arts",
  "East Bangalore College",
  "Westside Degree College",
  "North Gate College",
  "South Campus College",
  "Metropolitan College",
  "Riverdale College",
  "Greenfield College",
  "Highland College",
  "Sunrise College",
  "Cambridge College Bangalore",
  "Stella Mary College",
  "Lotus Arts College",
  "Aurora Degree College",
  "Horizon Institute",
  "Bright Future College",
  "Crescent College",
  "Unity College Bangalore",
  "Heritage College",
  "Royal City College",
  "Pioneer College",
  "Galaxy College",
  "Cornerstone College",
  "Civic College Bangalore",
  "Trust College"
];

// Expected events - mapped by name and category+gender combo
const expectedEvents = [
  // men's track
  { name: "100m", category: "track", gender: "Male", id: null },
  { name: "200m", category: "track", gender: "Male", id: null },
  { name: "400m", category: "track", gender: "Male", id: null },
  { name: "800m", category: "track", gender: "Male", id: null },
  { name: "1500m", category: "track", gender: "Male", id: null },
  { name: "110m Hurdles", category: "track", gender: "Male", id: null },

  // men's field - jump
  { name: "Long Jump", category: "jump", gender: "Male", id: null },
  { name: "High Jump", category: "jump", gender: "Male", id: null },
  { name: "Pole Vault", category: "jump", gender: "Male", id: null },

  // men's field - throw
  { name: "Shot Put", category: "throw", gender: "Male", id: null },
  { name: "Discus Throw", category: "throw", gender: "Male", id: null },
  { name: "Javelin Throw", category: "throw", gender: "Male", id: null },

  // men's relays
  { name: "4x100m Relay", category: "relay", gender: "Male", id: null },
  { name: "4x400m Relay", category: "relay", gender: "Male", id: null },

  // women's track
  { name: "100m", category: "track", gender: "Female", id: null },
  { name: "200m", category: "track", gender: "Female", id: null },
  { name: "400m", category: "track", gender: "Female", id: null },
  { name: "800m", category: "track", gender: "Female", id: null },
  { name: "1500m", category: "track", gender: "Female", id: null },
  { name: "100m Hurdles", category: "track", gender: "Female", id: null },

  // women's field - jump
  { name: "Long Jump", category: "jump", gender: "Female", id: null },
  { name: "High Jump", category: "jump", gender: "Female", id: null },
  { name: "Pole Vault", category: "jump", gender: "Female", id: null },

  // women's field - throw
  { name: "Shot Put", category: "throw", gender: "Female", id: null },
  { name: "Discus Throw", category: "throw", gender: "Female", id: null },
  { name: "Javelin Throw", category: "throw", gender: "Female", id: null },

  // women's relays
  { name: "4x100m Relay", category: "relay", gender: "Female", id: null },
  { name: "4x400m Relay", category: "relay", gender: "Female", id: null },

  // mixed relay
  { name: "4x400m Mixed Relay", category: "relay", gender: "Female", id: null }
];

function pickName(gender) {
  const first = (gender === "Male")
    ? maleFirst[Math.floor(Math.random() * maleFirst.length)]
    : femaleFirst[Math.floor(Math.random() * femaleFirst.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function sanitizeUsername(name) {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

function randomPhone() {
  const start = ["9","8","7"][Math.floor(Math.random()*3)];
  let num = start;
  for (let i=0;i<9;i++) num += Math.floor(Math.random()*10);
  return num;
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✓ Connected to MongoDB:", MONGO_URI);

    // ========================================
    // 1) Fetch events and build a map
    // ========================================
    const allEvents = await Event.find({}).lean();
    console.log(`\n✓ Found ${allEvents.length} Event documents in DB.`);

    // Map events by (name + gender + category) for lookup
    const eventMap = {}; // key: "100m_Male_track", value: event._id

    allEvents.forEach(ev => {
      const key = `${ev.name}_${ev.gender}_${ev.category}`;
      eventMap[key] = String(ev._id);
    });

    // Check we have required events
    const missing = [];
    expectedEvents.forEach(exp => {
      const key = `${exp.name}_${exp.gender}_${exp.category}`;
      if (!eventMap[key]) {
        missing.push(exp);
      } else {
        exp.id = eventMap[key];
      }
    });

    if (missing.length > 0) {
      console.error("\n❌ Missing required events in Event collection. Please create these events first:");
      missing.forEach(m => console.error(`   - ${m.name} (${m.gender}, ${m.category})`));
      console.error("\n   Script exiting. Create the missing Event documents and run this script again.");
      process.exit(2);
    }

    console.log("✓ All required events found and mapped.\n");

    // ========================================
    // 2) Create 100 colleges + PED users
    // ========================================
    console.log("Creating colleges and PED users...");
    const collegesToInsert = [];
    for (let i = 0; i < 100; i++) {
      const name = collegeNames[i] || `Regional College ${i+1}`;
      const code = `CLG${String(i+1).padStart(3,"0")}`;
      const pedName = (Math.random() > 0.5) ? pickName("Male") : pickName("Female");
      const pedPhone = randomPhone();
      collegesToInsert.push({ name, code, pedName, pedPhone });
    }

    const insertedColleges = [];
    for (const c of collegesToInsert) {
      let existing = await College.findOne({ name: c.name });
      if (existing) {
        insertedColleges.push(existing);
        continue;
      }

      const newCollege = await College.create({
        name: c.name,
        code: c.code,
        pedName: c.pedName,
        pedPhone: c.pedPhone
      });

      // Create PED user for this college
      const usernameBase = sanitizeUsername(c.pedName || c.name);
      let username = usernameBase;
      let suffix = 0;
      while (await User.findOne({ username })) {
        suffix++;
        username = `${usernameBase}${suffix}`;
      }

      const hashed = await bcrypt.hash(String(c.pedPhone), BCRYPT_SALT_ROUNDS);

      await User.create({
        username,
        password: hashed,
        role: "ped",
        mustChangePassword: true,
        collegeId: newCollege._id
      });

      insertedColleges.push(newCollege);
    }

    console.log(`✓ Created ${insertedColleges.length} colleges with PED users.\n`);

    // ========================================
    // 3) Create 600 athletes with realistic distributions
    // ========================================
    console.log("Creating 600 athletes with event registrations...");

    // Randomly pick 25 "large" colleges (12 athletes each), rest get 4
    const allIdx = Array.from({length: insertedColleges.length}, (_,i)=>i);
    const shuffled = allIdx.sort(()=>0.5 - Math.random());
    const largeIdx = new Set(shuffled.slice(0,25));

    let chestNo = 1001;
    const athletesBuffer = [];

    for (let idx = 0; idx < insertedColleges.length; idx++) {
      const college = insertedColleges[idx];
      const isLarge = largeIdx.has(idx);
      const targetCount = isLarge ? 12 : 4;
      const maleCount = Math.round(targetCount * 0.5);
      const femaleCount = targetCount - maleCount;

      // Track event counters for this college to enforce max 2
      const eventCount = {}; // map eventId -> count

      function pickEventForGender(gender) {
        // Build pool of event IDs for this gender
        const pool = expectedEvents
          .filter(e => e.gender === gender && e.id)
          .map(e => e.id)
          .sort(()=>0.5 - Math.random());

        for (const evId of pool) {
          if (!eventCount[evId]) eventCount[evId] = 0;
          if (eventCount[evId] < 2) {
            eventCount[evId]++;
            return evId;
          }
        }
        return null;
      }

      // Create male athletes
      for (let m = 0; m < maleCount; m++) {
        const name = pickName("Male");
        const e1 = pickEventForGender("Male");
        const e2 = Math.random() < 0.5 ? pickEventForGender("Male") : null;
        const event1 = e1;
        const event2 = (e2 && e2 !== e1) ? e2 : null;

        athletesBuffer.push({
          name,
          chestNo: String(chestNo++),
          college: college._id,
          gender: "Male",
          event1,
          event2,
          relay1: null,
          relay2: null,
          mixedRelay: null,
          uucms: "",
          status: "PRESENT"
        });
      }

      // Create female athletes
      for (let f = 0; f < femaleCount; f++) {
        const name = pickName("Female");
        const e1 = pickEventForGender("Female");
        const e2 = Math.random() < 0.5 ? pickEventForGender("Female") : null;
        const event1 = e1;
        const event2 = (e2 && e2 !== e1) ? e2 : null;

        athletesBuffer.push({
          name,
          chestNo: String(chestNo++),
          college: college._id,
          gender: "Female",
          event1,
          event2,
          relay1: null,
          relay2: null,
          mixedRelay: null,
          uucms: "",
          status: "PRESENT"
        });
      }

      // For large colleges: create mixed relay (2M + 2F)
      if (isLarge) {
        const mixedEvent = expectedEvents.find(e => e.name === "4x400m Mixed Relay");
        if (mixedEvent && mixedEvent.id) {
          const start = athletesBuffer.length - targetCount;
          const colSlice = athletesBuffer.slice(start);
          const males = colSlice.filter(a => a.gender === "Male" && !a.mixedRelay).slice(0,2);
          const females = colSlice.filter(a => a.gender === "Female" && !a.mixedRelay).slice(0,2);

          if (males.length === 2 && females.length === 2) {
            [...males, ...females].forEach(a => {
              a.mixedRelay = mixedEvent.id;
            });
          }
        }
      }

      // For large colleges: assign relay teams
      if (isLarge) {
        const start = athletesBuffer.length - targetCount;

        // Men's 4x100m - assign 4 males
        const menRelay = expectedEvents.find(e => e.name === "4x100m Relay" && e.gender === "Male");
        if (menRelay && menRelay.id) {
          let assigned = 0;
          for (let i = start; i < start + targetCount && assigned < 4; i++) {
            const a = athletesBuffer[i];
            if (a && a.gender === "Male" && !a.relay1) {
              a.relay1 = menRelay.id;
              assigned++;
            }
          }
        }

        // Women's 4x400m - assign 4 females
        const womenRelay = expectedEvents.find(e => e.name === "4x400m Relay" && e.gender === "Female");
        if (womenRelay && womenRelay.id) {
          let assigned = 0;
          for (let i = start; i < start + targetCount && assigned < 4; i++) {
            const a = athletesBuffer[i];
            if (a && a.gender === "Female" && !a.relay1) {
              a.relay1 = womenRelay.id;
              assigned++;
            }
          }
        }
      }
    }

    console.log(`✓ Prepared ${athletesBuffer.length} athletes.\n`);

    // ========================================
    // 4) Insert athletes into DB in chunks
    // ========================================
    console.log("Inserting athletes into database...");
    const chunkSize = 200;
    for (let i = 0; i < athletesBuffer.length; i += chunkSize) {
      const chunk = athletesBuffer.slice(i, i + chunkSize);
      await Athlete.insertMany(chunk);
      console.log(`  ✓ Inserted athletes ${i} - ${i + chunk.length}`);
    }

    // ========================================
    // 5) Summary
    // ========================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ SEEDING COMPLETE");
    console.log("=".repeat(60));
    console.log(`Colleges created: ${insertedColleges.length}`);
    console.log(`PED users created: ~${insertedColleges.length}`);
    console.log(`Athletes created: ${athletesBuffer.length}`);
    console.log(`Chest numbers used: 1001 - ${chestNo - 1}`);
    console.log(`Events mapped: ${expectedEvents.filter(e => e.id).length}/${expectedEvents.length}`);
    console.log("\nNext steps:");
    console.log("1. Verify in MongoDB:");
    console.log("   db.colleges.countDocuments()");
    console.log("   db.users.find({ role: 'ped' }).countDocuments()");
    console.log("   db.athletes.countDocuments()");
    console.log("2. Check sample athlete: db.athletes.findOne({}).pretty()");
    console.log("3. Verify event IDs are stored in event1/event2/relay1 fields");
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

main();
