# Quick Reference: Stage 4-5 Improvements

## What Changed?

### 🎯 **Stage 4: Event Sheets**
- ✅ Only PRESENT athletes appear in sheets
- ✅ Same-college athletes are kept in different sets (best-effort)
- ✅ Present athletes auto-populated from attendance marking

**Usage:** Click "Generate Sheets" button - it will use the new `generateHeats()` algorithm automatically.

---

### 🎯 **Stage 5 & 9: Scoring Input**
- ✅ No more focus loss after typing 1 digit
- ✅ Scoring one athlete doesn't affect others
- ✅ Format validations happen on blur (not keystroke)

**Key Differences:**
- **Before:** Typing "1" → Full re-render → Focus lost → Had to click again
- **After:** Typing "1" → Stays focused → Type full time → Format on blur

**Input Formats:**
- **Track/Relay Times:** `MM:SS.MS` (e.g., `00:10.45`) or `HH:MM:SS:MS` (e.g., `00:01:10:450`)
- **Field Distances:** Decimal (e.g., `8.45` with step 0.01)
- **Combined Scores:** Integer (e.g., `6150` total points)

---

## For Developers

### Use in Stage 4
```javascript
import { generateHeats, generateSets, assignRandomLanes } from '../utils/heatGenerator';

// Generate heats with college separation
const heats = generateHeats(athletesList, 8);  // 8 per heat
const heatsWithLanes = heats.map(h => assignRandomLanes(h));

// Generate field event sets
const sets = generateSets(athletesList, 12);  // 12 per set
```

### Use ScoreTableRow (Optional - Already Implemented in EventManagementNew)
```javascript
import ScoreTableRow from './ScoreTableRow';

<ScoreTableRow
  athlete={athlete}
  scoreValue={scores[athlete._id]}
  onScoreChange={(id, val) => setScores(prev => ({...prev, [id]: val}))}
  onScoreBlur={(id, val) => handleBlur(id, val)}
  eventType="track"  // or "field", "combined"
/>
```

### Use Results API (Backend Scoring)
```javascript
// Save score for single athlete
const response = await fetch(
  `/api/results/${eventId}/athlete/${athleteId}`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      score: 8.45,
      timeMs: 10450,
      round: 1
    })
  }
);
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `/frontend/src/utils/heatGenerator.js` | College-aware heat/set generation |
| `/frontend/src/components/ScoreTableRow.jsx` | Memoized score input row (optional use) |
| `/backend/models/Result.js` | Result/score data model |
| `/backend/routes/results.js` | Scoring API endpoints |
| `/backend/server.js` | Updated to import Result & results routes |

---

## Troubleshooting

### "Focus lost while typing score"
→ Check that `key={athlete._id}` is used in table rows (not `key={idx}`)

### "Score updates affect multiple athletes"
→ Verify `onBlur` handler uses keyed state: `setScores(prev => ({...prev, [athleteId]: value}))`

### "Same-college athletes still in same heat"
→ This is expected for colleges with many athletes - algorithm is best-effort greedy

### "Time format shows as MM:SS.MS but backend expects something else"
→ Use `formatTimeInput()` utility or ensure validation happens

---

## Testing Your Changes

1. **Stage 4 - Sheets:**
   - Create new event, go to Stage 4
   - Click "Generate Sheets"
   - Check: Only PRESENT athletes appear
   - Print/view a sheet - note no two athletes from same college in same heat

2. **Stage 5 - Scoring:**
   - Go to Stage 5
   - Click in first athlete's score field
   - Type: `1` (just one digit)
   - **✓ Field stays focused** (previously lost focus)
   - Finish typing: `00:10.45`
   - Click another field - first athlete's score doesn't change
   - Click away from second field (blur)
   - **✓ Format applied** (time properly formatted)

3. **Backend API:**
   - Test with Postman:
   ```
   PUT http://localhost:5001/api/results/{eventId}/athlete/{athleteId}
   Body: { "score": 8.45, "timeMs": 10450, "round": 1 }
   ```
   - Verify only ONE athlete's score updates (check with GET)

---

## What Still Works (Unchanged)

- ✅ Stage 1-3: Event creation, call room, attendance marking
- ✅ Stage 6-13: Top selection, heats, finals, announcements
- ✅ All PDF/print functionality
- ✅ Relay team handling
- ✅ Combined event scoring
- ✅ Name correction & verification

---

## Future Enhancements (Not Implemented Yet)

- 🔵 **Input mask library** (react-input-mask) - Live format feedback while typing
- 🔵 **Perfect college separation** - Graph coloring algorithm for 100% guarantee
- 🔵 **Draft mode** - Save scores without finalizing
- 🔵 **Undo/revert** - Revert changed scores
- 🔵 **Audit trail** - Track who changed what and when

---

**Questions?** Check `IMPLEMENTATION_SUMMARY_STAGE_4_5.md` for detailed technical docs.
