# 🌱 BU-AMS Database Seeding - Complete Guide

## 📖 Overview

This guide walks you through populating your BU-AMS database with realistic production-ready test data:

- ✅ 100 colleges (CLG001 - CLG100)
- ✅ 100 PED users (one per college)
- ✅ 600 athletes (distributed across colleges)
- ✅ 29 athletics events (track, field, relay)
- ✅ Realistic event registrations (max 2 per event per college)
- ✅ Relay teams (max 1 per relay per college)
- ✅ Mixed relay teams (2M + 2F for large colleges)

**Result:** Your system can immediately show real data, generate event sheets, run through full scoring workflows, etc.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Backup Your Database ⚠️

```bash
# Create backup before running any seed script
mongodump --uri "mongodb://localhost:27017/buams" --out ./backup_$(date +%Y%m%d_%H%M%S)
```

### Step 2: Create Events (if they don't exist)

**Option A: Via MongoDB Shell (Fastest)**
```bash
mongosh  # or: mongo
```

Then paste the entire content from `EVENT_CREATION_SETUP.md`

**Option B: Via Node Script**
```bash
node create_events.js
```

See `EVENT_CREATION_SETUP.md` for both methods.

### Step 3: Verify Events Exist

```bash
mongosh
use buams
db.events.countDocuments()  # Should be 29
```

### Step 4: Install Dependencies

```bash
cd backend
npm install mongoose bcryptjs dotenv
```

### Step 5: Run Seeding Script

```bash
node seed_realistic_with_real_event_ids.js
```

**Expected output:**
```
✓ Connected to MongoDB
✓ Found 29 Event documents in DB.
✓ All required events found and mapped.
Creating colleges and PED users...
✓ Created 100 colleges with PED users.
Creating 600 athletes with event registrations...
✓ Prepared 600 athletes.
Inserting athletes into database...
  ✓ Inserted athletes 0 - 200
  ✓ Inserted athletes 200 - 400
  ✓ Inserted athletes 400 - 600

✅ SEEDING COMPLETE
```

---

## 📁 Files Included

| File | Purpose |
|------|---------|
| `seed_realistic_with_real_event_ids.js` | Main seeding script (600 athletes, 100 colleges) |
| `SEEDING_GUIDE.md` | Detailed seeding documentation |
| `EVENT_CREATION_SETUP.md` | How to create required events |
| `SEEDING_README.md` | This file |

---

## 📊 What Gets Created

### Colleges
```javascript
100 colleges with:
- Unique code: CLG001 through CLG100
- Unique name
- PED manager name (auto-generated)
- PED phone number (auto-generated)

Examples:
{
  code: "CLG001",
  name: "Soundarya Institute of Technology",
  pedName: "Rohit Kumar",
  pedPhone: "9876543210"
}
```

### PED Users
```javascript
100 users with:
- Username: sanitized from PED name (lowercase, underscores)
- Password: PED phone number (bcrypt hashed)
- Role: "ped"
- mustChangePassword: true (must change on first login)
- Linked to college

Examples:
username: rohit_kumar
password: 9876543210 (before hashing)
role: ped
mustChangePassword: true
```

### Athletes
```javascript
600 athletes with:
- Name: auto-generated (Indian names)
- Gender: ~50% Male, 50% Female
- Chest No: Global sequence 1001-1600
- College: linked to one of 100 colleges
- Event registrations (realistic):
  * event1: primary event (usually not null)
  * event2: secondary event (50% have)
  * relay1: relay team (25 large colleges only)
  * mixedRelay: mixed relay (25 large colleges only)
- Status: PRESENT

Example Male Athlete:
{
  name: "Arjun Reddy",
  chestNo: "1001",
  gender: "Male",
  college: ObjectId("..."),
  event1: "507f1f77bcf86cd799439011", // 100m event ID
  event2: "507f1f77bcf86cd799439012", // 200m event ID
  relay1: null,
  status: "PRESENT"
}

Example Female Athlete:
{
  name: "Sanjana Kumar",
  chestNo: "1002",
  gender: "Female",
  college: ObjectId("..."),
  event1: "507f1f77bcf86cd799439013", // Long Jump event ID
  event2: null,
  relay1: "507f1f77bcf86cd799439020", // 4x400m Relay ID
  mixedRelay: "507f1f77bcf86cd799439021", // Mixed Relay ID
  status: "PRESENT"
}
```

---

## 🎯 Data Distribution

### College Breakdown
- **25 Large Colleges**: 12 athletes each = 300 athletes
  - Have relay teams
  - Have mixed relay teams
- **75 Small Colleges**: 4 athletes each = 300 athletes
  - Individual athletes only

### Athlete Breakdown
- **~300 Male Athletes**
  - 50% assigned to track events
  - 30% assigned to field events
  - 20% in relay teams
- **~300 Female Athletes**
  - 50% assigned to track events
  - 30% assigned to field events
  - 20% in relay teams

### Event Registration Constraints
- **Max 2 athletes per event per college** (enforced)
- **Max 1 relay team per relay per college** (enforced)
- **Mixed relay exactly 2M + 2F** (for 25 large colleges)
- **Global chest numbers**: 1001-1600 (no duplicates)

---

## 🔍 Verification Queries

### Check Colleges Created
```javascript
db.colleges.countDocuments()                    // 100
db.colleges.find({ code: /CLG0[0-5]/ })        // First 50 colleges
db.colleges.findOne({ code: "CLG001" }).pretty()
```

### Check PED Users Created
```javascript
db.users.countDocuments({ role: "ped" })           // 100
db.users.find({ role: "ped" }).limit(5).pretty()  // First 5
```

### Check Athletes Created
```javascript
db.athletes.countDocuments()                          // 600
db.athletes.countDocuments({ gender: "Male" })       // ~300
db.athletes.countDocuments({ gender: "Female" })     // ~300
db.athletes.find({}).limit(1).pretty()               // Sample
```

### Athletes per College
```javascript
// Find college ID first
const collegeId = db.colleges.findOne({ code: "CLG001" })._id

// Count athletes in that college
db.athletes.countDocuments({ college: collegeId })
// Large college: 12, Small college: 4
```

### Verify Event Linking
```javascript
// Get a male track event
const eventId = db.events.findOne({ name: "100m", gender: "Male" })._id

// Find athletes registered for it
db.athletes.find({ 
  $or: [
    { event1: eventId.toString() },
    { event2: eventId.toString() },
    { relay1: eventId.toString() },
    { relay2: eventId.toString() }
  ]
}).pretty()
```

### Find Missing Events
```javascript
db.athletes.find({ 
  event1: null,
  relay1: null,
  mixedRelay: null
}).count()  // Should be 0
```

---

## 🐛 Troubleshooting

### "Missing required events" Error

**Problem:** Script can't find required events in Event collection  
**Solution:**
1. Check events were created: `db.events.countDocuments()` → should be 29
2. Verify event names match exactly (case-sensitive for MongoDB search)
3. If needed, delete and recreate:
   ```javascript
   db.events.deleteMany({})
   // Then create using EVENT_CREATION_SETUP.md
   ```

### "Duplicate key error" on colleges

**Problem:** College code or name already exists  
**Solution:**
```javascript
// Either: Delete existing data
db.colleges.deleteMany({})
db.users.deleteMany({ role: "ped" })
db.athletes.deleteMany({})

// Or: Use different college names
// Edit collegeNames array in seed script
```

### MongoDB Connection Error

**Problem:** Can't connect to MongoDB  
**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Check MONGO_URI in `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/buams
   ```
3. Verify database exists or will auto-create

### "athletes.length !== 600"

**Problem:** Script created different number of athletes  
**Solution:** This is usually just a warning if close to 600. If significantly off:
- Check college creation was successful
- Verify expectedEvents array has 29 events
- May indicate some colleges skipped due to duplication

---

## 🔒 Security Notes

### PED User Passwords

After seeding, PED users have:
- **Username:** Auto-generated, sanitized from name
- **Password:** Their phone number (temporary)
- **mustChangePassword:** true (required on first login)

**Login Process:**
1. PED logs in with username + phone number
2. System requires password change
3. PED sets own secure password

### Bcrypt Hashing

Passwords are hashed with bcrypt (10 salt rounds) before storage. Stored as:
```javascript
{
  username: "rohit_kumar",
  password: "$2a$10$..." // Cannot be reversed
}
```

---

## 📈 After Seeding - What You Can Do

### 1. Test Athlete Registration
- Login as PED user
- See 600 athletes auto-populated in system
- Filter by college, event, gender

### 2. Test Event Sheets (Stage 4)
- Select an event (e.g., 100m Male)
- Click "Generate Sheets"
- See REAL athletes (no test data)
- Verify heats generated (8 lanes each)
- Verify sets generated (12 per set)

### 3. Test Scoring Workflow
- Run through all 14 stages
- All athlete data flows from real database
- Can score, rank, publish results

### 4. Test Reporting
- Generate reports for all events
- See realistic data distributions
- Check relays, individual events, combined events

### 5. Test Performance
- System handles 600 athletes smoothly
- No timeouts or slowdowns
- Ready for production use

---

## 🗑️ Clearing the Seeded Data

If you need to reset:

```javascript
use buams
db.colleges.deleteMany({})
db.users.deleteMany({ role: "ped" })
db.athletes.deleteMany({})
// Events stay (if you want to re-seed)

// Or clear everything:
db.events.deleteMany({})
```

Then re-run the seeding process.

---

## 📋 Seeding Checklist

### Pre-Seeding
- [ ] MongoDB running locally
- [ ] Database `buams` created (or will auto-create)
- [ ] 29 events created in Event collection
- [ ] `.env` file configured with MONGO_URI
- [ ] Dependencies installed: `npm install mongoose bcryptjs dotenv`
- [ ] Backup created: `mongodump --out ./backup_...`

### Seeding
- [ ] Running: `node seed_realistic_with_real_event_ids.js`
- [ ] Output shows all collections created
- [ ] No errors in console

### Post-Seeding
- [ ] Verify counts: colleges=100, users~100, athletes=600
- [ ] Check sample college/user/athlete documents
- [ ] Verify event IDs in athlete event fields
- [ ] Backend server starts normally
- [ ] Can login as PED user
- [ ] Athletes display in frontend

### Testing
- [ ] Generate event sheets shows REAL athletes
- [ ] Heats/sets properly generated
- [ ] Can proceed through scoring stages
- [ ] Reports show realistic data

---

## 📞 Support

If issues occur:

1. Check **SEEDING_GUIDE.md** for detailed docs
2. Check **EVENT_CREATION_SETUP.md** for event creation
3. Review **Troubleshooting** section above
4. Check MongoDB logs: `mongo/mongod output`
5. Verify `.env` configuration

---

## 🎉 Success Indicators

✅ Script runs without errors  
✅ 100 colleges created  
✅ 100 PED users created  
✅ 600 athletes created  
✅ All athletes linked to real Event IDs  
✅ Chest numbers sequenced 1001-1600  
✅ Event registration constraints enforced  
✅ Can login and see data  
✅ Event sheets generate properly  
✅ System ready for full testing  

---

**All set? Start seeding!**

```bash
cd backend
node seed_realistic_with_real_event_ids.js
```

🌱 **Happy Seeding!** 🎯
