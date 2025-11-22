# 🧪 PHASE 1-5 MANUAL QA TEST EXECUTION GUIDE
**Step-by-Step Testing Instructions — All Phases**

---

## 📋 QUICK START FOR QA TEAM

### System Requirements
```
✓ MongoDB running on localhost:27017
✓ Backend running on localhost:5002
✓ Frontend running on localhost:3000
✓ Modern browser (Chrome, Firefox, Safari)
✓ Network connectivity verified
```

### Test Environment Setup
```bash
# Terminal 1 - MongoDB
mongod

# Terminal 2 - Backend
cd backend && npm start

# Terminal 3 - Frontend
cd frontend && npm start

# Test Application
Open: http://localhost:3000
```

---

## 🟦 PHASE 1 – EVENT CREATION (30 minutes)

### Test 1.1: Create Event - Track Category

**Steps:**
1. Open Admin Dashboard → Event Management
2. Click "Create New Event"
3. Select:
   - Category: **Track**
   - Event: **100m**
   - Gender: **Male**
   - Date: **2025-12-15**
   - Time: **10:00 AM**
   - Venue: **Stadium A**
   - Number of Athletes: **15** (default)
4. Click **Create Event**

**Expected Results:**
```
✓ Event card appears on Dashboard
✓ Event name shows "100m Male"
✓ Event date/time displays correctly
✓ Sample athletes generated (15 total)
✓ Event stored in DB (check MongoDB: db.events.findOne())
✓ statusFlow.created = true
```

**Verification Checklist:**
- [ ] Category dropdown has 5 options (Track, Jump, Throw, Relay, Combined)
- [ ] Event dropdown updates when category changes
- [ ] Gender dropdown shows Male/Female
- [ ] Date and time inputs work correctly
- [ ] Venue text accepted
- [ ] Event card appears immediately after creation
- [ ] No duplicate event created if name already exists

---

### Test 1.2: Verify Event Data in Database

**Command:**
```javascript
// MongoDB Console
db.events.find({name: "100m"}).pretty()
```

**Expected Output:**
```json
{
  _id: ObjectId("..."),
  name: "100m",
  category: "Track",
  gender: "Male",
  date: "2025-12-15",
  time: "10:00",
  venue: "Stadium A",
  athletes: [...],
  statusFlow: {
    created: true,
    callRoomGenerated: false,
    callRoomCompleted: false,
    ...
  }
}
```

**Verification:**
- [ ] Event document exists
- [ ] All fields present and correct
- [ ] athletes array populated (15 entries)
- [ ] Each athlete has: name, chestNo, college, gender, status
- [ ] statusFlow tracking initialized

---

## 🟩 PHASE 2 – CALL ROOM GENERATION (25 minutes)

### Test 2.1: Generate Call Room Sheet

**Steps:**
1. From Phase 1 event, click **View Event**
2. Current stage should show **Stage 2: Call Room Generation**
3. Click **Generate Call Room Sheet**
4. Observe the generated table

**Expected Results:**
```
✓ Table displays with columns:
  - SL NO (1, 2, 3, ...)
  - CHEST NO (1001, 1002, 1003, ...)
  - NAME (athlete names)
  - COLLEGE (college names)
  - REMARKS (empty)

✓ All 15 athletes listed
✓ Only MALE athletes (no female athletes mixed in)
✓ Chest numbers sequential
✓ Names match athlete records
✓ Colleges displayed correctly
```

### Test 2.2: Print Call Room Sheet

**Steps:**
1. Click **Print / PDF** button
2. Browser print dialog appears
3. Preview the document
4. (Optional) Print to PDF or actual paper

**Expected Results:**
```
✓ Print preview shows:
  - Professional header
  - Event name: "100m Male"
  - Date and venue
  - Full athlete table
  - Footer with page number
  - Landscape orientation (A4)

✓ No cut-off content
✓ Table readable
✓ All athletes visible
✓ Remarks column empty (for officials to fill)
```

**Verification Checklist:**
- [ ] All athletes load correctly
- [ ] Men/women separated (only males shown)
- [ ] Chest number sequential
- [ ] Name, college, gender correct
- [ ] Print dialog shows professional format
- [ ] Print preview is readable
- [ ] No duplicate athletes

---

## 🟧 PHASE 3 – CALL ROOM COMPLETION (20 minutes)

### Test 3.1: Mark Attendance

**Steps:**
1. Stage should show **Stage 3: Call Room Completion**
2. For each athlete, mark attendance:
   - Athletes 1-13: **PRESENT**
   - Athlete 14: **ABSENT** (with remarks "Not reported")
   - Athlete 15: **DISQUALIFIED** (with remarks "Ineligible entry")
3. Click **Proceed to Stage 4**

**Expected Results:**
```
✓ Status dropdown shows 3 options:
  - PRESENT
  - ABSENT
  - DISQUALIFIED

✓ Remarks field accepts text input
✓ Summary updates:
  - PRESENT: 13
  - ABSENT: 1
  - DISQUALIFIED: 1

✓ Only PRESENT athletes proceed (important!)
✓ Data saved to DB
```

**Verification:**
- [ ] Status marking works for all athletes
- [ ] Remarks field functional
- [ ] Summary counts correct (13+1+1=15)
- [ ] Can proceed to next stage
- [ ] ABSENT athletes will be filtered in Stage 4

---

## 🟥 PHASE 4 – TOP SELECTION & HEATS (45 minutes)

### Test 4.1: Generate Event Sheets (Stage 4)

**Steps:**
1. Stage should show **Stage 4: Generate Sheets**
2. Click **Generate Sheets**
3. System fetches athletes from DB (backend API call)

**Expected Results:**
```
✓ Only PRESENT athletes shown (13 athletes, not 15)
✓ ABSENT and DIS athletes filtered out
✓ Athletes sorted by Round 1 performance (if available)
  OR default ordering if no Round 1 scores yet
✓ Sheets generated in sets (for Track: 8 + 5 athletes)
✓ No duplicate athletes
✓ Each athlete appears once
```

### Test 4.2: Round 1 Scoring (Stage 5)

**Steps:**
1. Click **Score Round 1 Results**
2. Enter times for each athlete
   - Test auto-formatting: Type "00002300" → Should become "00:00:23:00"
   - Test decimal: Try entering times
3. Tab through athletes (test TAB navigation)
4. Verify cursor never disappears
5. Click **Save Round 1 Results**

**Testing Tab Navigation:**
```
[ ] Type time for Athlete 1
[ ] Press TAB
[ ] Cursor moves to Athlete 2 time field
[ ] Type time for Athlete 2
[ ] Press TAB
[ ] Cursor moves to Athlete 3
[ ] ... continues smoothly
[ ] Press Shift+TAB
[ ] Cursor moves backward
```

**Testing Cursor Behavior:**
```
[ ] Typing continuous text: cursor stays visible
[ ] Typing "00002526": format becomes "00:00:25:26" instantly
[ ] Cursor doesn't jump to end erratically
[ ] Copy-paste "00002526": auto-formats correctly
[ ] Focus never lost
```

**Expected Results:**
```
✓ Auto-formatting works: "00002300" → "00:00:23:00"
✓ Tab navigation smooth and predictable
✓ Cursor NEVER jumps or disappears
✓ All 13 athletes scored
✓ Times sorted: lowest time first (10.45s < 10.56s < 10.68s)
✓ Ranking assigned: 1st, 2nd, 3rd, ...
✓ Results stored in DB
```

**Verification Checklist:**
- [ ] Auto time formatting works
- [ ] Auto decimal formatting works (for field events)
- [ ] Tab navigation smooth
- [ ] Shift+Tab reverses direction
- [ ] Cursor never jumps during typing
- [ ] Copy-paste works
- [ ] Focus stays on input during typing
- [ ] Results saved to DB
- [ ] Ranking correct (lowest time = best)

---

### Test 4.3: Top Selection (Stage 6)

**Steps:**
1. Click **Select Top Athletes**
2. Choose **Top 8** (for heats testing)
3. Observe the selected athletes

**Expected Results:**
```
✓ Exactly 8 athletes selected
✓ Ranked 1st through 8th by performance
✓ Order matches Round 1 results
✓ Can switch to Top 16 (if applicable)
✓ Athletes highlight/show selection clearly
```

---

### Test 4.4: Heats Generation (Stage 7)

**Steps:**
1. Click **Generate Heats**
2. Observe heat assignments

**Expected Results - IAAF Lane Mapping:**
```
Heat 1 (Top 4 athletes in odd ranks: 1, 3, 5, 7):
✓ Athlete ranked 1st → Lane 3
✓ Athlete ranked 3rd → Lane 2
✓ Athlete ranked 5th → Lane 6
✓ Athlete ranked 7th → Lane 7

Heat 2 (Even ranks: 2, 4, 6, 8):
✓ Athlete ranked 2nd → Lane 4
✓ Athlete ranked 4th → Lane 5
✓ Athlete ranked 6th → Lane 1
✓ Athlete ranked 8th → Lane 8

Critical Verification:
✓ IAAF mapping correct: 1→3, 2→4, 3→2, 4→5, 5→6, 6→1, 7→7, 8→8
✓ No lane conflicts
✓ All athletes have lanes
✓ Lane assignments same for all heats
```

**Heats Scoring:**
1. For each heat, enter times
2. Tab through athletes
3. Save heats results

**Expected Results:**
```
✓ Heats scored separately
✓ Combined heat results determine finalists
✓ Top 8 from all heats identified
✓ Finalists locked for final round
```

---

### Test 4.5: Pre-Final Sheet (Stage 8)

**Steps:**
1. Stage shows **Stage 8: Pre-Final Sheet**
2. System generates sheet with finalists
3. Click **Print / PDF** to preview

**Expected Results:**
```
✓ Exactly 8 finalists shown
✓ IAAF lane mapping applied (same as heats):
  - Finalist ranked 1st → Lane 3
  - Finalist ranked 2nd → Lane 4
  - ... etc
✓ Professional print format
✓ Header/footer visible
✓ Landscape orientation
✓ All finalists listed with lanes clearly marked
```

**Verification Checklist:**
- [ ] Top 8 finalists displayed
- [ ] IAAF lane mapping correct
- [ ] Print preview shows lanes
- [ ] Header and footer present
- [ ] Landscape orientation
- [ ] All information readable

---

## 🟪 PHASE 5 – FINAL SCORING & CHAMPIONSHIPS (60 minutes)

### Test 5.1: Final Round Scoring (Stage 9)

**Steps:**
1. Stage shows **Stage 9: Final Scoring**
2. Enter final round times/distances
3. Test input formatting
4. Submit final results

**Expected Results:**
```
✓ Time/distance input formatting works
✓ All 8 finalists scored
✓ Ranking calculated (1st-8th by performance)
✓ Medal points assigned:
  - 1st place: 5 points ✓
  - 2nd place: 3 points ✓
  - 3rd place: 1 point ✓
  - 4th-8th: 0 points ✓

✓ Results stored in DB with:
  - athleteId
  - performance
  - rank (1-8)
  - points (5, 3, 1, or 0)
```

### Test 5.2: Best Athlete Engine

**Steps:**
1. Navigate to Phase 5 dashboard (if available)
2. Click **View Best Athletes**

**Expected Results:**
```
✓ Best Male Athlete shown (top by AFI points)
  - Name and college displayed
  - Total AFI points calculated
  - Event-wise breakdown visible
  - Top 10 male athletes list shown

✓ Best Female Athlete shown (top by AFI points)
  - Name and college displayed
  - Total AFI points calculated
  - Event-wise breakdown visible
  - Top 10 female athletes list shown

Verification:
✓ AFI aggregation correct (sum of all events)
✓ Ranking by total AFI points (descending)
✓ Top 10 displayed correctly
✓ Event breakdown shows individual AFI contributions
```

### Test 5.3: Team Championship Scoring

**Steps:**
1. Click **View Team Championship**

**Expected Results:**
```
✓ Champion highlighted prominently
  - College name
  - Total points
  - Medal count (Gold, Silver, Bronze)

✓ Runner-up and 3rd place shown

✓ Full rankings table:
  - College | Points | Gold | Silver | Bronze
  - RVCE    | 125   | 5    | 3      | 2
  - BMSCE   | 98    | 3    | 4      | 3
  - MSRIT   | 87    | 2    | 2      | 4
  - ... etc (descending by points)

Verification:
✓ Medal count correct (5 pts for 1st, 3 pts for 2nd, 1 pt for 3rd)
✓ Total points calculated correctly
✓ Rankings sorted descending
✓ Medal table shows all events
✓ College with highest points = Champion
```

### Test 5.4: Announcement Generation

**Steps:**
1. Click **View Announcements**
2. System generates final announcements

**Expected Results:**
```
✓ Event-wise announcements:
  "Rajesh Kumar (RVCE) wins 100m Male with 10.22 seconds!"
  "2nd: Vikram Singh (BMSCE) - 10.35 seconds"
  "3rd: Amit Patel (MSRIT) - 10.48 seconds"

✓ Best Athlete announcements:
  "Best Male Athlete: Rajesh Kumar (RVCE) with 2150 AFI points"
  "Best Female Athlete: Priya Sharma (BMSCE) with 1980 AFI points"

✓ Team Championship announcement:
  "RVCE wins the Team Championship with 125 points!"
  "2nd: BMSCE with 98 points"
  "3rd: MSRIT with 87 points"

✓ Announcements are grammatically correct
✓ Professional formatting
✓ All data accurate
```

### Test 5.5: Combined Events (If Applicable)

**For Decathlon/Heptathlon:**

**Steps:**
1. Create a "Decathlon Men" event (Combined category)
2. Generate Day 1 and Day 2 sheets separately
3. For each day, enter only TOTAL POINTS (not individual event scores)
4. Final ranking by total points

**Expected Results:**
```
✓ Day 1 sheet shows: 100m, LJ, SP, HJ, 400m
✓ Day 2 sheet shows: 110m H, DT, PV, JT, 1500m
✓ Only total points field visible (not individual events)
✓ Highest points = Rank 1
✓ Results stored in combinedPoints collection
```

---

## 🟩 DATA PERSISTENCE VERIFICATION

### Test 6.1: Check MongoDB Collections

**Command in MongoDB Console:**
```javascript
// Events collection
db.events.find({}).pretty()

// Results collection
db.results.find({}).pretty()

// Team Scores collection
db.teamscores.find({}).pretty()

// Athletes collection
db.athletes.find({}).pretty()
```

**Expected Findings:**
```
✓ events collection:
  - Event record with name, category, gender, date, time, venue
  - topSelection array with athlete IDs
  - heats array with heat assignments and lanes
  - finalResults array with athlete IDs and points
  - statusFlow tracking all stages

✓ results collection:
  - One document per athlete per event per round
  - Fields: eventId, athleteId, performance, round, rank, points
  - For Phase 5: afiPoints, isCountedForBestAthlete
  - Sorted by rank

✓ teamscores collection:
  - Document per college
  - College name, category, total points
  - eventDetails array showing points by event
  - totalAFIPoints field (Phase 5)
  - Sorted by total points descending

✓ athletes collection:
  - Athlete record with name, gender, chestNo, college
  - Event references: event1, event2, relay1, relay2
  - All Phase 1-5 fields present
```

---

## 🟦 UI BEHAVIOR & PERFORMANCE TESTS

### Test 7.1: Button Functionality

**Checklist:**
```
[ ] Create Event button - Works
[ ] Generate Call Room button - Works
[ ] Complete Call Room button - Works
[ ] Generate Sheets button - Works
[ ] Score Round 1 button - Works
[ ] Select Top 8/16 buttons - Work
[ ] Generate Heats button - Works
[ ] Pre-Final Sheet button - Works
[ ] Final Scoring button - Works
[ ] View Best Athletes button - Works
[ ] View Team Championship button - Works
[ ] Generate Announcement button - Works
[ ] All Print/PDF buttons - Work
[ ] All navigation buttons (Next/Back) - Work
```

### Test 7.2: Navigation Workflow

**Test Workflow:**
```
Dashboard
  → Create Event (Stage 1)
    → Call Room Generation (Stage 2)
      → Call Room Completion (Stage 3)
        → Generate Sheets (Stage 4)
          → Round 1 Scoring (Stage 5)
            → Top Selection (Stage 6)
              → Heats Generation (Stage 7)
                → Pre-Final Sheet (Stage 8)
                  → Final Scoring (Stage 9)
                    → View Results (Championship, Best Athletes)
                      → Announcements
```

**Verification:**
- [ ] Each stage transition smooth
- [ ] Back button returns to previous stage
- [ ] Dashboard always accessible
- [ ] No data loss during navigation
- [ ] Proper error messages if stage cannot proceed

### Test 7.3: Performance Test (600+ Athletes)

**Setup:**
1. Manually seed database with 600 athletes across 10 events
   OR use existing seeding script

**Testing:**
```
[ ] Page loads within 3 seconds
[ ] Athlete list scrolls smoothly
[ ] No freezing during rendering
[ ] Sorting 600 athletes: < 100ms
[ ] Tab navigation still smooth
[ ] Input formatting still responsive (< 5ms per keystroke)
[ ] Print functionality works even with large dataset
```

**Expected Results:**
```
✓ System handles 600 athletes without lag
✓ No "Not Responding" messages
✓ Sorting and filtering < 100ms
✓ Input formatting < 5ms
✓ Print still functional and fast
```

---

## ⚠️ ERROR HANDLING TESTS

### Test 8.1: Invalid Input Handling

**Tests:**
1. **Invalid Time Format:**
   - Enter "99:99:99:99" → Should handle gracefully
   - Enter "ABC" → Should be ignored or shown as error

2. **Special Cases:**
   - Enter "DNF" → Should be accepted as Did Not Finish
   - Enter "DIS" → Should be accepted as Disqualified

3. **Missing Data:**
   - Try to proceed without entering all scores → Should show error
   - Try to create event without required fields → Should show validation error

**Verification:**
- [ ] Invalid input caught
- [ ] Error messages clear
- [ ] User guided to fix issue
- [ ] No system crashes
- [ ] No data corruption

### Test 8.2: Network Error Handling

**Tests:**
1. Stop backend server
2. Try to perform action that requires API call
3. Observe error handling
4. Restart backend
5. Verify system recovers

**Expected Results:**
```
✓ Error message shown to user
✓ User informed to try again
✓ No blank screens or crashes
✓ After server restart, system recovers
✓ No data loss from interrupted operation
```

---

## 📋 TEST EXECUTION SUMMARY TEMPLATE

```
╔══════════════════════════════════════════════════════════════╗
║         PHASE 1-5 QA TEST EXECUTION SUMMARY
╚══════════════════════════════════════════════════════════════╝

Date: ________________
Tester: ________________
System: ________________

TEST RESULTS:

Phase 1 - Event Creation
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 2 - Call Room Generation
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 3 - Round 1 Scoring
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 4 - Top Selection & Heats
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 4 - Pre-Final Sheet
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 5 - Final Scoring
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 5 - Best Athlete Engine
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 5 - Team Championship
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Phase 5 - Announcements
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

Data Persistence
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

UI Behavior & Performance
  Status: ☐ PASS  ☐ FAIL  ☐ PARTIAL
  Issues: _________________________________

OVERALL: ☐ PASS  ☐ FAIL  ☐ NEEDS REWORK

Sign-Off: ________________  Date: ________________
```

---

## 🎯 CRITICAL SUCCESS CRITERIA

All of the following MUST PASS for Phase 1-5 approval:

1. ✅ **Event Creation Works** - Events create and appear in UI
2. ✅ **Call Room Generates** - All athletes load with correct details
3. ✅ **Attendance Marking Works** - PRESENT/ABSENT/DIS filtering works
4. ✅ **Time Formatting Works** - Auto-formats without cursor jump
5. ✅ **Tab Navigation Works** - Smooth, predictable stage transitions
6. ✅ **Cursor Never Disappears** - Input always visible during typing
7. ✅ **Sorting Correct** - Track time ascending, field distance descending
8. ✅ **IAAF Lane Mapping** - Lanes assigned correctly (1→3, 2→4, etc.)
9. ✅ **Final Scoring** - Medal points calculated (5/3/1)
10. ✅ **Database Persistent** - All data saved to MongoDB
11. ✅ **Best Athlete Ranking** - Top 10 displayed by AFI points
12. ✅ **Team Championship** - Colleges ranked by total points
13. ✅ **Announcements Generate** - Professional text output
14. ✅ **No System Crashes** - Error handling graceful
15. ✅ **Performance Acceptable** - 600+ athletes handled smoothly

---

**All tests must be completed before Phase 6 (PDF Export) begins.**
