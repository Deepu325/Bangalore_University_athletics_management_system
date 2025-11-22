import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Schemas
const athleteSchema = new mongoose.Schema({
  name: String,
  gender: String,
  chestNo: String,
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  event1: String,
  event2: String,
  relay1: String,
  relay2: String,
  mixedRelay: String,
  status: { type: String, default: 'PRESENT' },
  remarks: String,
  registrationDate: { type: Date, default: Date.now }
});

const collegeSchema = new mongoose.Schema({
  code: String,
  name: String,
  location: String,
  contact: String,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  phone: String,
  role: String,
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  createdAt: { type: Date, default: Date.now }
});

const Athlete = mongoose.model('Athlete', athleteSchema);
const College = mongoose.model('College', collegeSchema);
const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', new mongoose.Schema({ name: String, gender: String, category: String }));

// Sample data
const maleNames = [
  'Aarav', 'Arjun', 'Aditya', 'Vikram', 'Rohan', 'Karan', 'Nikhil', 'Rahul', 'Sanjay', 'Devendra',
  'Harshit', 'Ashok', 'Sameer', 'Pradeep', 'Naveen', 'Suresh', 'Rajesh', 'Manoj', 'Vinay', 'Gaurav'
];

const femaleNames = [
  'Anjali', 'Priya', 'Neha', 'Shreya', 'Richa', 'Pooja', 'Divya', 'Swati', 'Kavya', 'Nisha',
  'Isha', 'Disha', 'Megha', 'Riya', 'Sneha', 'Tina', 'Usha', 'Vimala', 'Yuki', 'Zara'
];

const lastNames = [
  'Sharma', 'Singh', 'Patel', 'Kumar', 'Khan', 'Gupta', 'Desai', 'Iyer', 'Nair', 'Rao',
  'Bhat', 'Reddy', 'Pillai', 'Verma', 'Thakur', 'Chopra', 'Joshi', 'Bhatt', 'Mishra', 'Saxena'
];

const collegeNames = [
  'Delhi University', 'Mumbai University', 'Punjab University', 'Gujarat University', 'Karnataka University',
  'Tamil Nadu University', 'Andhra University', 'Uttar Pradesh Institute', 'West Bengal College', 'Bihar Institute',
  'Rajasthan College', 'Madhya Pradesh University', 'Haryana College', 'Himachal Institute', 'Jammu University',
  'Kerala University', 'Maharashtra Institute', 'Odisha College', 'Telangana University', 'Assam Institute',
  'Arunachal College', 'Manipur University', 'Meghalaya Institute', 'Mizoram University', 'Nagaland College',
  'Sikkim Institute', 'Tripura University', 'Uttarakhand College', 'Chhattisgarh Institute', 'Jharkhand University'
];

function pickName(gender) {
  const firstNames = gender === 'Male' ? maleNames : femaleNames;
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await Athlete.deleteMany({});
    await College.deleteMany({});
    await User.deleteMany({});
    console.log('✓ Cleared existing data');

    // Get all events
    const events = await Event.find({});
    if (events.length === 0) {
      console.error('✗ No events found. Please create events first.');
      process.exit(1);
    }
    console.log(`✓ Found ${events.length} events`);

    // Create colleges
    const colleges = [];
    const usedNames = new Set();
    
    for (let i = 1; i <= 20; i++) {
      let collegeName;
      do {
        collegeName = collegeNames[Math.floor(Math.random() * collegeNames.length)] + ` (${i})`;
      } while (usedNames.has(collegeName));
      
      usedNames.add(collegeName);
      
      const college = new College({
        code: `CLG${String(i).padStart(3, '0')}`,
        name: collegeName,
        location: `City ${i}`,
        contact: `+91${String(Math.floor(Math.random() * 9000000000) + 1000000000).slice(0, 10)}`
      });
      colleges.push(await college.save());
    }
    console.log(`✓ Created ${colleges.length} colleges`);

    // Create PED users for each college
    for (const college of colleges) {
      const hashedPassword = await bcryptjs.hash(college.code, 10);
      const user = new User({
        username: `ped${college.code}`.toLowerCase(),
        email: `ped${college.code}@bu.edu`,
        password: hashedPassword,
        phone: `91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        role: 'ped',
        collegeId: college._id
      });
      await user.save();
    }
    console.log(`✓ Created ${colleges.length} PED users`);

    // Create athletes
    let chestNo = 1001;
    let athleteCount = 0;
    
    for (const college of colleges) {
      const numAthletes = Math.random() > 0.6 ? 12 : 4; // 40% get 12 athletes, 60% get 4
      
      for (let a = 0; a < numAthletes; a++) {
        const gender = Math.random() > 0.5 ? 'Male' : 'Female';
        
        // Pick random events for this athlete
        const collegeEvents = events.filter(e => e.gender === gender);
        const shuffled = collegeEvents.sort(() => Math.random() - 0.5);
        
        const athlete = new Athlete({
          name: pickName(gender),
          gender,
          chestNo: String(chestNo++),
          college: college._id,
          event1: shuffled[0]?._id.toString() || null,
          event2: shuffled[1]?._id.toString() || null,
          relay1: shuffled[2]?._id.toString() || null,
          status: 'PRESENT'
        });
        
        await athlete.save();
        athleteCount++;
      }
    }
    console.log(`✓ Created ${athleteCount} athletes with chest numbers 1001-${chestNo - 1}`);

    // Verify
    const athleteCount2 = await Athlete.countDocuments();
    const collegeCount = await College.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('\n✓ SEEDING COMPLETE!');
    console.log(`  - Athletes: ${athleteCount2}`);
    console.log(`  - Colleges: ${collegeCount}`);
    console.log(`  - PED Users: ${userCount}`);
    console.log(`  - Events: ${events.length}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
