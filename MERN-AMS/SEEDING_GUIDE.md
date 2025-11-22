# 🌱 Database Seeding Guide - Production Data

## Overview

The `seed_realistic_with_real_event_ids.js` script populates your MongoDB database with realistic test data:

- **100 Colleges** (with auto-generated codes: CLG001-CLG100)
- **100 PED Users** (one per college, with auto-generated credentials)
- **600 Athletes** (distributed across colleges, with realistic event registrations)
- **Real Event Links** (athletes linked to actual Event._id values from your Event collection)

---

## ⚠️ CRITICAL: BACKUP FIRST

This script **WRITES TO YOUR DATABASE**. Before running:

```bash
# Backup your MongoDB database
mongodump --uri "mongodb://localhost:27017/buams" --out ./backup_$(date +%Y%m%d_%H%M%S)
```

---

## 📋 Pre-Requisites

### 1. Install Dependencies

```bash
cd backend
npm install mongoose bcryptjs dotenv
```

### 2. Ensure Events Exist in Database

The script requires Event documents to exist. It will match events by:
- Event name (case-insensitive)
- Event gender (Male/Female)
- Event category (track, jump, throw, relay)

**Required Events** (25 total):

| Name | Gender | Category |
|------|--------|----------|
| 100m | Male | track |
| 200m | Male | track |
| 400m | Male | track |
| 800m | Male | track |
| 1500m | Male | track |
| 110m Hurdles | Male | track |
| Long Jump | Male | jump |
| High Jump | Male | jump |
| Pole Vault | Male | jump |
| Shot Put | Male | throw |
| Discus Throw | Male | throw |
| Javelin Throw | Male | throw |
| 4x100m Relay | Male | relay |
| 4x400m Relay | Male | relay |
| 100m | Female | track |
| 200m | Female | track |
| 400m | Female | track |
| 800m | Female | track |
| 1500m | Female | track |
| 100m Hurdles | Female | track |
| Long Jump | Female | jump |
| High Jump | Female | jump |
| Pole Vault | Female | jump |
| Shot Put | Female | throw |
| Discus Throw | Female | throw |
| Javelin Throw | Female | throw |
| 4x100m Relay | Female | relay |
| 4x400m Relay | Female | relay |
| 4x400m Mixed Relay | Female | relay |

**To create events quickly**, run this in MongoDB:

```javascript
db.events.insertMany([
  { name: "100m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "200m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "400m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "800m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "1500m", gender: "Male", category: "track", status: "Upcoming" },
  { name: "110m Hurdles", gender: "Male", category: "track", status: "Upcoming" },
  { name: "Long Jump", gender: "Male", category: "jump", status: "Upcoming" },
  { name: "High Jump", gender: "Male", category: "jump", status: "Upcoming" },
  { name: "Pole Vault", gender: "Male", category: "jump", status: "Upcoming" },
  { name: "Shot Put", gender: "Male", category: "throw", status: "Upcoming" },
  { name: "Discus Throw", gender: "Male", category: "throw", status: "Upcoming" },
  { name: "Javelin Throw", gender: "Male", category: "throw", status: "Upcoming" },
  { name: "4x100m Relay", gender: "Male", category: "relay", status: "Upcoming" },
  { name: "4x400m Relay", gender: "Male", category: "relay", status: "Upcoming" },
  { name: "100m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "200m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "400m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "800m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "1500m", gender: "Female", category: "track", status: "Upcoming" },
  { name: "100m Hurdles", gender: "Female", category: "track", status: "Upcoming" },
  { name: "Long Jump", gender: "Female", category: "jump", status: "Upcoming" },
  { name: "High Jump", gender: "Female", category: "jump", status: "Upcoming" },
  { name: "Pole Vault", gender: "Female", category: "jump", status: "Upcoming" },
  { name: "Shot Put", gender: "Female", category: "throw", status: "Upcoming" },
  { name: "Discus Throw", gender: "Female", category: "throw", status: "Upcoming" },
  { name: "Javelin Throw", gender: "Female", category: "throw", status: "Upcoming" },
  { name: "4x100m Relay", gender: "Female", category: "relay", status: "Upcoming" },
  { name: "4x400m Relay", gender: "Female", category: "relay", status: "Upcoming" },
  { name: "4x400m Mixed Relay", gender: "Female", category: "relay", status: "Upcoming" }
])
```

### 3. Set MongoDB URI

Create a `.env` file in your backend directory:

```env
MONGO_URI=mongodb://localhost:27017/buams
BCRYPT_SALT_ROUNDS=10
```

Or use the default: `mongodb://localhost:27017/buams`

---

## 🚀 Running the Script

```bash
cd backend
node seed_realistic_with_real_event_ids.js
```

### Expected Output

```
✓ Connected to MongoDB: mongodb://localhost:27017/buams

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

============================================================
✅ SEEDING COMPLETE
============================================================
Colleges created: 100
PED users created: ~100
Athletes created: 600
Chest numbers used: 1001 - 1600
Events mapped: 29/29

Next steps:
1. Verify in MongoDB:
   db.colleges.countDocuments()
   db.users.find({ role: 'ped' }).countDocuments()
   db.athletes.countDocuments()
2. Check sample athlete: db.athletes.findOne({}).pretty()
3. Verify event IDs are stored in event1/event2/relay1 fields
============================================================
```

---

## ✅ Verification Steps

### 1. Count Documents

```javascript
// In MongoDB shell or Compass
db.colleges.countDocuments()          // Should be ~100
db.users.find({ role: 'ped' }).count() // Should be ~100
db.athletes.countDocuments()          // Should be 600
```

### 2. Check Sample College

```javascript
db.colleges.findOne({ code: "CLG001" }).pretty()
```

Output:
```javascript
{
  _id: ObjectId("..."),
  code: "CLG001",
  name: "Soundarya Institute of Technology",
  pedName: "Rohit Kumar",
  pedPhone: "9876543210",
  createdAt: ISODate("2025-11-19T..."),
  updatedAt: ISODate("2025-11-19T...")
}
```

### 3. Check Sample PED User

```javascript
db.users.findOne({ role: "ped" }).pretty()
```

Output:
```javascript
{
  _id: ObjectId("..."),
  username: "rohit_kumar",
  password: "$2a$10$...", // bcrypt hash
  role: "ped",
  mustChangePassword: true,
  collegeId: ObjectId("..."), // links to college
  createdAt: ISODate("2025-11-19T..."),
  updatedAt: ISODate("2025-11-19T...")
}
```

### 4. Check Sample Athlete

```javascript
db.athletes.findOne({}).pretty()
```

Output:
```javascript
{
  _id: ObjectId("..."),
  name: "Arjun Reddy",
  chestNo: "1001",
  college: ObjectId("..."), // links to college
  gender: "Male",
  event1: "507f1f77bcf86cd799439011", // Event._id as string
  event2: "507f1f77bcf86cd799439012", // Another event
  relay1: null,
  relay2: null,
  mixedRelay: null,
  status: "PRESENT",
  registrationDate: ISODate("2025-11-19T..."),
  uucms: ""
}
```

### 5. Verify Event Linking

```javascript
// Get an event ID
const eventId = db.events.findOne({ name: "100m", gender: "Male" })._id

// Find athletes registered for it
db.athletes.find({ event1: eventId.toString() }).count()
// Should return 12-15 athletes

// Verify athlete details
db.athletes.findOne({ event1: eventId.toString() }).pretty()
```

---

## 📊 Data Distribution

### Colleges
- **100 total colleges**
- Codes: CLG001 through CLG100
- Each has one PED user

### Athletes
- **600 total athletes**
- **25 "large" colleges**: 12 athletes each (300 total)
- **75 "small" colleges**: 4 athletes each (300 total)
- **Gender split**: ~50% male, 50% female

### Event Assignments
- **Individual events**: Max 2 athletes per event per college
- **Relay teams**: Max 1 team per relay per college
- **Mixed relay**: 25 large colleges have 1 mixed relay team (2M + 2F)
- **Chest numbers**: Global sequence 1001-1600

### Example Athlete Profiles

| Athlete | College | Gender | Event1 | Event2 | Relay1 | Notes |
|---------|---------|--------|--------|--------|--------|-------|
| Rohit | CLG001 | Male | 100m | 200m | - | Individual runner |
| Pooja | CLG001 | Female | Long Jump | High Jump | - | Individual jumper |
| Arjun | CLG001 | Male | 4x100m | - | 4x100m | Relay member |
| Sanjana | CLG001 | Female | 100m Hurdles | - | 4x400m Mixed | Mixed relay (F) |

---

## 🔒 PED User Credentials

Each PED user has:
- **Username**: Auto-generated from PED name (lowercase, sanitized)
- **Password**: PED phone number (hashed with bcrypt)
- **mustChangePassword**: `true` (must change on first login)
- **Role**: `ped`

Example:
```
Username: rohit_kumar
Password: 9876543210 (before hashing)
First Login: Must change password
```

---

## 🐛 Troubleshooting

### Error: "Missing required events"

**Cause**: Event documents don't exist in DB  
**Solution**: Create events using the MongoDB command above

### Error: "duplicate key error"

**Cause**: Duplicate colleges or users exist  
**Solution**: 
```javascript
// Clear collections if needed
db.colleges.deleteMany({})
db.users.deleteMany({})
db.athletes.deleteMany({})
// Then re-run the script
```

### Error: "MONGO_URI not found"

**Cause**: .env file not set or MongoDB not running  
**Solution**:
```bash
# Create .env
echo "MONGO_URI=mongodb://localhost:27017/buams" > backend/.env

# Start MongoDB
mongod
```

### Script runs but athletes are empty

**Cause**: Events were created but script couldn't match them  
**Solution**: Verify event names/genders exactly match the script's expectedEvents

---

## 📝 What Gets Created

### Collections Modified

| Collection | Action | Count |
|-----------|--------|-------|
| `colleges` | Insert | +100 |
| `users` | Insert | +100 |
| `athletes` | Insert | +600 |
| `events` | Read (no changes) | - |

### Indexes Used

```javascript
// Automatically utilized:
db.colleges.createIndex({ code: 1 }, { unique: true })
db.colleges.createIndex({ name: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { sparse: true, unique: true })
```

---

## 🎯 Next Steps

After seeding:

1. ✅ **Start Backend Server**
   ```bash
   npm run dev
   ```

2. ✅ **Login as PED User**
   - Username: `rohit_kumar` (or any generated username)
   - Password: PED phone number
   - Will be prompted to change password

3. ✅ **View Registered Athletes**
   - Go to Athlete Registration
   - See athletes auto-populated from DB

4. ✅ **Generate Event Sheets**
   - Go to Stage 4: Generate Sheets
   - Sheets will show REAL athletes with proper heat/set division

5. ✅ **Test Scoring**
   - Proceed through remaining stages
   - All data flows from real database

---

## 💾 Data Persistence

All seeded data persists in MongoDB. To:

- **Clear everything**: Delete documents from collections (see Troubleshooting)
- **Keep it**: Data remains until manually deleted
- **Backup**: Use `mongodump` to export before clearing

---

## 📊 Useful Queries

### Find all athletes for a college
```javascript
db.athletes.find({ college: ObjectId("...") })
```

### Find all athletes for an event
```javascript
const eventId = db.events.findOne({ name: "100m", gender: "Male" })._id
db.athletes.find({ 
  $or: [
    { event1: eventId.toString() },
    { event2: eventId.toString() },
    { relay1: eventId.toString() }
  ]
})
```

### Find athletes missing events
```javascript
db.athletes.find({ 
  event1: null,
  relay1: null,
  mixedRelay: null
})
```

### Count males vs females
```javascript
db.athletes.countDocuments({ gender: "Male" })
db.athletes.countDocuments({ gender: "Female" })
```

---

**Ready to seed? Run: `node seed_realistic_with_real_event_ids.js`** 🌱

