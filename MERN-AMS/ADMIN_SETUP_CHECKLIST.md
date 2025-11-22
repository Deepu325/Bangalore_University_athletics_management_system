# ✅ ADMIN SETUP CHECKLIST

## Phase 0: Database Verification
- [x] Database cleaned - All dummy data removed
- [x] 120 athletes deleted
- [x] 49 events deleted
- [x] All test data purged
- [x] Fresh database ready
- [x] Servers running (Backend on 5002, Frontend on 3000)

---

## Phase 1: Admin Registration (Do This First!)

### Step 1.1: Register Admin Account
- [ ] Go to http://localhost:3000
- [ ] Click **Admin Registration**
- [ ] Fill in:
  - Full Name: ___________________
  - Email: ___________________
  - Username: ___________________
  - Password: ___________________
  - Phone: ___________________
- [ ] Click **Register**
- [ ] Confirm OTP sent to email
- [ ] Admin dashboard should appear

### Step 1.2: Verify Admin Access
- [ ] Can access Admin Dashboard
- [ ] Can see menu options (Manage Colleges, Manage Events, etc.)
- [ ] Can logout and login again successfully

---

## Phase 2: Create Colleges

### Step 2.1: Add College 1
- [ ] Click **Manage Colleges** → **Add New College**
- [ ] College Code: ___________________
- [ ] College Name: ___________________
- [ ] Location: ___________________
- [ ] Contact Person: ___________________
- [ ] Phone: ___________________
- [ ] Email: ___________________
- [ ] Click **Add** → Verify appears in list

### Step 2.2: Add College 2
- [ ] Repeat above process
- [ ] Fill in second college details

### Step 2.3: Add College 3+
- [ ] Continue adding remaining colleges
- [ ] Target: 3-5 colleges minimum
- [ ] Verify all colleges appear in dropdown

### Step 2.4: Verify Colleges
- [ ] All colleges listed in Manage Colleges
- [ ] All appear in PED registration dropdown
- [ ] No duplicate colleges
- [ ] All have unique codes

---

## Phase 3: Create Events

### Step 3.1: Standard Track Events
- [ ] **100m**
  - [ ] 100m Men
  - [ ] 100m Women
- [ ] **200m**
  - [ ] 200m Men
  - [ ] 200m Women
- [ ] **400m**
  - [ ] 400m Men
  - [ ] 400m Women
- [ ] **800m**
  - [ ] 800m Men
  - [ ] 800m Women
- [ ] **1500m**
  - [ ] 1500m Men
  - [ ] 1500m Women

### Step 3.2: Long Distance Events
- [ ] **5000m**
  - [ ] 5000m Men
  - [ ] 5000m Women
- [ ] **10000m** (Optional)
  - [ ] 10000m Men
  - [ ] 10000m Women

### Step 3.3: Hurdles & Steeplechase
- [ ] **110m Hurdles Men** (Optional)
- [ ] **100m Hurdles Women** (Optional)
- [ ] **400m Hurdles** (Optional)
  - [ ] 400m Hurdles Men
  - [ ] 400m Hurdles Women
- [ ] **3000m Steeplechase** (Optional)

### Step 3.4: Relay Events
- [ ] **4x100m Relay Men**
- [ ] **4x100m Relay Women**
- [ ] **4x400m Relay** (Optional)
  - [ ] 4x400m Relay Men
  - [ ] 4x400m Relay Women
- [ ] **Mixed 4x100m Relay** (Optional)

### Step 3.5: Field Events (Optional)
- [ ] **Long Jump**
  - [ ] Long Jump Men
  - [ ] Long Jump Women
- [ ] **High Jump**
  - [ ] High Jump Men
  - [ ] High Jump Women
- [ ] **Shot Put, Discus, Javelin** (Optional)

### Step 3.6: Verify Events
- [ ] Total events created: _______
- [ ] All events appear in dropdown
- [ ] Can sort by gender/distance
- [ ] No duplicate events

---

## Phase 4: PED Registration

### Step 4.1: Create PED Account 1
- [ ] PED Goes to: http://localhost:3000
- [ ] Click **PED Registration**
- [ ] Fill in:
  - Full Name: ___________________
  - Email: ___________________
  - College: Select from dropdown ___________________
  - Username: Auto-filled or custom ___________________
  - Password: ___________________
  - Phone: ___________________
- [ ] Click **Register**
- [ ] Confirm OTP
- [ ] PED dashboard appears

### Step 4.2: Verify PED Access
- [ ] PED can login with username/password
- [ ] PED can see their college name
- [ ] Can access "Manage Athletes" menu
- [ ] Can logout and login again

### Step 4.3: Create PED Accounts for Other Colleges
- [ ] Repeat process for each college's PED
- [ ] Total PEDs registered: _______
- [ ] Each has unique college assignment
- [ ] All can login successfully

---

## Phase 5: Athletes Registration

### Step 5.1: PED Registers Athletes (College 1)
- [ ] PED 1 logs in to their dashboard
- [ ] Click **Manage Athletes** → **Add New Athlete**
- [ ] For each athlete, fill:
  - Athlete Name: ___________________
  - Gender: Male / Female
  - Chest Number: ___________________
  - Event 1: ___________________
  - Event 2: ___________________
  - Relay 1: ___________________
  - Relay 2: ___________________
- [ ] Click **Add** → Athlete appears in list
- [ ] Repeat for all athletes from this college

### Step 5.2: PED Registers Athletes (College 2 & 3+)
- [ ] Each PED logs in separately
- [ ] Each registers their college's athletes
- [ ] Total athletes registered: _______
- [ ] All have unique chest numbers
- [ ] All have at least one event assigned

### Step 5.3: Verify Athletes
- [ ] Can view all registered athletes
- [ ] Each athlete has assigned events
- [ ] Can edit athlete information
- [ ] Can delete athletes if needed
- [ ] No duplicate chest numbers

---

## Phase 6: Data Verification (Before Phase 1)

### Step 6.1: Colleges Verification
- [ ] Colleges in system: _______
- [ ] All colleges have codes
- [ ] All colleges have locations
- [ ] All have contact information

### Step 6.2: Events Verification
- [ ] Events in system: _______
- [ ] Both Men and Women events exist
- [ ] Relay events are created
- [ ] No duplicate events
- [ ] All events are active

### Step 6.3: Athletes Verification
- [ ] Total athletes: _______
- [ ] Athletes per college: _____ (Average)
- [ ] All athletes have events
- [ ] No duplicate chest numbers
- [ ] Chest numbers start from 001

### Step 6.4: User Verification
- [ ] Admin account active
- [ ] PEDs: _______ accounts created
- [ ] All can login successfully
- [ ] Each PED assigned to correct college

---

## Phase 7: System Ready Confirmation

- [ ] Database is clean (no dummy data)
- [ ] All colleges created
- [ ] All events created
- [ ] All PEDs registered
- [ ] All athletes registered
- [ ] Data verified and correct
- [ ] Servers running without errors
- [ ] Admin can access dashboard
- [ ] PEDs can access their dashboards

---

## 🎉 READY FOR PHASE 1 - HEAT GENERATION

Once all checkboxes above are complete:
- ✅ System is ready for Phase 1 (Heat Generation)
- ✅ Admin can manage competitions
- ✅ PEDs can track their athletes
- ✅ Results can be entered and tracked
- ✅ Reports and sheets can be generated

---

## 📞 NEED HELP?

Refer to:
- **FRESH_DB_SETUP_GUIDE.md** - Complete instructions
- **QUICK_START_FRESH_DB.md** - Quick reference
- **DATABASE_READY.md** - Status overview

---

**Status: Ready to Begin Setup!** ✅
