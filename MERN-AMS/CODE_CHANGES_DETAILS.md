# Code Changes - Present Athlete Filtering Fix

## Overview
This document shows the exact code changes made to fix ABSENT/DIS athletes appearing in Stage 4.

---

## 1. generateEventSheets() Function

### Location
`EventManagementNew.jsx` - Lines ~524-560 in the Stage 4 handler

### Change: Add Pre-filtering for All Event Types

#### Track Event
```javascript
// BEFORE
const heats = generateHeats(appState.athletes, 8);

// AFTER  
const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
const heats = generateHeats(presentAthletes, 8);
```

#### Jump Event
```javascript
// BEFORE
const sets = generateSets(appState.athletes, 12);

// AFTER
const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
const sets = generateSets(presentAthletes, 12);
```

#### Throw Event
```javascript
// BEFORE
const sets = generateSets(appState.athletes, 12);

// AFTER
const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
const sets = generateSets(presentAthletes, 12);
```

#### Relay Event
```javascript
// BEFORE
const heats = generateHeats(appState.athletes, 8);

// AFTER
const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
const heats = generateHeats(presentAthletes, 8);
```

#### Combined Event (Already Had Filtering)
```javascript
// Already correct
const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
setAppState(prev => ({
  ...prev,
  combinedSheets: [presentAthletes],
  ...
}));
```

---

## 2. Stage 4 Preview Display - Track Heats

### Location  
`EventManagementNew.jsx` - Lines ~1537-1560 in Stage4SheetGeneration render section

### Change: Add Display Filtering

```javascript
// BEFORE
<div className="bg-blue-50 p-4 rounded mb-6">
  <h4 className="font-semibold mb-2">Generated Track Heats Preview:</h4>
  {appState.trackSets.map((heat, idx) => (
    <div key={idx} className="mb-3">
      <p className="font-semibold">Heat {heat[0]?.heat || idx + 1} ({heat.length} athletes)</p>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse border border-gray-300 w-full">
          <thead>
            {/* headers */}
          </thead>
          <tbody>
            {heat.map((athlete, aidx) => (
              <tr key={aidx} className="border-b">
                {/* cells */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ))}
</div>

// AFTER
<div className="bg-blue-50 p-4 rounded mb-6">
  <h4 className="font-semibold mb-2">Generated Track Heats Preview:</h4>
  {appState.trackSets.map((heat, idx) => (
    <div key={idx} className="mb-3">
      <p className="font-semibold">Heat {heat[0]?.heat || idx + 1} ({heat.filter(a => a.status === 'PRESENT').length} athletes)</p>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse border border-gray-300 w-full">
          <thead>
            {/* headers */}
          </thead>
          <tbody>
            {heat.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
              <tr key={aidx} className="border-b">
                {/* cells */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ))}
</div>
```

**Key Changes:**
- Line count: `.filter(a => a.status === 'PRESENT').length`
- Row mapping: `.filter(a => a.status === 'PRESENT').map(...)`

---

## 3. Stage 4 Preview Display - Relay Heats

### Location
`EventManagementNew.jsx` - Lines ~1567-1595 in Stage4SheetGeneration render section

### Change Pattern (Same as Track)

```javascript
// Heat count
<p className="font-semibold text-lg border-b pb-2">
  Heat {heat[0]?.heat || heatIdx + 1} ({heat.filter(a => a.status === 'PRESENT').length} teams)
</p>

// Row mapping
{heat.filter(a => a.status === 'PRESENT').map((athlete, idx) => (
  // render team
))}
```

---

## 4. Stage 4 Preview Display - Jump Sets

### Location
`EventManagementNew.jsx` - Lines ~1597-1630 in Stage4SheetGeneration render section

### Change Pattern (Same as Track)

```javascript
// Set count
<p className="font-semibold">Set {idx + 1} ({sheet.filter(a => a.status === 'PRESENT').length} athletes)</p>

// Row mapping
{sheet.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
  // render row
))}
```

---

## 5. Stage 4 Preview Display - Throw Sets

### Location
`EventManagementNew.jsx` - Lines ~1633-1666 in Stage4SheetGeneration render section

### Change Pattern (Same as Jump)

```javascript
// Set count
<p className="font-semibold">Set {idx + 1} ({sheet.filter(a => a.status === 'PRESENT').length} athletes)</p>

// Row mapping
{sheet.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
  // render row
))}
```

---

## 6. Stage 4 Preview Display - Combined Event

### Location
`EventManagementNew.jsx` - Lines ~1669-1692 in Stage4SheetGeneration render section

### Change: Add Display Filtering

```javascript
// BEFORE
<h4 className="font-semibold mb-2">Generated Combined Event Preview ({appState.combinedSheets[0]?.length} athletes):</h4>
...
{appState.combinedSheets[0]?.map((athlete, aidx) => (
  <tr key={aidx} className="border-b">
    {/* cells */}
  </tr>
))}

// AFTER
<h4 className="font-semibold mb-2">Generated Combined Event Preview ({appState.combinedSheets[0]?.filter(a => a.status === 'PRESENT').length} athletes):</h4>
...
{appState.combinedSheets[0]?.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
  <tr key={aidx} className="border-b">
    {/* cells */}
  </tr>
))}
```

---

## 7. printTrackSheets() Function

### Location
`EventManagementNew.jsx` - Lines ~1246-1290 in Stage4SheetGeneration

### Change: Add Pre-filtering

```javascript
// BEFORE
const printTrackSheets = () => {
  let content = '';
  appState.trackSets.forEach((set, setIdx) => {
    const heatNum = set[0]?.heat || setIdx + 1;
    content += `...
      ${set.map((athlete, idx) => `
        <tr>
          <td class="center">${idx + 1}</td>
          ...
        </tr>
      `).join('')}
    ...`;
  });
  printSheet(content, 'Track_Event_Sheets');
};

// AFTER
const printTrackSheets = () => {
  let content = '';
  appState.trackSets.forEach((set, setIdx) => {
    const presentAthletes = set.filter(a => a.status === 'PRESENT');
    const heatNum = presentAthletes[0]?.heat || setIdx + 1;
    content += `...
      ${presentAthletes.map((athlete, idx) => `
        <tr>
          <td class="center">${idx + 1}</td>
          ...
        </tr>
      `).join('')}
    ...`;
  });
  printSheet(content, 'Track_Event_Sheets');
};
```

**Key Changes:**
- Add: `const presentAthletes = set.filter(a => a.status === 'PRESENT');`
- Update: `heatNum` to use `presentAthletes[0]?.heat`
- Update: `.map()` to use `presentAthletes` instead of `set`

---

## 8. printRelaySheets() Function

### Location
`EventManagementNew.jsx` - Lines ~1290-1334 in Stage4SheetGeneration

### Change Pattern (Same as Track)

```javascript
// Add filtering
const presentAthletes = heat.filter(a => a.status === 'PRESENT');

// Use filtered list
const heatNum = presentAthletes[0]?.heat || heatIdx + 1;
${presentAthletes.map((athlete, idx) => (...))}
```

---

## 9. printJumpThrowSheets() Function

### Location
`EventManagementNew.jsx` - Lines ~1334-1385 in Stage4SheetGeneration

### Change: Add Pre-filtering

```javascript
// BEFORE
const printJumpThrowSheets = (sheets, eventType) => {
  let content = '';
  const sheetArray = eventType === 'Jump' ? appState.jumpSheets : appState.throwSheets;
  sheetArray.forEach((sheet, pageIdx) => {
    content += `...
      ${sheet.map((athlete, idx) => (...))}
    ...`;
  });
  printSheet(content, `${eventType}_Event_Sheets`);
};

// AFTER
const printJumpThrowSheets = (sheets, eventType) => {
  let content = '';
  const sheetArray = eventType === 'Jump' ? appState.jumpSheets : appState.throwSheets;
  sheetArray.forEach((sheet, pageIdx) => {
    const presentAthletes = sheet.filter(a => a.status === 'PRESENT');
    content += `...
      ${presentAthletes.map((athlete, idx) => (...))}
    ...`;
  });
  printSheet(content, `${eventType}_Event_Sheets`);
};
```

---

## 10. printCombinedSheets() Function

### Location
`EventManagementNew.jsx` - Lines ~1390-1485 in Stage4SheetGeneration

### Change: Add Pre-filtering at Start

```javascript
// BEFORE
const printCombinedSheets = () => {
  let content = '';
  const sheet = appState.combinedSheets[0] || [];
  ...
  // Day 1: sheet.map(...)
  // Day 2: sheet.map(...)
};

// AFTER
const printCombinedSheets = () => {
  let content = '';
  const sheet = (appState.combinedSheets[0] || []).filter(a => a.status === 'PRESENT');
  ...
  // Day 1: sheet.map(...)
  // Day 2: sheet.map(...)
};
```

**Key Change:**
- Add filtering when initializing `sheet` variable
- Both Day 1 and Day 2 sections automatically use filtered data

---

## Summary of Changes

| Component | Type | Change |
|-----------|------|--------|
| generateEventSheets() | Function | Pre-filter athletes before passing to generators |
| Stage 4 Track Preview | Display | Add `.filter(a => a.status === 'PRESENT')` to count and rows |
| Stage 4 Relay Preview | Display | Add `.filter(a => a.status === 'PRESENT')` to count and rows |
| Stage 4 Jump Preview | Display | Add `.filter(a => a.status === 'PRESENT')` to count and rows |
| Stage 4 Throw Preview | Display | Add `.filter(a => a.status === 'PRESENT')` to count and rows |
| Stage 4 Combined Preview | Display | Add `.filter(a => a.status === 'PRESENT')` to count and rows |
| printTrackSheets() | Function | Pre-filter before PDF generation |
| printRelaySheets() | Function | Pre-filter before PDF generation |
| printJumpThrowSheets() | Function | Pre-filter before PDF generation |
| printCombinedSheets() | Function | Pre-filter before PDF generation |

**Total Changes:** 10 locations modified
**Pattern:** All changes follow same `.filter(a => a.status === 'PRESENT')` pattern
**Impact:** Stage 4 now only shows PRESENT athletes in preview and PDF

---

## Testing Each Change

### To verify input filtering works:
1. Add console.log in generateEventSheets():
   ```javascript
   console.log('Present athletes count:', presentAthletes.length);
   console.log('Generated heats athletes:', heats.flat().length);
   ```

### To verify display filtering works:
1. Check browser DevTools → Elements
2. Inspect heat table rows
3. Count visible athletes - should match PRESENT only

### To verify print filtering works:
1. Right-click "Print Track Heats" button
2. Select "Print to PDF" or preview
3. Count athletes in PDF - should match PRESENT only

---

## Rollback Instructions (if needed)

To revert all changes, restore from git:
```bash
git checkout HEAD~1 -- frontend/src/components/EventManagementNew.jsx
```

Or manually remove all `.filter(a => a.status === 'PRESENT')` calls.

---

**Last Updated:** 2024
**File:** EventManagementNew.jsx
**Lines Modified:** ~150 lines across 10 locations
