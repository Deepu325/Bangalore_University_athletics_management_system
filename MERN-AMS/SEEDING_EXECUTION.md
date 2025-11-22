# ⚡ Step-by-Step Seeding Execution Guide

**Estimated Time:** 10-15 minutes  
**Difficulty:** Easy  
**Risk Level:** Low (with backup)

---

## Step 1️⃣: Backup Your Database (2 min)

Open PowerShell in your backend directory:

```powershell
# Create a backup folder
mkdir backup_$(Get-Date -Format yyyyMMdd_HHmmss)

# Backup your database
mongodump --uri "mongodb://localhost:27017/buams" --out "./backup_$(Get-Date -Format yyyyMMdd_HHmmss)"
```

✅ **Done** - You have a backup in case anything goes wrong.

---

## Step 2️⃣: Check if Events Exist (1 min)

Open MongoDB Shell:

```bash
mongosh
```

Or if mongosh isn't available:

```bash
mongo
```

Run these commands:

```javascript
use buams
db.events.countDocuments()
```

**Two scenarios:**

### Scenario A: Output is 29 or more ✅
```
29
```
→ **Great! Skip to Step 3**

### Scenario B: Output is 0 or less than 29 ❌
```
0
```
→ **You need to create events first. Go to Step 2B**

---

## Step 2B: Create Events (3 min) - IF NEEDED

**Still in mongosh?** If yes, skip to code below. If no:

```bash
mongosh
use buams
```

**Copy-paste this entire block:**

```javascript
db.events.insertMany([
  // Men's Track
  { name: "100m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "200m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "400m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "800m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "1500m", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "110m Hurdles", gender: "Male", category: "track", status: "Upcoming", createdAt: new Date() },
  
  // Men's Jump
  { name: "Long Jump", gender: "Male", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "High Jump", gender: "Male", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "Pole Vault", gender: "Male", category: "jump", status: "Upcoming", createdAt: new Date() },
  
  // Men's Throw
  { name: "Shot Put", gender: "Male", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Discus Throw", gender: "Male", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Javelin Throw", gender: "Male", category: "throw", status: "Upcoming", createdAt: new Date() },
  
  // Men's Relay
  { name: "4x100m Relay", gender: "Male", category: "relay", status: "Upcoming", createdAt: new Date() },
  { name: "4x400m Relay", gender: "Male", category: "relay", status: "Upcoming", createdAt: new Date() },
  
  // Women's Track
  { name: "100m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "200m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "400m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "800m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "1500m", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  { name: "100m Hurdles", gender: "Female", category: "track", status: "Upcoming", createdAt: new Date() },
  
  // Women's Jump
  { name: "Long Jump", gender: "Female", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "High Jump", gender: "Female", category: "jump", status: "Upcoming", createdAt: new Date() },
  { name: "Pole Vault", gender: "Female", category: "jump", status: "Upcoming", createdAt: new Date() },
  
  // Women's Throw
  { name: "Shot Put", gender: "Female", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Discus Throw", gender: "Female", category: "throw", status: "Upcoming", createdAt: new Date() },
  { name: "Javelin Throw", gender: "Female", category: "throw", status: "Upcoming", createdAt: new Date() },
  
  // Women's Relay
  { name: "4x100m Relay", gender: "Female", category: "relay", status: "Upcoming", createdAt: new Date() },
  { name: "4x400m Relay", gender: "Female", category: "relay", status: "Upcoming", createdAt: new Date() },
  
  // Mixed Relay
  { name: "4x400m Mixed Relay", gender: "Female", category: "relay", status: "Upcoming", createdAt: new Date() }
])
```

**Expected output:**
```javascript
{
  acknowledged: true,
  insertedIds: [ ObjectId(...), ObjectId(...), ... ]
}
```

Verify:
```javascript
db.events.countDocuments()  // Should be 29
```

**Exit mongosh:**
```javascript
exit()
```

✅ **Events created!** Continue to Step 3.

---

## Step 3️⃣: Check & Install Dependencies (2 min)

Open PowerShell in `backend` folder:

```powershell
cd backend
```

Check if packages are installed:

```powershell
npm list mongoose bcryptjs dotenv
```

**Two scenarios:**

### Scenario A: All three packages listed ✅
→ **Skip to Step 4**

### Scenario B: Packages missing ❌
```powershell
npm install mongoose bcryptjs dotenv
```

Wait for installation to complete. Output should show:
```
added 45 packages
```

✅ **Dependencies installed!** Continue to Step 4.

---

## Step 4️⃣: Configure Environment (1 min)

In `backend` folder, check if `.env` file exists:

```powershell
Test-Path .env
```

**Two scenarios:**

### Scenario A: Returns True ✅
→ **Skip to Step 5**

### Scenario B: Returns False ❌
Create `.env` file:

```powershell
"MONGO_URI=mongodb://localhost:27017/buams`nBCRYPT_SALT_ROUNDS=10" | Out-File -Encoding UTF8 .env
```

Verify it was created:

```powershell
Get-Content .env
```

Should show:
```
MONGO_URI=mongodb://localhost:27017/buams
BCRYPT_SALT_ROUNDS=10
```

✅ **Environment configured!** Continue to Step 5.

---

## Step 5️⃣: Verify Seeding Script Exists (1 min)

Check if `seed_realistic_with_real_event_ids.js` exists in backend:

```powershell
Test-Path seed_realistic_with_real_event_ids.js
```

**Two scenarios:**

### Scenario A: Returns True ✅
→ **Go to Step 6**

### Scenario B: Returns False ❌
The file wasn't created. Let me know and I'll create it.

✅ **Script ready!** Continue to Step 6.

---

## Step 6️⃣: Run the Seeding Script (3-5 min)

**IMPORTANT: Make sure MongoDB is running!**

Open new PowerShell and run MongoDB:
```powershell
mongod
```

In your backend PowerShell, run:

```powershell
node seed_realistic_with_real_event_ids.js
```

**Watch the output:**

You should see:
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

⏳ **Wait for it to complete** (3-5 minutes for 600 athletes)

✅ **Script completed!** Continue to Step 7.

---

## Step 7️⃣: Verify Data Was Created (2 min)

Open mongosh:

```bash
mongosh
use buams
```

Run verification queries:

```javascript
// Check colleges
db.colleges.countDocuments()
// Expected: 100

// Check PED users
db.users.find({ role: "ped" }).countDocuments()
// Expected: ~100

// Check athletes
db.athletes.countDocuments()
// Expected: 600

// Check a sample college
db.colleges.findOne({ code: "CLG001" }).pretty()

// Check a sample athlete
db.athletes.findOne({}).pretty()
```

**Expected sample college:**
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

**Expected sample athlete:**
```javascript
{
  _id: ObjectId("..."),
  name: "Arjun Reddy",
  chestNo: "1001",
  college: ObjectId("..."),
  gender: "Male",
  event1: "507f1f77bcf86cd799439011",
  event2: "507f1f77bcf86cd799439012",
  relay1: null,
  status: "PRESENT",
  registrationDate: ISODate("2025-11-19T..."),
  uucms: ""
}
```

✅ **Everything looks good!** Exit mongosh.

---

## Step 8️⃣: Start Backend Server (2 min)

Back in PowerShell (backend folder), start the server:

```powershell
npm run dev
```

Wait for message:
```
✓ BU-AMS Backend Server running on http://localhost:5001
```

✅ **Backend running!** Continue to Step 9.

---

## Step 9️⃣: Test Login with Seeded PED User (2 min)

In another terminal, start the frontend:

```powershell
cd frontend
npm start
```

Wait for React to compile. Browser opens to `http://localhost:3000`

**Get a PED username:**

```bash
mongosh
use buams
db.users.findOne({ role: "ped" }).username
// Example output: "rohit_kumar"
```

Go back to browser, login as PED:
- **Username:** rohit_kumar (or any output from above)
- **Password:** Check the PED phone from college record
  ```bash
  db.colleges.findOne({ code: "CLG001" }).pedPhone
  // Example: "9876543210"
  ```

✅ **Successfully logged in!**

First login will require you to change password. Set a new one and continue.

---

## 🔟 Final: Verify Athletes Display (1 min)

After login and password change:

1. Go to **Athlete Registration**
2. Select any college
3. Click **"View All Athletes"**

You should see **4-12 athletes** depending on college size.

✅ **Perfect!** System is seeded and working!

---

## 🎉 Success Checklist

- [ ] Backup created
- [ ] 29 events in database
- [ ] Dependencies installed
- [ ] `.env` configured
- [ ] Seeding script executed
- [ ] 100 colleges created
- [ ] 100 PED users created
- [ ] 600 athletes created
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Successfully logged in
- [ ] Athletes displaying in system

✅ **All Done!** Your system is ready with realistic data.

---

## 🚀 Next Steps

1. **Generate Event Sheets** (Stage 4)
   - Go to Event Management
   - Select a sport/event
   - Proceed through stages 1-3
   - Stage 4: Generate sheets → See REAL athletes!

2. **Run through Scoring**
   - Complete all 14 stages
   - Test complete workflow
   - Verify data flows properly

3. **Test Reporting**
   - Generate athlete reports
   - Check event results
   - Verify statistics

---

**Questions? See:**
- `SEEDING_README.md` - Complete overview
- `SEEDING_GUIDE.md` - Detailed documentation
- `EVENT_CREATION_SETUP.md` - Event creation details

---

**Enjoy your seeded database! 🌱**
