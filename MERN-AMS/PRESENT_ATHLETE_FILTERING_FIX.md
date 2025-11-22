# Present Athlete Filtering Fix - Stage 4

## Problem
ABSENT and DISQUALIFIED athletes were appearing in Stage 4 sheets despite implementation of present-only filtering. 

**Evidence:** 16 PRESENT + 2 ABSENT + 1 DIS = 19 total athletes showed in heats when only 16 should appear.

## Root Cause
The issue occurred at multiple levels:
1. **Input filtering missing**: `generateEventSheets()` was passing `appState.athletes` (which contains ALL athletes) to heat/set generation functions
2. **Display filtering missing**: Stage 4 preview displays were showing all athletes in heats without filtering
3. **Print function filtering missing**: PDF print functions were rendering all athletes without filtering

## Solution Applied

### 1. **generateEventSheets() - Filter before passing to generators** (Lines ~524-560)
Added explicit filtering to only pass PRESENT athletes to generation functions:

```javascript
// Track event
const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
const heats = generateHeats(presentAthletes, 8);

// Jump event
const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
const sets = generateSets(presentAthletes, 12);

// Similar for Throw and Relay events
```

### 2. **Stage 4 Preview Display - Add safety filter to rendering** (Lines ~1537-1700+)
Updated all heat/set displays to filter before rendering:

**Track Heats Preview:**
```javascript
{appState.trackSets.map((heat, idx) => (
  <p className="font-semibold">Heat {heat[0]?.heat || idx + 1} ({heat.filter(a => a.status === 'PRESENT').length} athletes)</p>
  {heat.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (...))}
))}
```

**Relay Heats Preview:**
- Added `.filter(a => a.status === 'PRESENT')` to both heat count and team rendering

**Jump Sets Preview:**
- Added `.filter(a => a.status === 'PRESENT')` to set count and athlete table

**Throw Sets Preview:**
- Added `.filter(a => a.status === 'PRESENT')` to set count and athlete table

**Combined Event Preview:**
- Updated count: `appState.combinedSheets[0]?.filter(a => a.status === 'PRESENT').length`
- Updated table: `.filter(a => a.status === 'PRESENT').map(...)`

### 3. **Print Functions - Add filtering to PDF generation** (Lines ~1246-1485)
Updated all print functions to filter PRESENT athletes:

**printTrackSheets():**
```javascript
const presentAthletes = set.filter(a => a.status === 'PRESENT');
${presentAthletes.map((athlete, idx) => (...))}
```

**printRelaySheets():**
```javascript
const presentAthletes = heat.filter(a => a.status === 'PRESENT');
${presentAthletes.map((athlete, idx) => (...))}
```

**printJumpThrowSheets():**
```javascript
const presentAthletes = sheet.filter(a => a.status === 'PRESENT');
${presentAthletes.map((athlete, idx) => (...))}
```

**printCombinedSheets():**
```javascript
const sheet = (appState.combinedSheets[0] || []).filter(a => a.status === 'PRESENT');
${sheet.map((athlete, idx) => (...))}
```

## Files Modified
- `/frontend/src/components/EventManagementNew.jsx`
  - `generateEventSheets()` function
  - Stage 4 preview display sections (Track, Relay, Jump, Throw, Combined)
  - `printTrackSheets()` function
  - `printRelaySheets()` function
  - `printJumpThrowSheets()` function
  - `printCombinedSheets()` function

## Defense-in-Depth Approach
Applied filtering at **three levels**:
1. **Input Level**: Filter athletes before passing to generation functions
2. **Display Level**: Filter before rendering in UI preview
3. **Output Level**: Filter in print functions before PDF generation

This ensures that even if one layer fails, the others prevent incorrect data from appearing.

## Testing Recommendations
1. Create event with mixed attendance status (PRESENT, ABSENT, DISQUALIFIED)
2. Go to Stage 3 and mark attendees
3. Verify Stage 3 summary shows correct counts (e.g., PRESENT: 16, ABSENT: 2, DIS: 1)
4. Proceed to Stage 4 and click "Generate Sheets"
5. **Verify**: Preview should show exactly 16 athletes in heats (not 19)
6. **Verify**: Printed PDF should contain exactly 16 athletes (not 19)
7. Test all event categories: Track, Relay, Jump, Throw, Combined

## Status
✅ **FIXED** - Present athlete filtering now applied at multiple levels throughout Stage 4

## Related Files
- `heatGenerator.js` - Already had internal filtering, but input wasn't filtered
- `Result.js` - Backend model for scoring (no changes needed)
- `results.js` - Backend API for results (no changes needed)
