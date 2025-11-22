# Testing Guide: Stage 4-5 Improvements

**Created:** November 20, 2025  
**Status:** Ready for QA Testing

---

## Pre-Testing Setup

### Backend
```bash
cd backend
npm install  # Ensure all dependencies installed
npm start    # Should show API routes including /api/results
```

Expected output:
```
✓ BU-AMS Backend Server running on http://localhost:5001
  - PUT    /api/results/:eventId/athlete/:athleteId (Stage 5 - Scoring)
  - PATCH  /api/results/:eventId/athlete/:athleteId (Stage 5 - Scoring)
  - GET    /api/results/:eventId (Stage 5 - Results)
```

### Frontend
```bash
cd frontend
npm start    # Should run on http://localhost:3000
```

---

## Test Cases

### TEST 1: Stage 4 - Sheet Generation with College Separation

**Setup:**
1. Create event: "100m Men Track"
2. Mark 16 athletes present (4 athletes from each of 4 colleges: A, B, C, D)
3. Go to Stage 4 "Generate Sheets"

**Execute:**
1. Click "📋 Generate Sheets" button
2. Review generated heats

**Expected Results:**
- ✓ Only 16 athletes appear (all marked PRESENT)
- ✓ Heats contain 8 athletes each (2 heats)
- ✓ NO two athletes from same college in same heat
  - Heat 1: A1, B1, C1, D1, A2, B2, C2, D2
  - Heat 2: A3, B3, C3, D3, A4, B4, C4, D4
- ✓ Lane numbers random (1-8, no duplicates within heat)

**Pass Criteria:** All ✓ checks pass

**Failure Scenarios:**
- ❌ Absent athletes appear in sheets → Check status filtering in generateHeats()
- ❌ Same college in same heat → Check college grouping logic
- ❌ More than 8 per heat → Check heat size calculation

---

### TEST 2: Stage 5 - Score Input Focus (Main Bug Fix)

**Setup:**
1. Proceed to Stage 5 "Round 1 Scoring"
2. Have at least 2 athletes listed

**Execute - Test Case A: Focus Persistence**
1. Click on first athlete's score field
2. Type a single character: `1`
3. **CHECK:** Field still focused (cursor visible)
4. Type remaining: `0:10.45`
5. Click on second athlete's field

**Expected Results:**
- ✓ After typing `1`, field REMAINS focused (not blurred)
- ✓ Can continue typing without re-clicking
- ✓ First athlete's score shows: `10:10.45` or formatted value
- ✓ Second athlete's field is empty (unaffected by first)

**Pass Criteria:** All ✓ checks pass

**Execute - Test Case B: Format on Blur**
1. Click first athlete's score field
2. Type: `1010.45` (no colons - raw input)
3. Leave field (click elsewhere)
4. **CHECK:** Format applied to `10:10.45` or similar

**Expected Results:**
- ✓ While typing `1010.45`, no formatting happens
- ✓ After blur, format applied automatically
- ✓ Display shows formatted time

**Pass Criteria:** Both test cases pass

**Failure Scenarios:**
- ❌ Focus lost after 1 keystroke → Check row keys (should use `_id`)
- ❌ Formatting happens on keystroke → Check handlers (should only format onBlur)
- ❌ Field value shows format codes → Check formatTimeInput() function
- ❌ Other athletes' scores change → Check keyed state (scores[id])

---

### TEST 3: Score Input - No Cross-Athlete Interference

**Setup:**
1. Stage 5, 3+ athletes listed
2. Have scores for first 2 athletes

**Execute:**
1. Enter score for Athlete A: `00:10.45`
2. Enter score for Athlete B: `00:11.20`
3. **CHECK:** Athlete A's score unchanged
4. Clear Athlete B's field
5. **CHECK:** Athlete A's score still `00:10.45`

**Expected Results:**
- ✓ Athlete A's score never changes when editing Athlete B
- ✓ Each athlete has independent state
- ✓ Clearing one field doesn't affect others

**Pass Criteria:** All ✓ checks pass

**Failure Scenarios:**
- ❌ Athlete A's score changes → Check keyed state implementation
- ❌ Clearing athlete B affects A → Check that state.scores is independent

---

### TEST 4: Different Event Type Input Formats

**Setup:** Create events in different categories

**Execute - Track Event (Time Format):**
1. Go to Stage 5
2. Check input field placeholders show: `00:10.45`
3. Try entering: `1010.45` (no format)
4. Blur and check format applied

**Expected Results:**
- ✓ Placeholder shows time format
- ✓ Input accepts raw digits
- ✓ Format applied on blur

**Execute - Field Event (Decimal Format):**
1. Jump/Throw event, Stage 5
2. Check input field placeholders show: `5.71`
3. Try entering: `8.45`
4. Input should accept step 0.01

**Expected Results:**
- ✓ Placeholder shows decimal
- ✓ `<input type="number" step="0.01">`
- ✓ Can enter values like `8.45`

**Execute - Combined Event (Integer Format):**
1. Decathlon/Heptathlon, Stage 5
2. Check input field placeholders show: `6100` (points)
3. Try entering: `6150`

**Expected Results:**
- ✓ Placeholder shows integer
- ✓ `<input type="number" step="1">`
- ✓ Only integers accepted

**Pass Criteria:** All three event types work correctly

---

### TEST 5: Stage 9 Final Scoring (Same Fixes as Stage 5)

**Setup:**
1. Complete Stages 1-8
2. Go to Stage 9 "Final Scoring"

**Execute:**
- Repeat TEST 2 (Focus) and TEST 3 (Interference) for Stage 9

**Expected Results:**
- ✓ Same fixes apply to final scoring
- ✓ No focus loss
- ✓ Independent scores

**Pass Criteria:** Stage 9 behaves identically to Stage 5

---

### TEST 6: Backend Results API - Single Athlete Update

**Setup:**
1. Get eventId and athleteId from database or UI
2. Have Postman or curl ready

**Execute - Single Athlete Update:**
```bash
curl -X PUT \
  http://localhost:5001/api/results/{eventId}/athlete/{athleteId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "score": 8.45,
    "timeMs": 10450,
    "round": 1
  }'
```

**Expected Results:**
```json
{
  "success": true,
  "result": {
    "_id": "...",
    "event": "{eventId}",
    "athlete": "{athleteId}",
    "score": 8.45,
    "timeMs": 10450,
    "round": 1,
    "updatedAt": "2025-11-20T..."
  }
}
```

**Verify - No Other Athletes Affected:**
1. Query GET /api/results/{eventId}
2. Check only one athlete's score changed

```bash
curl -X GET \
  http://localhost:5001/api/results/{eventId} \
  -H "Authorization: Bearer {token}"
```

**Expected Results:**
- ✓ Only one result record with updated athlete
- ✓ Other athletes' results unchanged or missing

**Pass Criteria:** Both checks pass

**Failure Scenarios:**
- ❌ Multiple athletes updated → Check backend uses findOneAndUpdate with specific filter
- ❌ Error "Duplicate key" → Check unique index on {event, athlete}

---

### TEST 7: Stable Keys - React Remount Prevention

**Setup:**
1. Stage 5 with visible athletes list
2. Open browser DevTools > Elements

**Execute:**
1. Right-click first athlete's input field
2. Inspect element, note its DOM position
3. Enter score in different athlete's field
4. Re-inspect first athlete's input field

**Expected Results:**
- ✓ First athlete's input field DOM DOESN'T unmount/remount
- ✓ Field retains focus capability
- ✓ No "key" warnings in console

**Pass Criteria:** No remounts detected

**Failure Scenarios:**
- ❌ Input field remounts → Check that `key={a._id}` used (not `key={idx}`)
- ❌ Console warnings about keys → Check all map() renders have stable keys

---

### TEST 8: Relay Event Scoring

**Setup:**
1. Create relay event (4 per team)
2. Go to Stage 5

**Execute:**
1. Check that team structure preserved
2. Enter team score (only first athlete row shows input)
3. Check team score entered correctly

**Expected Results:**
- ✓ Team shows 4 athlete rows
- ✓ Score input only on first row of team
- ✓ Team time updated correctly

**Pass Criteria:** Relay scoring works

---

### TEST 9: Performance - Large Athlete List

**Setup:**
1. Create event with 100+ athletes
2. Go to Stage 4

**Execute:**
1. Generate sheets (generateHeats with large list)
2. Note execution time (should be < 1 second)
3. Go to Stage 5 with all 100+ athletes

**Expected Results:**
- ✓ Sheets generate in < 1 second
- ✓ Score input still responsive (no lag)
- ✓ No browser freeze

**Pass Criteria:** Performance acceptable

---

### TEST 10: Combined Event (Decathlon/Heptathlon)

**Setup:**
1. Create combined event
2. Go to Stage 4

**Execute:**
1. Generate sheets (should filter present athletes only)
2. Go to Stage 5
3. Enter total points (e.g., 6150)

**Expected Results:**
- ✓ Only present athletes shown
- ✓ Input accepts integer points
- ✓ Input works with step=1

**Pass Criteria:** Combined events work

---

## Edge Cases to Test

| Case | Expected Behavior |
|------|------------------|
| Single athlete in event | Generates 1 heat, works normally |
| All athletes same college | Generates heats, college constraint unavoidable |
| Many colleges, 1 athlete each | Perfect separation (best case) |
| College with more athletes than heats | Greedy places in different heats as possible |
| 0 present athletes | Empty heats/sets generated |
| Score field with special chars | Ignored or rejected (input type=number filters) |
| Rapid score changes | State updates correctly, no interference |
| Backend down | Frontend shows error "Failed to save score" |

---

## Regression Testing

Verify these still work (unchanged functionality):

- ✓ Stage 1-3 Event creation & attendance
- ✓ Stage 6 Top selection (8 or 16)
- ✓ Stage 7 Heat distribution for finals
- ✓ Stage 8 Pre-final sheets
- ✓ Stage 10-13 Announcements & verification
- ✓ PDF/Print for all sheets
- ✓ Relay team handling throughout
- ✓ Name correction (Stage 11)

---

## Issue Reporting Template

If you find issues:

```
**Title:** [Component] Brief description
**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
...

**Actual Result:**
...

**Screenshots/Video:** [if applicable]

**Browser:** Chrome 120 / Firefox 121 / etc.
**OS:** Windows 10 / macOS / Linux

**Backend Log:**
[paste any errors from terminal]

**Browser Console:**
[paste any errors from DevTools console]
```

---

## Automated Test Script (Optional)

Create `/testing/test-stages-4-5.js`:

```javascript
// TODO: Add automated test suite using Jest/Cypress
// Test cases: generateHeats, keyed state, API endpoints
```

---

**Testing Complete? Move to Production ✅**

Once all tests pass, deployment ready.
