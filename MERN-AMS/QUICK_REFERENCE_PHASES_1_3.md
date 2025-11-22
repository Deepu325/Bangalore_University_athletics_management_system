# Quick Reference Card - Phases 1-3 Implementation

## 📋 What Was Built

### 1️⃣ Tab Navigation in Scoring
```jsx
// Stage5Round1Scoring now has Tab support
// Press Tab → moves to next athlete's input
// Shift+Tab → moves to previous athlete
// Works in all event types
```

### 2️⃣ Top Selection System (8/16)
```javascript
// Backend: POST /api/events/:eventId/top-selection
// Frontend: selectTopAthletes(8) or selectTopAthletes(16)
// Database: Stored in Event.topSelection field
```

### 3️⃣ IAAF Heats with Lane Mapping
```javascript
// Before: Random lanes 1-8
// After: IAAF standard mapping (seed→lane)
// 70 athletes: [8,8,8,8,8,8,7,7,7] heats
// No same-college in same heat
```

### 4️⃣ Time Utilities Library
```javascript
import { digitsToMs, sortByTime, getTopAthletes } from './utils/timeFormatter';
// digitsToMs("00:01:23:45") → 83450ms
// sortByTime(athletes) → sorted ascending
// getTopAthletes(athletes, 8, 'Track') → top 8
```

### 5️⃣ Enhanced Database
```javascript
// Event model now stores:
// - round1Results (ranked athletes)
// - topSelection (8/16 metadata)
// - heats (with lanes)
// - heatsResults (after scoring)
// - finalResults (rankings + points)
// - combinedPoints (team scores)
```

---

## 🚀 Quick Start Testing

### Test 1: Tab Navigation
```
1. Create event (Track category)
2. Add 10+ athletes (mark PRESENT)
3. Go to Stage 5: Round 1 Scoring
4. Click first athlete's time input
5. Press Tab → focus moves to next athlete ✓
6. Shift+Tab → focus moves back ✓
```

### Test 2: Top Selection
```
1. After Round 1: All athletes ranked
2. Click "Top 8 Athletes" button
3. Check MongoDB: Event.topSelection.selectedCount = 8 ✓
4. Check appState: topSelection = 8, topAthletes populated ✓
```

### Test 3: Heats Generation
```
1. With 18 athletes: Should create 2 heats of 8 + 1 heat of 2 → merge = 9, 9
2. With 16 athletes: Should create 2 heats of 8 ✓
3. With 23 athletes: Should create 2 heats of 8 + 1 heat of 7 ✓
4. Verify lanes: Lane 3 for seed 1, Lane 4 for seed 2, etc. ✓
```

### Test 4: Time Utilities
```javascript
const ms = digitsToMs("00:01:23:45");
console.log(ms); // Should be 83450 ✓

const sorted = sortByTime(athletes);
console.log(sorted[0].performance); // Fastest time ✓

const top8 = getTopAthletes(athletes, 8, 'Track');
console.log(top8.length); // Should be 8 ✓
```

### Test 5: Database Persistence
```javascript
// MongoDB query
db.events.findOne().topSelection
// Should show: { selectedCount: 8, selectedAthleteIds: [...], timestamp: ... }
```

---

## 🔑 Key Files & Locations

| File | Purpose | Lines |
|------|---------|-------|
| `frontend/src/components/ScoreInputs.js` | Input components + Tab support | 100+ |
| `frontend/src/utils/heatGenerator.js` | IAAF heats generation | 350+ |
| `frontend/src/utils/timeFormatter.js` | Time utilities (NEW) | 230+ |
| `frontend/src/components/EventManagementNew.jsx` | Stage 5-6 updates + refs | 1000+ |
| `backend/routes/events.js` | API endpoint for top-selection | 50+ |
| `backend/models/Event.js` | Enhanced Event schema | 100+ |

---

## 🛠️ Common Tasks

### Add Tab Navigation to New Input
```jsx
// Already done for TimeInput, DecimalInput, IntegerInput
// For new inputs, just add:
const handleKeyDown = (e) => {
  if (onKeyDown) onKeyDown(e, athleteId);
};

// Use forwardRef(({ athleteId, onKeyDown, ... }, ref) => ...)
// Inside component: <input ref={ref} onKeyDown={handleKeyDown} />
```

### Generate Heats
```javascript
import { generateHeats } from '../utils/heatGenerator';

const heats = generateHeats(athletes);
// Returns: [
//   [{ ...athlete, heatNo: 1, seed: 1, lane: 3 }, ...],
//   [{ ...athlete, heatNo: 2, seed: 1, lane: 3 }, ...],
// ]
```

### Sort Athletes by Time
```javascript
import { sortByTime, digitsToMs } from '../utils/timeFormatter';

const sorted = sortByTime(athletes);
// Or manually:
const sorted = athletes.sort((a, b) => 
  digitsToMs(a.performance) - digitsToMs(b.performance)
);
```

### Call Top Selection API
```javascript
const response = await axios.post(
  `${API_BASE_URL}/api/events/${eventId}/top-selection`,
  { selectedCount: 8, selectedAthleteIds: [id1, id2, ...] }
);
// Returns: { success: true, topSelection: {...} }
```

### Query Database for Top Selection
```javascript
// MongoDB
db.events.findOne({ _id: eventId })
  .then(event => console.log(event.topSelection))
// Output: { selectedCount: 8, selectedAthleteIds: [...], timestamp: ..., status: 'SELECTED' }
```

---

## 📊 Expected Outputs

### Heat Distribution Examples
| Athletes | Heat Pattern | Heats |
|----------|-------------|-------|
| 70 | 8+8+8+8+8+8+7+7+7 | 9 heats |
| 50 | 8+8+8+8+8+7 | 6 heats |
| 23 | 8+8+7 | 3 heats |
| 16 | 8+8 | 2 heats |
| 8 | 8 | 1 heat |

### Lane Mapping
| Seed | Lane | Rank |
|------|------|------|
| 1 | 3 | Best (fastest/farthest) |
| 2 | 4 | 2nd best |
| 3 | 2 | 3rd best |
| 4 | 5 | |
| 5 | 6 | |
| 6 | 1 | |
| 7 | 7 | |
| 8 | 8 | Worst (slowest/shortest) |

### Top Selection State
```javascript
// After clicking "Top 8 Athletes"
appState = {
  topSelection: 8,
  topAthletes: [athlete1, athlete2, ...],
  oddGroup: [],
  evenGroup: [],
  statusFlow: { topSelected: true }
}

// Database saved:
event.topSelection = {
  selectedCount: 8,
  selectedAthleteIds: ["id1", "id2", ...],
  timestamp: "2025-11-21T...",
  status: "SELECTED"
}
```

---

## ⚠️ Common Issues & Fixes

### Tab Not Working in Round 1
**Symptom:** Tab opens browser navigation  
**Fix:** Ensure `handleTabNavigation()` calls `e.preventDefault()`  
**Check:** `frontend/src/components/EventManagementNew.jsx` line ~1710

### Heats Show Same College
**Symptom:** Multiple athletes from same college in one heat  
**Fix:** Verify `useCollegeSeparation: true` in generateHeats options  
**Check:** `frontend/src/utils/heatGenerator.js` line ~50

### Time Conversion Wrong
**Symptom:** "00:01:23:45" converts to wrong value  
**Fix:** Ensure no leading zeros removed before padding  
**Check:** `frontend/src/utils/timeFormatter.js` digitsToMs()

### Top Selection Not Saving
**Symptom:** Database doesn't show topSelection field  
**Fix:** Ensure API endpoint being called, not just legacy endpoint  
**Check:** Network tab → POST /api/events/:eventId/top-selection

### Lane Numbers Not Showing
**Symptom:** Lane column shows undefined  
**Fix:** Ensure useLaneMapping: true in generateHeats  
**Check:** Verify athlete.lane property is set (line in heatGenerator)

---

## 📞 API Reference

### POST /api/events/:eventId/top-selection
```json
// Request
POST /api/events/507f1f77bcf86cd799439011/top-selection
{
  "selectedCount": 8,
  "selectedAthleteIds": ["athlete1_id", "athlete2_id", ...]
}

// Response
{
  "success": true,
  "message": "Top 8 athletes selected and saved",
  "topSelection": {
    "selectedCount": 8,
    "selectedAthleteIds": [...],
    "timestamp": "2025-11-21T10:30:00Z",
    "status": "SELECTED"
  }
}
```

---

## ✅ Validation Checklist

- [ ] Tab navigation works in Round 1
- [ ] Top 8 selection saves to database
- [ ] Top 16 selection with groups works
- [ ] Heats generated with correct distribution
- [ ] Lane mapping correct (seed→lane)
- [ ] No same-college athletes in same heat
- [ ] Time conversion accurate
- [ ] Database queries return expected results

---

## 🎯 Performance Tips

### Tab Navigation
- ✅ Refs stored in inputRefsMap for O(1) lookup
- ✅ No re-rendering on Tab (just focus change)
- ✅ Instant feedback to user

### Heats Generation
- ✅ O(n log n) complexity (acceptable for 100+ athletes)
- ✅ Greedy algorithm prevents exponential search
- ✅ Pre-computed LANE_MAP array

### Database
- ✅ Single document update for persistence
- ✅ No nested queries needed
- ✅ Index on Event._id automatically created

---

## 🚀 Next Phase Preview (Phase 4)

What's coming next:
- [ ] Heats Scoring Stage (new stage)
- [ ] Post /api/events/:eventId/heats endpoint
- [ ] Auto-select Top 8 from heats results
- [ ] Pre-Final sheet with correct lanes
- [ ] Finals Scoring and Announcement
- [ ] PDF export functionality

**Estimated Timeline:** 1-2 weeks  
**Complexity:** Medium (mostly UI + API routes)  
**Dependencies:** All Phase 1-3 work must be done first

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| `FEATURE_IMPLEMENTATION_STATUS.md` | Comprehensive status + API docs |
| `IMPLEMENTATION_GUIDE_PHASES_4_5.md` | Code examples for next phases |
| `SESSION_SUMMARY_PHASE_1_3.md` | Detailed technical summary |
| **This file** | Quick reference (you are here) |

---

**Last Updated:** 2025-11-21  
**Version:** 1.0 Quick Reference  
**Status:** Ready for Phase 4 planning
